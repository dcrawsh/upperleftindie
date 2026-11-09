import { NextRequest } from "next/server";
import { AdminAuthError, assertAdminRequest } from "@/lib/admin-auth";
import {
  listPublishedRadioSubmissions,
  SupabaseRequestError,
} from "@/lib/submissions";
import { sortRadioTracksByRemovalPriority } from "@/lib/radio-order";
import { getSpotifyTrackFromUrl } from "@/lib/spotify";
import {
  DEFAULT_TRACK_RATING,
  getRadioTrackRatingKey,
  listTrackRatings,
  TrackRatingStoreError,
} from "@/lib/track-ratings";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    assertAdminRequest(req);
    const [submissions, ratings] = await Promise.all([
      listPublishedRadioSubmissions(),
      listTrackRatings(),
    ]);
    const tracks = sortRadioTracksByRemovalPriority(
      submissions.map((submission) => {
        const spotifyTrackUri =
          submission.spotify_track_uri ??
          (submission.song_link
            ? getSpotifyTrackFromUrl(submission.song_link)?.uri
            : null);
        const ratingKey = getRadioTrackRatingKey(
          submission.id,
          spotifyTrackUri
        );

        return {
          ...submission,
          rating: ratings.get(ratingKey) ?? DEFAULT_TRACK_RATING,
        };
      })
    );

    return Response.json({ tracks });
  } catch (error) {
    console.error("admin radio tracks error", error);

    if (error instanceof AdminAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (
      error instanceof SupabaseRequestError ||
      error instanceof TrackRatingStoreError
    ) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    return Response.json(
      { error: "Upper Left Radio tracks could not be loaded." },
      { status: 500 }
    );
  }
}
