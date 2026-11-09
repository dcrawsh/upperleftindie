export const SUBMISSION_AUDIO_PENDING_RETENTION_DAYS = 90;
export const SUBMISSION_AUDIO_ORPHAN_RETENTION_HOURS = 24;

/**
 * @typedef {Object} RetainedSubmissionAudio
 * @property {string | null | undefined} audio_storage_path
 * @property {string | null | undefined} audio_upload_status
 * @property {string | null | undefined} audio_expires_at
 * @property {string | null | undefined} audio_deleted_at
 * @property {string | null | undefined} radio_removed_at
 * @property {string | null | undefined} replied_at
 * @property {string} status
 */

/**
 * @param {RetainedSubmissionAudio} submission
 * @param {number} [now]
 * @returns {"delete-removed" | "expire-pending" | null}
 */
export function getSubmissionAudioCleanupAction(submission, now = Date.now()) {
  if (!submission.audio_storage_path || submission.audio_deleted_at) {
    return null;
  }

  if (
    submission.status === "rejected" ||
    submission.audio_upload_status === "removed" ||
    submission.radio_removed_at
  ) {
    return "delete-removed";
  }

  if (
    submission.status !== "pending" ||
    submission.audio_upload_status !== "uploaded" ||
    submission.replied_at ||
    !submission.audio_expires_at
  ) {
    return null;
  }

  const expiresAt = Date.parse(submission.audio_expires_at);

  return Number.isFinite(expiresAt) && expiresAt <= now
    ? "expire-pending"
    : null;
}

/**
 * @param {{ path: string, createdAt: string | null }} object
 * @param {Set<string>} referencedPaths
 * @param {number} [now]
 */
export function isAbandonedSubmissionAudio(
  object,
  referencedPaths,
  now = Date.now()
) {
  if (referencedPaths.has(object.path) || !object.createdAt) {
    return false;
  }

  const createdAt = Date.parse(object.createdAt);
  const retentionMs = SUBMISSION_AUDIO_ORPHAN_RETENTION_HOURS * 60 * 60 * 1000;

  return Number.isFinite(createdAt) && createdAt <= now - retentionMs;
}
