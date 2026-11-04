import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import {
  AdminAuthError,
  assertAdminRequest,
} from "@/lib/admin-auth";
import { completeAiReplyDraft } from "@/lib/ai-reply-drafts";
import { EmailServiceError, sendSiteEmail } from "@/lib/email";
import {
  activePlaylistHasTrack,
  addTrackToActivePlaylist,
  getSpotifyTrackFromUrl,
} from "@/lib/spotify";
import {
  getSubmission,
  SupabaseRequestError,
  updateSubmission,
  type Submission,
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

    if (!submission.email) {
      return Response.json(
        { error: "Submission does not have a reply email." },
        { status: 400 }
      );
    }

    const body = (await req.json()) as {
      subject?: unknown;
      message?: unknown;
      draftId?: unknown;
    };
    const subject =
      asTrimmedString(body.subject) ||
      `Re: Upper Left Indie submission from ${submission.artist_name}`;
    const message = asTrimmedString(body.message);
    const draftId = asTrimmedString(body.draftId);

    if (!message) {
      return Response.json(
        { error: "Reply message is required." },
        { status: 400 }
      );
    }

    // Sending the acceptance is what accepts the submission: the email goes
    // out first, then the track joins the playlist. Replies to rejected or
    // archived rows are plain correspondence and never add anything.
    const isAcceptance = submission.status === "pending";
    const track = isAcceptance
      ? getSpotifyTrackFromUrl(submission.song_link)
      : null;

    // Checked before the email leaves, so an unusable link never produces an
    // acceptance the playlist cannot honour.
    if (isAcceptance && !track) {
      return Response.json(
        { error: "Submission song link is not a Spotify track URL." },
        { status: 400 }
      );
    }

    await sendSiteEmail({
      to: submission.email,
      subject,
      text: message,
      fromName: "Upper Left Indie",
    });

    let playlistAdded: boolean | null = null;

    if (track) {
      try {
        if (!(await activePlaylistHasTrack(track.uri))) {
          await addTrackToActivePlaylist(track.uri);
        }
        playlistAdded = true;
      } catch (error) {
        // The artist has already been told they are in. Surface the failure
        // instead of throwing, which would invite a duplicate send.
        console.error("accepted track could not be added to playlist", error);
        playlistAdded = false;
      }
    }

    const updates = {
      // Only a track that actually reached the playlist graduates, so a failed
      // add leaves the row in the queue with a visible repair path.
      ...(track && playlistAdded
        ? {
            status: "added" as const,
            spotify_track_id: track.id,
            spotify_track_uri: track.uri,
            active_playlist_added_at: new Date().toISOString(),
          }
        : {}),
      replied_at: new Date().toISOString(),
      reply_subject: subject,
    };

    let updatedSubmission: Submission | null = null;
    let submissionSaved = true;

    try {
      updatedSubmission = await updateSubmission(id, updates);
    } catch (error) {
      // Same reasoning as the training example below: the mail is already
      // gone, so a bookkeeping failure must not surface as a failed send.
      console.error("sent reply could not be recorded", error);
      submissionSaved = false;
    }

    if (playlistAdded) {
      revalidatePath("/");
    }

    let trainingSaved: boolean | null = null;

    if (draftId) {
      try {
        await completeAiReplyDraft({
          id: draftId,
          submissionId: submission.id,
          finalSubject: subject,
          finalMessage: message,
        });
        trainingSaved = true;
      } catch (error) {
        // The email has already been sent. Report the logging failure without
        // returning an error that could cause the curator to send it twice.
        console.error("sent reply training example could not be saved", error);
        trainingSaved = false;
      }
    }

    return Response.json({
      success: true,
      submission: updatedSubmission,
      trainingSaved,
      playlistAdded,
      submissionSaved,
    });
  } catch (error) {
    console.error("admin submission reply error", error);

    if (error instanceof AdminAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof SupabaseRequestError) {
      return Response.json(
        { error: error.message },
        { status: error.status }
      );
    }

    if (error instanceof EmailServiceError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    return Response.json(
      { error: "Reply email could not be sent." },
      { status: 500 }
    );
  }
}
