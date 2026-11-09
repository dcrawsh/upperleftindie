import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import {
  getSupabaseConfig,
  supabaseRequest,
  supabaseStorageBytes,
  supabaseStorageRequest,
} from "@/lib/supabase";
import {
  MAX_SUBMISSION_AUDIO_BYTES,
  MAX_SUBMISSION_AUDIO_MEGABYTES,
} from "@/lib/submission-audio-constants";

export { MAX_SUBMISSION_AUDIO_BYTES } from "@/lib/submission-audio-constants";

export const SUBMISSION_AUDIO_BUCKET = "submission-audio";
export const RADIO_RIGHTS_VERSION = "radio-license-v1";

const uploadTokenLifetimeMs = 2 * 60 * 60 * 1000;
const maxUploadPreparationsPerDay = 5;

type AudioUploadClaims = {
  path: string;
  size: number;
  mimeType: "audio/mpeg";
  expiresAt: number;
};

export type VerifiedSubmissionAudio = {
  storagePath: string;
  size: number;
  mimeType: "audio/mpeg";
};

type StorageObjectInfo = {
  metadata?: {
    size?: number | string;
    mimetype?: string;
  };
};

type SignedUploadResponse = {
  url: string;
};

type SignedPlaybackResponse = {
  signedURL: string;
};

export class SubmissionAudioError extends Error {
  constructor(
    message: string,
    readonly status = 500
  ) {
    super(message);
  }
}

function storageError(status: number, details: string) {
  return new SubmissionAudioError(
    details || `Submission audio storage failed with ${status}.`,
    status
  );
}

function encodeStoragePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function tokenSecret() {
  return getSupabaseConfig().key;
}

function uploadsEnabled() {
  return (
    process.env.SUBMISSION_AUDIO_UPLOADS_ENABLED?.trim().toLowerCase() !==
    "false"
  );
}

export async function assertSubmissionAudioUploadAllowed(
  clientAddress: string | null
) {
  if (!clientAddress) {
    return;
  }

  const keyHash = createHmac("sha256", tokenSecret())
    .update(`submission-audio-upload:${clientAddress}`)
    .digest("hex");
  const allowed = await supabaseRequest<boolean>(
    "rpc/claim_submission_audio_upload",
    {
      method: "POST",
      body: JSON.stringify({
        p_key_hash: keyHash,
        p_max_requests: maxUploadPreparationsPerDay,
        p_window_seconds: 24 * 60 * 60,
      }),
      mapError: (status) =>
        new SubmissionAudioError(
          "MP3 upload limits could not be checked. Try again later.",
          status
        ),
    }
  );

  if (!allowed) {
    throw new SubmissionAudioError(
      "Too many MP3 uploads were started from this connection today. Try again tomorrow or submit a Spotify link.",
      429
    );
  }
}

function signPayload(payload: string) {
  return createHmac("sha256", tokenSecret())
    .update(payload)
    .digest("base64url");
}

function createUploadToken(claims: AudioUploadClaims) {
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `${payload}.${signPayload(payload)}`;
}

export function validateAudioUploadRequest(values: {
  fileName?: unknown;
  size?: unknown;
  mimeType?: unknown;
}) {
  const fileName =
    typeof values.fileName === "string" ? values.fileName.trim() : "";
  const size =
    typeof values.size === "number" && Number.isSafeInteger(values.size)
      ? values.size
      : 0;
  const mimeType =
    typeof values.mimeType === "string"
      ? values.mimeType.trim().toLowerCase()
      : "";

  if (!fileName || !fileName.toLowerCase().endsWith(".mp3")) {
    throw new SubmissionAudioError("Choose an MP3 file to upload.", 400);
  }

  if (fileName.length > 255) {
    throw new SubmissionAudioError("The MP3 filename is too long.", 400);
  }

  if (mimeType && mimeType !== "audio/mpeg" && mimeType !== "audio/mp3") {
    throw new SubmissionAudioError("The uploaded file must be an MP3.", 400);
  }

  if (size < 1 || size > MAX_SUBMISSION_AUDIO_BYTES) {
    throw new SubmissionAudioError(
      `The MP3 must be ${MAX_SUBMISSION_AUDIO_MEGABYTES} MB or smaller.`,
      400
    );
  }

  return { fileName, size, mimeType: "audio/mpeg" as const };
}

export function hasMp3FileSignature(bytes: Uint8Array) {
  const hasId3Tag =
    bytes.length >= 3 &&
    bytes[0] === 0x49 &&
    bytes[1] === 0x44 &&
    bytes[2] === 0x33;
  const hasFrameSync =
    bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;

  return hasId3Tag || hasFrameSync;
}

