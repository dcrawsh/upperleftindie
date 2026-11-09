import {
  supabasePath,
  supabaseRequest,
  SupabaseRequestError,
} from "@/lib/supabase";
import {
  RADIO_RIGHTS_VERSION,
  removeSubmissionAudio,
  type VerifiedSubmissionAudio,
} from "@/lib/submission-audio";
import { SUBMISSION_AUDIO_PENDING_RETENTION_DAYS } from "@/lib/submission-audio-retention";
import { MAX_ARTIST_BIO_CHARACTERS } from "@/lib/submission-constants";

// Re-exported so existing `instanceof` narrowing in route handlers keeps
// working against a single class identity.
export { SupabaseRequestError };

const submissionsTable = "submissions";

export type SubmissionStatus = "pending" | "added" | "rejected" | "archived";

export type Submission = {
  id: string;
  created_at: string;
  updated_at?: string | null;
  status: SubmissionStatus;
  artist_name: string;
  contact_name: string;
  email: string;
  city: string;
  region: string;
  genre: string;
  song_link: string | null;
  track_title?: string | null;
  bandcamp_link?: string | null;
  social_link?: string | null;
  notes?: string | null;
  artist_bio?: string | null;
  artist_bio_approved_at?: string | null;
  artist_page_consent: boolean;
  subscribe_to_newsletter: boolean;
  spotify_track_id?: string | null;
  spotify_track_uri?: string | null;
  active_playlist_added_at?: string | null;
  archived_at?: string | null;
  replied_at?: string | null;
  reply_subject?: string | null;
  admin_notes?: string | null;
  audio_storage_path?: string | null;
  audio_original_filename?: string | null;
  audio_mime_type?: string | null;
  audio_size_bytes?: number | null;
  audio_upload_status?: "uploaded" | "published" | "removed" | null;
  audio_expires_at?: string | null;
  audio_deleted_at?: string | null;
  radio_rights_version?: string | null;
  radio_rights_accepted_at?: string | null;
  radio_published_at?: string | null;
  radio_removed_at?: string | null;
  radio_playback_url?: string | null;
  radio_playback_url_expires_at?: string | null;
};

