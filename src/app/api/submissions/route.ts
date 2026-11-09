import { NextRequest } from "next/server";
import {
  getSpotifyTrackFromUrl,
  getSpotifyTrackSummary,
  SpotifyRequestError,
} from "@/lib/spotify";
import { createSubmission, SupabaseRequestError } from "@/lib/submissions";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const spotifyTrack =
      payload && typeof payload.songLink === "string"
        ? getSpotifyTrackFromUrl(payload.songLink)
        : null;

    if (!spotifyTrack) {
      return Response.json(
        { error: "A Spotify song link is required." },
        { status: 400 }
      );
    }

    const summary = await getSpotifyTrackSummary(spotifyTrack.id);
    const trackName = summary.name.trim().toLowerCase();

    if (trackName.indexOf("never gonna give you up") !== -1) {
      throw new SupabaseRequestError("Rickrolls are not allowed.", 400);
    }

    const submission = await createSubmission(payload);

    return Response.json({ success: true, submission });
  } catch (error) {
    console.error("submission save error", error);

    if (error instanceof SupabaseRequestError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof SpotifyRequestError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    return Response.json(
      { error: "Submission could not be saved." },
      { status: 500 }
    );
  }
}
