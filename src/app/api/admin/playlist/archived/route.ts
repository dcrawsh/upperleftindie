import { NextRequest } from "next/server";
import { assertAdminRequest, AdminAuthError } from "../../../../../lib/admin-auth";
import {
  listArchivePlaylistTracks,
  SpotifyRequestError,
} from "../../../../../lib/spotify";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    assertAdminRequest(req);

    const tracks = await listArchivePlaylistTracks();

    return Response.json({ tracks });
  } catch (error) {
    console.error("archive playlist error", error);

    if (error instanceof AdminAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof SpotifyRequestError) {
      return Response.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return Response.json(
      { error: "Archive playlist could not be loaded." },
      { status: 500 }
    );
  }
}
