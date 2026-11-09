import { NextRequest } from "next/server";
import {
  getSpotifyTrackFromUrl,
  getSpotifyTrackSummary,
  SpotifyRequestError,
} from "@/lib/spotify";
import {
  type VerifiedSubmissionAudio,
  SubmissionAudioError,
  verifySubmissionAudioUpload,
} from "@/lib/submission-audio";
import {
  createSubmission,
  discardUnreferencedSubmissionAudio,
  SupabaseRequestError,
} from "@/lib/submissions";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let audio: VerifiedSubmissionAudio | null = null;
  let submissionSaved = false;

  try {
    const payload = (await req.json().catch(() => ({}))) as {
      songLink?: unknown;
      audioUploadToken?: unknown;
    };
    const songLink =
      typeof payload.songLink === "string" ? payload.songLink.trim() : "";
    const audioUploadToken =
      typeof payload.audioUploadToken === "string"
        ? payload.audioUploadToken.trim()
        : "";

    audio = audioUploadToken
      ? await verifySubmissionAudioUpload(audioUploadToken)
      : null;

    const spotifyTrack = songLink ? getSpotifyTrackFromUrl(songLink) : null;

    if (songLink && !spotifyTrack) {
      throw new SupabaseRequestError(
        "The Spotify song link is not valid.",
        400
      );
    }

    if (!songLink && !audio) {
      return Response.json(
        { error: "Add a Spotify song link or upload an MP3." },
        { status: 400 }
      );
    }

    if (spotifyTrack) {
      const summary = await getSpotifyTrackSummary(spotifyTrack.id);
      const trackName = summary.name.trim().toLowerCase();

      if (trackName.indexOf("never gonna give you up") !== -1) {
        throw new SupabaseRequestError("Rickrolls are not allowed.", 400);
      }
    }

    const submission = await createSubmission(payload, audio);
    submissionSaved = true;

    return Response.json({ success: true, submission });
  } catch (error) {
    if (audio && !submissionSaved) {
      await discardUnreferencedSubmissionAudio(audio.storagePath).catch(
        (cleanupError) =>
          console.error(
            "unreferenced submission audio cleanup error",
            cleanupError
          )
      );
    }

    console.error("submission save error", error);

    if (error instanceof SupabaseRequestError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof SpotifyRequestError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof SubmissionAudioError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    return Response.json(
      { error: "Submission could not be saved." },
      { status: 500 }
    );
  }
}
