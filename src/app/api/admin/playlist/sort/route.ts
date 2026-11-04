import { NextRequest } from "next/server";
import { sortActivePlaylistByRating } from "@/lib/active-playlist";
import { AdminAuthError, assertAdminRequest } from "@/lib/admin-auth";
import { SpotifyRequestError } from "@/lib/spotify";
import { TrackRatingStoreError } from "@/lib/track-ratings";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    assertAdminRequest(req);

    const { tracks, moved } = await sortActivePlaylistByRating();

    return Response.json({ tracks, moved });
  } catch (error) {
    console.error("sort playlist error", error);

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
      { error: "Playlist could not be sorted. Refresh and try again." },
      { status: 500 }
    );
  }
}
