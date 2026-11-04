import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import {
  assertAdminRequest,
  AdminAuthError,
} from "@/lib/admin-auth";
import { addRatedTrackToActivePlaylist } from "@/lib/active-playlist";
import {
  getSubmission,
  SupabaseRequestError,
  updateSubmission,
} from "@/lib/submissions";
import {
  activePlaylistHasTrack,
  getSpotifyTrackFromUrl,
  SpotifyRequestError,
} from "@/lib/spotify";

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

    const isAlreadyActive = await activePlaylistHasTrack(track.uri);

    if (!isAlreadyActive) {
      await addRatedTrackToActivePlaylist(track.uri);
    }

    // A submission is "added" only once both halves of an acceptance are done:
    // the email is sent and the track is on the playlist. Sending normally
    // completes both, so this only promotes the row when it is repairing an
    // acceptance whose playlist insert failed earlier.
    const completesAcceptance =
      submission.status === "pending" && Boolean(submission.replied_at);

    const updatedSubmission = await updateSubmission(id, {
      ...(completesAcceptance ? { status: "added" as const } : {}),
      spotify_track_id: track.id,
      spotify_track_uri: track.uri,
      active_playlist_added_at: new Date().toISOString(),
    });

    revalidatePath("/");

    return Response.json({
      success: true,
      alreadyOnPlaylist: isAlreadyActive,
      submission: updatedSubmission,
    });
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
