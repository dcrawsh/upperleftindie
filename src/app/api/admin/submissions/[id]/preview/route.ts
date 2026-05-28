import { NextRequest } from "next/server";
import {
  AdminAuthError,
  assertAdminRequest,
} from "../../../../../../lib/admin-auth";
import {
  ApplePreviewError,
  findApplePreview,
} from "../../../../../../lib/apple-preview";
import {
  getSpotifyTrackFromUrl,
  getSpotifyTrackPreviewDetails,
  SpotifyRequestError,
} from "../../../../../../lib/spotify";
import {
  getSubmission,
  SupabaseRequestError,
} from "../../../../../../lib/submissions";

export const runtime = "nodejs";

export async function GET(
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

    const submittedTrack = getSpotifyTrackFromUrl(submission.song_link);

    if (!submittedTrack) {
      return Response.json(
        { error: "Submission does not have a valid Spotify track link." },
        { status: 400 }
      );
    }

    const spotifyTrack = await getSpotifyTrackPreviewDetails(submittedTrack.id);

    if (spotifyTrack.previewUrl) {
      return Response.json({
        previewUrl: spotifyTrack.previewUrl,
        source: "spotify",
        trackName: spotifyTrack.name,
        artistNames: spotifyTrack.artistNames,
        albumName: spotifyTrack.albumName,
      });
    }

    const applePreview = await findApplePreview({
      trackName: spotifyTrack.name,
      artistNames: spotifyTrack.artistNames,
      albumName: spotifyTrack.albumName,
    });

    return Response.json({
      ...applePreview,
      trackName: spotifyTrack.name,
      artistNames: spotifyTrack.artistNames,
      albumName: spotifyTrack.albumName,
    });
  } catch (error) {
    console.error("submission preview lookup error", error);

    if (error instanceof AdminAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof SupabaseRequestError) {
      return Response.json(
        { error: error.message },
        { status: error.status }
      );
    }

    if (error instanceof SpotifyRequestError) {
      return Response.json(
        { error: error.message },
        { status: error.status }
      );
    }

    if (error instanceof ApplePreviewError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    return Response.json(
      { error: "Submission preview lookup failed." },
      { status: 500 }
    );
  }
}
