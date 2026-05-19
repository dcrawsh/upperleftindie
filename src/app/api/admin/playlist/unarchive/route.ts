import { NextRequest } from "next/server";
import { assertAdminRequest, AdminAuthError } from "../../../../../lib/admin-auth";
import {
  SupabaseRequestError,
  updateSubmissionsByTrackUri,
} from "../../../../../lib/submissions";
import { SpotifyRequestError, unarchiveTrack } from "../../../../../lib/spotify";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    assertAdminRequest(req);

    const body = (await req.json()) as { trackUri?: unknown };
    const trackUri = typeof body.trackUri === "string" ? body.trackUri : "";

    if (!trackUri.startsWith("spotify:track:")) {
      return Response.json(
        { error: "A Spotify track URI is required." },
        { status: 400 }
      );
    }

    await unarchiveTrack(trackUri);

    try {
      await updateSubmissionsByTrackUri(trackUri, {
        status: "added",
        archived_at: null,
        active_playlist_added_at: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof SupabaseRequestError) {
        console.error("submission unarchive status update error", error);
      } else {
        throw error;
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("unarchive playlist track error", error);

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
      { error: "Track could not be unarchived." },
      { status: 500 }
    );
  }
}
