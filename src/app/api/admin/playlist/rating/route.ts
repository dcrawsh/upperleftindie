import { NextRequest } from "next/server";
import { rateActivePlaylistTrack } from "@/lib/active-playlist";
import { AdminAuthError, assertAdminRequest } from "@/lib/admin-auth";
import { SpotifyRequestError } from "@/lib/spotify";
import { isTrackRating, TrackRatingStoreError } from "@/lib/track-ratings";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    assertAdminRequest(req);

    const body = (await req.json().catch(() => ({}))) as {
      trackUri?: unknown;
      rating?: unknown;
    };
    const trackUri =
      typeof body.trackUri === "string" ? body.trackUri.trim() : "";

    if (!trackUri.startsWith("spotify:track:")) {
      return Response.json(
        { error: "A Spotify track URI is required." },
        { status: 400 }
      );
    }

    if (!isTrackRating(body.rating)) {
      return Response.json(
        { error: "Rating must be 1, 2, or 3 stars." },
        { status: 400 }
      );
    }

    const tracks = await rateActivePlaylistTrack(trackUri, body.rating);

    return Response.json({ tracks });
  } catch (error) {
    console.error("rate playlist track error", error);

    if (error instanceof AdminAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (
      error instanceof SpotifyRequestError ||
      error instanceof TrackRatingStoreError
    ) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    return Response.json(
      { error: "Track rating could not be saved." },
      { status: 500 }
    );
  }
}
