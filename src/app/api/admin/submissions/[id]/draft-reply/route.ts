import { NextRequest } from "next/server";
import {
  AdminAuthError,
  assertAdminRequest,
} from "@/lib/admin-auth";
import {
  AiReplyDraftStoreError,
  createAiReplyDraft,
  discardAiReplyDraft,
  listPositiveAiReplyExamples,
  type AiReplyInputSnapshot,
} from "@/lib/ai-reply-drafts";
import {
  generateAcceptanceReply,
  LocalAiReplyError,
} from "@/lib/local-ai-reply";
import { ACTIVE_PLAYLIST_URL } from "@/lib/site";
import {
  getSpotifyTrackFromUrl,
  getSpotifyTrackPreviewDetails,
} from "@/lib/spotify";
import {
  getSubmission,
  SupabaseRequestError,
} from "@/lib/submissions";

export const runtime = "nodejs";

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

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

    // Nothing is on the playlist yet at draft time — the track is added when
    // the acceptance is sent. Only guard against drafting an acceptance for a
    // submission that is no longer in review.
    if (submission.status === "rejected" || submission.status === "archived") {
      return Response.json(
        {
          error:
            "Acceptance replies are only for submissions still in the review queue.",
        },
        { status: 409 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      previousDraftId?: unknown;
    };
    const previousDraftId = asTrimmedString(body.previousDraftId);
    const submittedTrack = getSpotifyTrackFromUrl(submission.song_link);
    let trackTitle = "";

    if (submittedTrack) {
      try {
        const track = await getSpotifyTrackPreviewDetails(submittedTrack.id);
        trackTitle = track.name;
      } catch {
        console.warn("AI reply draft: Spotify track title unavailable");
      }
    }

    const inputSnapshot: AiReplyInputSnapshot = {
      contactName: submission.contact_name.trim(),
      artistName: submission.artist_name.trim(),
      trackTitle,
      city: submission.city.trim(),
      region: submission.region.trim(),
      genre: submission.genre.trim(),
      submissionNotes: (submission.notes ?? "").trim().slice(0, 4000),
      playlistUrl: ACTIVE_PLAYLIST_URL,
    };
    const examples = await listPositiveAiReplyExamples(2);
    const generated = await generateAcceptanceReply(inputSnapshot, examples);
    const draft = await createAiReplyDraft({
      submissionId: submission.id,
      model: generated.model,
      promptVersion: generated.promptVersion,
      generationSettings: generated.generationSettings,
      inputSnapshot,
      generatedSubject: generated.subject,
      generatedMessage: generated.message,
    });

    if (previousDraftId && previousDraftId !== draft.id) {
      await discardAiReplyDraft(previousDraftId).catch((error) => {
        console.error("previous AI reply draft could not be discarded", error);
      });
    }

    return Response.json({
      draftId: draft.id,
      subject: generated.subject,
      message: generated.message,
      model: generated.model,
      promptVersion: generated.promptVersion,
    });
  } catch (error) {
    console.error("AI reply draft error", error);

    if (error instanceof AdminAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof SupabaseRequestError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof AiReplyDraftStoreError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof LocalAiReplyError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    return Response.json(
      { error: "AI reply draft could not be generated." },
      { status: 500 }
    );
  }
}
