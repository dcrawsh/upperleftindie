import { NextRequest } from "next/server";
import { listRatedActivePlaylistTracks } from "@/lib/active-playlist";
import { assertAdminRequest, AdminAuthError } from "@/lib/admin-auth";
import { SpotifyRequestError } from "@/lib/spotify";
import { TrackRatingStoreError } from "@/lib/track-ratings";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    assertAdminRequest(req);

    const tracks = await listRatedActivePlaylistTracks();

    return Response.json({ tracks });
  } catch (error) {
    console.error("active playlist error", error);

    if (error instanceof AdminAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (
      error instanceof SpotifyRequestError ||
      error instanceof TrackRatingStoreError
    ) {
      return Response.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return Response.json(
      { error: "Active playlist could not be loaded." },
      { status: 500 }
    );
  }
}
