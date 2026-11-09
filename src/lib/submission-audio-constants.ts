export const MAX_SUBMISSION_AUDIO_MEGABYTES = 12;
export const MAX_SUBMISSION_AUDIO_BYTES =
  MAX_SUBMISSION_AUDIO_MEGABYTES * 1024 * 1024;

/** Leaves free-tier headroom for pending uploads and storage cleanup retries. */
export const RECOMMENDED_RADIO_TRACK_LIMIT = 60;
