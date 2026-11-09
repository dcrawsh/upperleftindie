import { DEFAULT_TRACK_RATING, type TrackRating } from "@/lib/track-ratings";

type RatedRadioTrack = {
  rating?: TrackRating;
  radio_published_at?: string | null;
};

function publishedAtTimestamp(value?: string | null) {
  const timestamp = value ? Date.parse(value) : Number.NaN;
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

/** Lowest-rated and oldest tracks are the first removal candidates. */
export function sortRadioTracksByRemovalPriority<T extends RatedRadioTrack>(
  tracks: T[]
) {
  return [...tracks].sort((left, right) => {
    const ratingDifference =
      (left.rating ?? DEFAULT_TRACK_RATING) -
      (right.rating ?? DEFAULT_TRACK_RATING);

    if (ratingDifference !== 0) return ratingDifference;

    return (
      publishedAtTimestamp(left.radio_published_at) -
      publishedAtTimestamp(right.radio_published_at)
    );
  });
}