export type SubmissionPayload = {
  artistName?: unknown;
  contactName?: unknown;
  email?: unknown;
  city?: unknown;
  region?: unknown;
  genre?: unknown;
  songLink?: unknown;
  trackTitle?: unknown;
  audioUploadToken?: unknown;
  audioOriginalFilename?: unknown;
  radioRightsAccepted?: unknown;
  bandCampLink?: unknown;
  socialLink?: unknown;
  notes?: unknown;
  artistBio?: unknown;
  artistBioApproved?: unknown;
  artistPageConsent?: unknown;
  subscribeToNewsletter?: unknown;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeSubmissionPayload(
  payload: SubmissionPayload,
  audio?: VerifiedSubmissionAudio | null
) {
  const artistName = asString(payload.artistName);
  const contactName = asString(payload.contactName);
  const email = asString(payload.email);
  const songLink = asString(payload.songLink);
  const trackTitle = asString(payload.trackTitle);
  const artistBio = asString(payload.artistBio);

  if (!artistName || !contactName || !email) {
    throw new SupabaseRequestError(
      "Artist name, contact name, and email are required.",
      400
    );
  }

  if (!songLink && !audio) {
    throw new SupabaseRequestError(
      "Add a Spotify song link or upload an MP3.",
      400
    );
  }

  if (audio && !trackTitle) {
    throw new SupabaseRequestError(
      "Track title is required with an MP3 upload.",
      400
    );
  }

  if (audio && payload.radioRightsAccepted !== true) {
    throw new SupabaseRequestError(
      "Confirm that you have permission to submit the MP3 for radio play.",
      400
    );
  }

  if (artistBio.length > MAX_ARTIST_BIO_CHARACTERS) {
    throw new SupabaseRequestError(
      `Artist bio must be ${MAX_ARTIST_BIO_CHARACTERS} characters or fewer.`,
      400
    );
  }

  if (artistBio && payload.artistBioApproved !== true) {
    throw new SupabaseRequestError(
      "Confirm that the artist bio may be displayed publicly.",
      400
    );
  }

  return {
    artist_name: artistName,
    contact_name: contactName,
    email,
    city: asString(payload.city),
    region: asString(payload.region),
    genre: asString(payload.genre),
    song_link: songLink || null,
    track_title: trackTitle || null,
    bandcamp_link: asString(payload.bandCampLink) || null,
    social_link: asString(payload.socialLink) || null,
    notes: asString(payload.notes) || null,
    artist_bio: artistBio || null,
    artist_bio_approved_at: artistBio ? new Date().toISOString() : null,
    artist_page_consent: payload.artistPageConsent === true,
    subscribe_to_newsletter: payload.subscribeToNewsletter !== false,
    ...(audio
      ? {
          audio_storage_path: audio.storagePath,
          audio_original_filename:
            asString(payload.audioOriginalFilename).slice(0, 255) || null,
          audio_mime_type: audio.mimeType,
          audio_size_bytes: audio.size,
          audio_upload_status: "uploaded" as const,
          audio_expires_at: new Date(
            Date.now() +
              SUBMISSION_AUDIO_PENDING_RETENTION_DAYS * 24 * 60 * 60 * 1000
          ).toISOString(),
          audio_deleted_at: null,
          radio_rights_version: RADIO_RIGHTS_VERSION,
          radio_rights_accepted_at: new Date().toISOString(),
        }
      : {}),
  };
}

export async function createSubmission(
  payload: SubmissionPayload,
  audio?: VerifiedSubmissionAudio | null
) {
  const submission = normalizeSubmissionPayload(payload, audio);
  const rows = await supabaseRequest<Submission[]>(submissionsTable, {
    method: "POST",
    body: JSON.stringify(submission),
    prefer: "return=representation",
  });

  return rows[0];
}

export async function discardUnreferencedSubmissionAudio(storagePath: string) {
  const path = supabasePath(submissionsTable, {
    select: "id",
    audio_storage_path: `eq.${storagePath}`,
    limit: 1,
  });
  const rows = await supabaseRequest<Array<{ id: string }>>(path);

  if (rows.length > 0) {
    return false;
  }

  await removeSubmissionAudio(storagePath);
  return true;
}

export async function listSubmissions(status?: string) {
  const statusFilter =
    status && status !== "all"
      ? `&status=eq.${encodeURIComponent(status)}`
      : "";

  return supabaseRequest<Submission[]>(
    `${submissionsTable}?select=*&order=created_at.desc${statusFilter}`
  );
}

export async function listPublishedRadioSubmissions() {
  const path = supabasePath(submissionsTable, {
    select: "*",
    audio_upload_status: "eq.published",
    radio_published_at: "not.is.null",
    radio_removed_at: "is.null",
    order: "radio_published_at.desc",
  });

  return supabaseRequest<Submission[]>(path);
}

export async function getSubmission(id: string) {
  const rows = await supabaseRequest<Submission[]>(
    `${submissionsTable}?select=*&id=eq.${encodeURIComponent(id)}&limit=1`
  );

  return rows[0] ?? null;
}

export async function updateSubmission(
  id: string,
  values: Partial<Submission>
) {
  const rows = await supabaseRequest<Submission[]>(
    `${submissionsTable}?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(values),
      prefer: "return=representation",
    }
  );

  return rows[0] ?? null;
}

export async function updateSubmissionsByTrackUri(
  trackUri: string,
  values: Partial<Submission>
) {
  return supabaseRequest<Submission[]>(
    `${submissionsTable}?spotify_track_uri=eq.${encodeURIComponent(trackUri)}`,
    {
      method: "PATCH",
      body: JSON.stringify(values),
      prefer: "return=representation",
    }
  );
}
