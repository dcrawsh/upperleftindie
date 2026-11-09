import { randomInt } from "node:crypto";
import { findArtistByName } from "@/lib/artists";
import {
  createSignedSubmissionAudioUrl,
  SubmissionAudioError,
} from "@/lib/submission-audio";
import {
  isSupabaseConfigured,
  supabasePath,
  supabaseRequest,
} from "@/lib/supabase";

const PUBLIC_RADIO_COLUMNS = [
  "id",
  "artist_name",
  "track_title",
  "city",
  "region",
  "bandcamp_link",
  "social_link",
  "artist_bio",
  "artist_bio_approved_at",
  "audio_storage_path",
  "radio_playback_url",
  "radio_playback_url_expires_at",
].join(",");

const signedUrlLifetimeSeconds = 60 * 60;
const signedUrlReuseBufferMs = 5 * 60 * 1000;

type RadioTrackRow = {
  id: string;
  artist_name: string;
  track_title: string | null;
  city: string | null;
  region: string | null;
  bandcamp_link: string | null;
  social_link: string | null;
  artist_bio: string | null;
  artist_bio_approved_at: string | null;
  audio_storage_path: string;
  radio_playback_url: string | null;
  radio_playback_url_expires_at: string | null;
};

export type PublicRadioTrack = {
  id: string;
  artistName: string;
  trackTitle: string;
  place: string;
  artistUrl: string | null;
  artistBio: string | null;
  imageSrc: string | null;
  audioUrl: string;
};

export class RadioError extends Error {
  constructor(
    message: string,
    readonly status = 500
  ) {
    super(message);
  }
}

function formatPlace(city: string | null, region: string | null) {
  return [city?.trim(), region?.trim()].filter(Boolean).join(", ");
}

export function getReusableRadioAudioUrl(
  values: {
    url: string | null;
    expiresAt: string | null;
  },
  now = Date.now()
) {
  if (!values.url || !values.expiresAt) {
    return null;
  }

  const expiresAt = Date.parse(values.expiresAt);

  return Number.isFinite(expiresAt) && expiresAt > now + signedUrlReuseBufferMs
    ? values.url
    : null;
}

export function getApprovedArtistBio(
  bio: string | null,
  approvedAt: string | null
) {
  return approvedAt ? bio?.trim() || null : null;
}

async function getRadioAudioUrl(track: RadioTrackRow) {
  const reusableUrl = getReusableRadioAudioUrl({
    url: track.radio_playback_url,
    expiresAt: track.radio_playback_url_expires_at,
  });

  if (reusableUrl) {
    return reusableUrl;
  }

  const audioUrl = await createSignedSubmissionAudioUrl(
    track.audio_storage_path,
    signedUrlLifetimeSeconds
  );
  const expiresAt = new Date(
    Date.now() + signedUrlLifetimeSeconds * 1000
  ).toISOString();

  await supabaseRequest<void>(
    supabasePath("submissions", { id: `eq.${track.id}` }),
    {
      method: "PATCH",
      body: JSON.stringify({
        radio_playback_url: audioUrl,
        radio_playback_url_expires_at: expiresAt,
      }),
      prefer: "return=minimal",
      mapError: (status) =>
        new RadioError(
          "The radio playback cache could not be updated.",
          status
        ),
    }
  ).catch((error) =>
    console.error("radio playback URL cache update error", error)
  );

  return audioUrl;
}

export async function getNextRadioTrack(excludeId = "") {
  if (!isSupabaseConfigured()) {
    throw new RadioError("Upper Left Radio is not configured yet.", 503);
  }

  const path = supabasePath("submissions", {
    select: PUBLIC_RADIO_COLUMNS,
    audio_upload_status: "eq.published",
    radio_published_at: "not.is.null",
    radio_removed_at: "is.null",
    order: "radio_published_at.desc",
    limit: "200",
  });
  const rows = await supabaseRequest<RadioTrackRow[]>(path, {
    mapError: (status) =>
      new RadioError("Upper Left Radio could not load its catalog.", status),
  });
  const alternatives = rows.filter((row) => row.id !== excludeId);
  const candidates = alternatives.length > 0 ? alternatives : rows;

  if (candidates.length === 0) {
    return null;
  }

  const selected = candidates[randomInt(candidates.length)];
  const directoryArtist = findArtistByName(selected.artist_name);

  try {
    return {
      id: selected.id,
      artistName: selected.artist_name,
      trackTitle: selected.track_title?.trim() || "Untitled",
      place: formatPlace(selected.city, selected.region),
      artistUrl: selected.bandcamp_link || selected.social_link,
      artistBio: getApprovedArtistBio(
        selected.artist_bio,
        selected.artist_bio_approved_at
      ),
      imageSrc: directoryArtist?.image || null,
      audioUrl: await getRadioAudioUrl(selected),
    } satisfies PublicRadioTrack;
  } catch (error) {
    if (error instanceof SubmissionAudioError) {
      throw new RadioError("The next radio track could not be loaded.", 502);
    }

    throw error;
  }
}
