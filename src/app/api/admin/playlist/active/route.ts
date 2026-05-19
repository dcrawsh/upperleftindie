import { NextRequest } from "next/server";
import { assertAdminRequest, AdminAuthError } from "../../../../../lib/admin-auth";
import {
  listActivePlaylistTracks,
  SpotifyRequestError,
} from "../../../../../lib/spotify";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    assertAdminRequest(req);

    const tracks = await listActivePlaylistTracks();

    return Response.json({ tracks });
  } catch (error) {
    console.error("active playlist error", error);

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
      { error: "Active playlist could not be loaded." },
      { status: 500 }
    );
  }
}
