import { isSupabaseConfigured, supabaseRequest } from "@/lib/supabase";

export type TrackRating = 1 | 2 | 3 | 4 | 5;

/** Unrated tracks, including every track that predates ratings, rank here. */
export const DEFAULT_TRACK_RATING: TrackRating = 3;

type TrackRatingRow = {
  track_uri: string;
  rating: number;
};

export class TrackRatingStoreError extends Error {
  constructor(
    message: string,
    readonly status = 500
  ) {
    super(message);
  }
}

export function isTrackRating(value: unknown): value is TrackRating {
  return (
    value === 1 || value === 2 || value === 3 || value === 4 || value === 5
  );
}

/**
 * Spotify-backed radio tracks share their playlist rating. MP3-only tracks use
 * a namespaced key in the same private ratings table.
 */
export function getRadioTrackRatingKey(
  submissionId: string,
  spotifyTrackUri?: string | null
) {
  return spotifyTrackUri || `radio:submission:${submissionId}`;
}

async function trackRatingRequest<T>(
  path: string,
  init: RequestInit & { prefer?: string } = {}
): Promise<T> {
  // Routes only narrow on TrackRatingStoreError, so the unconfigured case must
  // not surface as a bare SupabaseRequestError.
  if (!isSupabaseConfigured()) {
    throw new TrackRatingStoreError("Supabase is not configured.");
  }

  return supabaseRequest<T>(path, {
    ...init,
    mapError: (status, details) => {
      const missingTable = status === 404 || details.includes("track_ratings");

      return new TrackRatingStoreError(
        missingTable
          ? "Track ratings are not installed. Apply the database migrations with yarn db:push."
          : details || `Track rating storage failed with ${status}`,
        status
      );
    },
  });
}

/** All stored ratings keyed by Spotify track URI. The table is one row per track. */
export async function listTrackRatings() {
  const rows = await trackRatingRequest<TrackRatingRow[]>(
    "track_ratings?select=track_uri,rating"
  );
  const ratings = new Map<string, TrackRating>();

  for (const row of rows) {
    if (isTrackRating(row.rating)) {
      ratings.set(row.track_uri, row.rating);
    }
  }

  return ratings;
}

export async function setTrackRating(trackUri: string, rating: TrackRating) {
  await trackRatingRequest("track_ratings?on_conflict=track_uri", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    body: JSON.stringify({ track_uri: trackUri, rating }),
  });
}

/** Store the default rating for tracks that have none, leaving existing ratings alone. */
export async function insertDefaultTrackRatings(trackUris: string[]) {
  if (trackUris.length === 0) return;

  await trackRatingRequest("track_ratings?on_conflict=track_uri", {
    method: "POST",
    prefer: "resolution=ignore-duplicates,return=minimal",
    body: JSON.stringify(
      [...new Set(trackUris)].map((trackUri) => ({
        track_uri: trackUri,
        rating: DEFAULT_TRACK_RATING,
      }))
    ),
  });
}