export async function createSubmissionAudioUpload(
  values: {
    fileName?: unknown;
    size?: unknown;
    mimeType?: unknown;
  },
  clientAddress: string | null = null
) {
  if (!uploadsEnabled()) {
    throw new SubmissionAudioError(
      "MP3 uploads are temporarily paused. Submit a Spotify link or try again later.",
      503
    );
  }

  const audio = validateAudioUploadRequest(values);
  await assertSubmissionAudioUploadAllowed(clientAddress);
  const uploadDate = new Date().toISOString().slice(0, 10);
  const path = `incoming/${uploadDate}/${randomUUID()}.mp3`;
  const encodedPath = encodeStoragePath(`${SUBMISSION_AUDIO_BUCKET}/${path}`);
  const data = await supabaseStorageRequest<SignedUploadResponse>(
    `object/upload/sign/${encodedPath}`,
    {
      method: "POST",
      body: "{}",
      mapError: storageError,
    }
  );
  const config = getSupabaseConfig();
  const uploadUrl = `${config.url}/storage/v1${data.url}`;
  const uploadToken = createUploadToken({
    path,
    size: audio.size,
    mimeType: audio.mimeType,
    expiresAt: Date.now() + uploadTokenLifetimeMs,
  });

  return { uploadUrl, uploadToken };
}

function readUploadToken(token: string): AudioUploadClaims {
  const [payload, signature, extra] = token.split(".");

  if (!payload || !signature || extra) {
    throw new SubmissionAudioError("The MP3 upload token is invalid.", 400);
  }

  const expected = Buffer.from(signPayload(payload));
  const received = Buffer.from(signature);

  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    throw new SubmissionAudioError("The MP3 upload token is invalid.", 400);
  }

  try {
    const claims = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as Partial<AudioUploadClaims>;

    if (
      typeof claims.path !== "string" ||
      !claims.path.startsWith("incoming/") ||
      typeof claims.size !== "number" ||
      claims.mimeType !== "audio/mpeg" ||
      typeof claims.expiresAt !== "number" ||
      claims.expiresAt < Date.now()
    ) {
      throw new Error("invalid claims");
    }

    return claims as AudioUploadClaims;
  } catch {
    throw new SubmissionAudioError(
      "The MP3 upload expired. Choose the file and try again.",
      400
    );
  }
}

export async function verifySubmissionAudioUpload(
  token: string
): Promise<VerifiedSubmissionAudio> {
  const claims = readUploadToken(token);
  const encodedPath = encodeStoragePath(
    `${SUBMISSION_AUDIO_BUCKET}/${claims.path}`
  );
  const info = await supabaseStorageRequest<StorageObjectInfo>(
    `object/info/${encodedPath}`,
    { mapError: storageError }
  );
  const storedSize = Number(info.metadata?.size);
  const storedMimeType = info.metadata?.mimetype?.toLowerCase();

  if (!Number.isFinite(storedSize) || storedSize !== claims.size) {
    throw new SubmissionAudioError(
      "The uploaded MP3 did not match the selected file. Try again.",
      400
    );
  }

  if (storedMimeType && storedMimeType !== "audio/mpeg") {
    throw new SubmissionAudioError("The uploaded file must be an MP3.", 400);
  }

  const header = await supabaseStorageBytes(`object/${encodedPath}`, {
    range: "bytes=0-9",
    mapError: storageError,
  });

  if (!hasMp3FileSignature(header)) {
    throw new SubmissionAudioError(
      "The uploaded file does not appear to be a valid MP3.",
      400
    );
  }

  return {
    storagePath: claims.path,
    size: claims.size,
    mimeType: claims.mimeType,
  };
}

export async function assertSubmissionAudioExists(path: string) {
  const encodedPath = encodeStoragePath(`${SUBMISSION_AUDIO_BUCKET}/${path}`);
  await supabaseStorageRequest<StorageObjectInfo>(
    `object/info/${encodedPath}`,
    {
      mapError: storageError,
    }
  );
}

export async function removeSubmissionAudio(path: string) {
  await supabaseStorageRequest<unknown>(
    `object/${encodeURIComponent(SUBMISSION_AUDIO_BUCKET)}`,
    {
      method: "DELETE",
      body: JSON.stringify({ prefixes: [path] }),
      mapError: storageError,
    }
  );
}

export async function createSignedSubmissionAudioUrl(
  path: string,
  expiresIn = 60 * 60
) {
  const encodedPath = encodeStoragePath(`${SUBMISSION_AUDIO_BUCKET}/${path}`);
  const data = await supabaseStorageRequest<SignedPlaybackResponse>(
    `object/sign/${encodedPath}`,
    {
      method: "POST",
      body: JSON.stringify({ expiresIn }),
      mapError: storageError,
    }
  );
  const config = getSupabaseConfig();
  return `${config.url}/storage/v1${data.signedURL}`;
}
