import { NextRequest } from "next/server";
import { assertAdminRequest, AdminAuthError } from "../../../../../lib/admin-auth";
import {
  SupabaseRequestError,
  updateSubmissionsByTrackUri,
} from "../../../../../lib/submissions";
import { archiveTrack, SpotifyRequestError } from "../../../../../lib/spotify";

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

    await archiveTrack(trackUri);

    try {
      await updateSubmissionsByTrackUri(trackUri, {
        status: "archived",
        archived_at: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof SupabaseRequestError) {
        console.error("submission archive status update error", error);
      } else {
        throw error;
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("archive playlist track error", error);

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
      { error: "Track could not be archived." },
      { status: 500 }
    );
  }
}
