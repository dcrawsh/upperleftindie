import {
  getSubmissionAudioCleanupAction,
  isAbandonedSubmissionAudio,
  SUBMISSION_AUDIO_ORPHAN_RETENTION_HOURS,
  SUBMISSION_AUDIO_PENDING_RETENTION_DAYS,
} from "../src/lib/submission-audio-retention.js";

const bucket = "submission-audio";
const pageSize = 1000;
const deleteBatchSize = 1000;
const applyDeletes = process.argv.includes("--delete");
const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before cleaning submission audio."
  );
}

const headers = {
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  "Content-Type": "application/json",
};

async function request(path, init = {}) {
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: { ...headers, ...init.headers },
  });

  if (!response.ok) {
    throw new Error(`Supabase cleanup request failed with ${response.status}.`);
  }

  if (response.status === 204) return undefined;

  const body = await response.text();
  return body.trim() ? JSON.parse(body) : undefined;
}

async function listSubmissionAudioRows() {
  const rows = [];

  for (let offset = 0; ; offset += pageSize) {
    const search = new URLSearchParams({
      select: [
        "id",
        "status",
        "song_link",
        "audio_storage_path",
        "audio_upload_status",
        "audio_expires_at",
        "audio_deleted_at",
        "radio_removed_at",
        "replied_at",
      ].join(","),
      audio_storage_path: "not.is.null",
      order: "id.asc",
      limit: String(pageSize),
      offset: String(offset),
    });
    const page = await request(`/rest/v1/submissions?${search}`);
    rows.push(...page);

    if (page.length < pageSize) return rows;
  }
}

function storagePath(prefix, name) {
  return prefix ? `${prefix}/${name}` : name;
}

async function listStorageObjects(rootPrefix) {
  const objects = [];
  const pendingPrefixes = [rootPrefix];
  const visitedPrefixes = new Set();

  while (pendingPrefixes.length > 0) {
    const prefix = pendingPrefixes.shift();
    if (!prefix || visitedPrefixes.has(prefix)) continue;
    visitedPrefixes.add(prefix);

    for (let offset = 0; ; offset += pageSize) {
      const page = await request(
        `/storage/v1/object/list/${encodeURIComponent(bucket)}`,
        {
          method: "POST",
          body: JSON.stringify({
            prefix,
            limit: pageSize,
            offset,
            sortBy: { column: "name", order: "asc" },
          }),
        }
      );

      for (const item of page) {
        const path = storagePath(prefix, item.name);
        const isFolder = item.id === null && item.metadata === null;

        if (isFolder) {
          pendingPrefixes.push(path);
        } else {
          objects.push({
            path,
            createdAt: item.created_at ?? null,
          });
        }
      }

      if (page.length < pageSize) break;
    }
  }

  return objects;
}

async function patchSubmission(id, values, extraFilters = {}) {
  const search = new URLSearchParams({ id: `eq.${id}`, ...extraFilters });
  return request(`/rest/v1/submissions?${search}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(values),
  });
}

function removedValues(now) {
  return {
    audio_upload_status: "removed",
    audio_expires_at: null,
    radio_published_at: null,
    radio_removed_at: now,
    radio_playback_url: null,
    radio_playback_url_expires_at: null,
  };
}

async function transitionExpiredSubmission(row, now) {
  const updated = await patchSubmission(
    row.id,
    {
      ...removedValues(now),
      ...(row.song_link ? {} : { status: "rejected" }),
    },
    {
      status: "eq.pending",
      audio_upload_status: "eq.uploaded",
      replied_at: "is.null",
      audio_expires_at: `lte.${now}`,
    }
  );

  return updated[0] ?? null;
}

async function transitionRemovedSubmission(row, now) {
  const updated = await patchSubmission(
    row.id,
    {
      ...removedValues(now),
      radio_removed_at: row.radio_removed_at ?? now,
    },
    { audio_deleted_at: "is.null" }
  );

  return updated[0] ?? null;
}

function chunks(values, size) {
  const result = [];

  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }

  return result;
}

async function deleteStorageObjects(paths) {
  for (const batch of chunks(paths, deleteBatchSize)) {
    await request(`/storage/v1/object/${encodeURIComponent(bucket)}`, {
      method: "DELETE",
      body: JSON.stringify({ prefixes: batch }),
    });
  }
}

async function markSubmissionAudioDeleted(id, deletedAt) {
  await patchSubmission(
    id,
    { audio_deleted_at: deletedAt },
    { audio_deleted_at: "is.null" }
  );
}

const nowMs = Date.now();
const now = new Date(nowMs).toISOString();
const [submissions, objects] = await Promise.all([
  listSubmissionAudioRows(),
  listStorageObjects("incoming"),
]);
const referencedPaths = new Set(
  submissions.map((row) => row.audio_storage_path).filter(Boolean)
);
const cleanupRows = submissions
  .map((row) => ({
    row,
    action: getSubmissionAudioCleanupAction(row, nowMs),
  }))
  .filter(({ action }) => action !== null);
const abandonedObjects = objects.filter((object) =>
  isAbandonedSubmissionAudio(object, referencedPaths, nowMs)
);

console.log(
  `Submission audio cleanup mode: ${applyDeletes ? "delete" : "dry run"}`
);
console.log(
  `Policy: pending ${SUBMISSION_AUDIO_PENDING_RETENTION_DAYS} days; abandoned ${SUBMISSION_AUDIO_ORPHAN_RETENTION_HOURS} hours.`
);
console.log(
  `Candidates: ${cleanupRows.length} referenced submission file(s), ${abandonedObjects.length} abandoned file(s).`
);

if (!applyDeletes) {
  console.log("No changes made. Pass --delete to apply this cleanup.");
  process.exit(0);
}

const transitionedRows = [];

for (const { row, action } of cleanupRows) {
  const transitioned =
    action === "expire-pending"
      ? await transitionExpiredSubmission(row, now)
      : await transitionRemovedSubmission(row, now);

  if (transitioned) transitionedRows.push(transitioned);
}

const existingPaths = new Set(objects.map((object) => object.path));
const referencedPathsToDelete = transitionedRows
  .map((row) => row.audio_storage_path)
  .filter((path) => path && existingPaths.has(path));
const pathsToDelete = [
  ...new Set([
    ...referencedPathsToDelete,
    ...abandonedObjects.map((object) => object.path),
  ]),
];

await deleteStorageObjects(pathsToDelete);

for (const row of transitionedRows) {
  await markSubmissionAudioDeleted(row.id, now);
}

console.log(
  `Cleanup complete: ${transitionedRows.length} submission row(s) finalized, ${pathsToDelete.length} stored file(s) deleted.`
);
