import {
  getRankedInsertIndex,
  planPlaylistMoves,
  sortRankedTracks,
} from "@/lib/playlist-order";
import {
  addTrackToActivePlaylist,
  listActivePlaylistTracks,
  reorderActivePlaylistTracks,
  SpotifyRequestError,
  unarchiveTrack,
  type SpotifyPlaylistTrack,
} from "@/lib/spotify";
import {
  DEFAULT_TRACK_RATING,
  insertDefaultTrackRatings,
  listTrackRatings,
  setTrackRating,
  type TrackRating,
} from "@/lib/track-ratings";

/**
 * The active playlist joined with curator ratings. Spotify owns the order and
 * Supabase owns the ratings; this module is where the two meet.
 */
export type RatedPlaylistTrack = SpotifyPlaylistTrack & { rating: TrackRating };

function withRatings(
  tracks: SpotifyPlaylistTrack[],
  ratings: Map<string, TrackRating>
): RatedPlaylistTrack[] {
  return tracks.map((track) => ({
    ...track,
    rating: ratings.get(track.uri) ?? DEFAULT_TRACK_RATING,
  }));
}

export async function listRatedActivePlaylistTracks() {
  const [tracks, ratings] = await Promise.all([
    listActivePlaylistTracks(),
    listTrackRatings(),
  ]);

  const unrated = tracks
    .filter((track) => !ratings.has(track.uri))
    .map((track) => track.uri);

  if (unrated.length > 0) {
    // Tracks added straight in Spotify have no row yet. Storing the default
    // is bookkeeping only; the in-memory default already ranks them.
    await insertDefaultTrackRatings(unrated).catch((error) => {
      console.error("default track ratings could not be stored", error);
    });
  }

  return withRatings(tracks, ratings);
}

/**
 * Placement for a track joining the playlist now. Ratings only steer the
 * position, so a ratings outage must never block an acceptance: unreadable
 * ratings fall back to the default for every track. An explicit `rating`
 * (chosen on the acceptance draft) wins over whatever is stored.
 */
async function getInsertPosition(trackUri: string, rating?: TrackRating) {
  const [tracks, ratings] = await Promise.all([
    listActivePlaylistTracks(),
    listTrackRatings().catch((error) => {
      console.error("track ratings unavailable for placement", error);
      return new Map<string, TrackRating>();
    }),
  ]);

  return getRankedInsertIndex(withRatings(tracks, ratings), {
    rating: rating ?? ratings.get(trackUri) ?? DEFAULT_TRACK_RATING,
    addedAt: new Date().toISOString(),
  });
}

export async function addRatedTrackToActivePlaylist(
  trackUri: string,
  rating?: TrackRating
) {
  await addTrackToActivePlaylist(
    trackUri,
    await getInsertPosition(trackUri, rating)
  );
}

export async function unarchiveRatedTrack(trackUri: string) {
  await unarchiveTrack(trackUri, await getInsertPosition(trackUri));
}

/**
 * Stores the rating and moves only this track to where the new rating puts
 * it, leaving the rest of a hand-tuned order alone. Re-selecting the current
 * rating does not move anything.
 */
export async function rateActivePlaylistTrack(
  trackUri: string,
  rating: TrackRating
) {
  const tracks = await listRatedActivePlaylistTracks();
  const fromIndex = tracks.findIndex((track) => track.uri === trackUri);

  if (fromIndex === -1) {
    throw new SpotifyRequestError(
      "That track is no longer on the active playlist. Refresh and try again.",
      404
    );
  }

  const current = tracks[fromIndex];

  if (current.rating === rating) {
    return tracks;
  }

  await setTrackRating(trackUri, rating);

  const rated = { ...current, rating };
  const others = tracks.filter((_, index) => index !== fromIndex);
  const toIndex = getRankedInsertIndex(others, rated);

  await reorderActivePlaylistTracks([{ fromIndex, toIndex }]);

  return [...others.slice(0, toIndex), rated, ...others.slice(toIndex)];
}

/** Re-applies the rating order to the whole playlist, discarding manual moves. */
export async function sortActivePlaylistByRating() {
  const tracks = await listRatedActivePlaylistTracks();
  const sorted = sortRankedTracks(tracks);
  const moves = planPlaylistMoves(tracks, sorted);

  await reorderActivePlaylistTracks(moves);

  return { tracks: sorted, moved: moves.length };
}
