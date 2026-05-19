import { NextRequest } from "next/server";
import {
  assertAdminRequest,
  AdminAuthError,
} from "../../../../../../lib/admin-auth";
import {
  getSubmission,
  SupabaseRequestError,
  updateSubmission,
} from "../../../../../../lib/submissions";
import {
  addTrackToActivePlaylist,
  getSpotifyTrackFromUrl,
  SpotifyRequestError,
} from "../../../../../../lib/spotify";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    assertAdminRequest(req);

    const { id } = await context.params;
    const submission = await getSubmission(id);

    if (!submission) {
      return Response.json({ error: "Submission not found." }, { status: 404 });
    }

    const track = getSpotifyTrackFromUrl(submission.song_link);
    if (!track) {
      return Response.json(
        { error: "Submission song link is not a Spotify track URL." },
        { status: 400 }
      );
    }

    await addTrackToActivePlaylist(track.uri);
    const updatedSubmission = await updateSubmission(id, {
      status: "added",
      spotify_track_id: track.id,
      spotify_track_uri: track.uri,
      active_playlist_added_at: new Date().toISOString(),
    });

    return Response.json({ success: true, submission: updatedSubmission });
  } catch (error) {
    console.error("add to playlist error", error);

    if (error instanceof AdminAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof SupabaseRequestError || error instanceof SpotifyRequestError) {
      return Response.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return Response.json(
      { error: "Track could not be added to the playlist." },
      { status: 500 }
    );
  }
}
