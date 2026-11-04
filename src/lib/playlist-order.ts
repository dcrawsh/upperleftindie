import type { TrackRating } from "@/lib/track-ratings";

/**
 * Pure ordering rules for the active playlist: higher ratings first, and
 * within a rating the most recently added track first. Spotify's own order is
 * still the source of truth, so the curator's manual drags persist until a
 * rating change or a full sort re-applies these rules.
 */
export type RankedTrack = {
  rating: TrackRating;
  addedAt: string;
};

export type PlaylistMove = {
  fromIndex: number;
  toIndex: number;
};

function addedTime(value: string) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

/** Negative when `a` belongs above `b`. */
export function compareRankedTracks(a: RankedTrack, b: RankedTrack) {
  return b.rating - a.rating || addedTime(b.addedAt) - addedTime(a.addedAt);
}

export function sortRankedTracks<T extends RankedTrack>(tracks: T[]) {
  return [...tracks].sort(compareRankedTracks);
}

/**
 * Where a track lands in an existing (possibly hand-tuned) order: directly
 * above the first track it outranks, or at the end when it outranks none.
 */
export function getRankedInsertIndex(
  tracks: RankedTrack[],
  track: RankedTrack
) {
  const index = tracks.findIndex(
    (existing) => compareRankedTracks(track, existing) < 0
  );

  return index === -1 ? tracks.length : index;
}

export function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);

  if (item === undefined) return items;

  next.splice(toIndex, 0, item);
  return next;
}

/**
 * The single-item moves that turn `current` into `target`, where both hold the
 * same item references. Items on the longest run already in target order stay
 * put, so a mostly sorted playlist costs only a few Spotify calls. Each move's
 * `toIndex` is the item's index after the move, matching `moveItem`.
 */
export function planPlaylistMoves<T>(current: T[], target: T[]) {
  const targetIndex = new Map(target.map((item, index) => [item, index]));
  const ranks = current.map((item) => targetIndex.get(item) ?? -1);

  if (ranks.includes(-1) || current.length !== target.length) {
    throw new Error("Current and target orders must hold the same items.");
  }

  // O(n^2) longest increasing subsequence; playlists are a few hundred tracks.
  const lengths = ranks.map(() => 1);
  const previous = ranks.map(() => -1);
  let bestEnd = -1;

  for (let i = 0; i < ranks.length; i++) {
    for (let j = 0; j < i; j++) {
      if (ranks[j] < ranks[i] && lengths[j] + 1 > lengths[i]) {
        lengths[i] = lengths[j] + 1;
        previous[i] = j;
      }
    }

    if (bestEnd === -1 || lengths[i] > lengths[bestEnd]) {
      bestEnd = i;
    }
  }

  const anchored = new Set<T>();
  for (let i = bestEnd; i !== -1; i = previous[i]) {
    anchored.add(current[i]);
  }

  const moves: PlaylistMove[] = [];
  let working = [...current];

  // Placing each unanchored item directly after its target predecessor keeps
  // every anchored or already-placed item in target order.
  target.forEach((item, index) => {
    if (anchored.has(item)) return;

    const fromIndex = working.indexOf(item);
    const remaining = working.filter((_, i) => i !== fromIndex);
    const toIndex = index === 0 ? 0 : remaining.indexOf(target[index - 1]) + 1;

    if (fromIndex !== toIndex) {
      moves.push({ fromIndex, toIndex });
      working = moveItem(working, fromIndex, toIndex);
    }
  });

  return moves;
}
