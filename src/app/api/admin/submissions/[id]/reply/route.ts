import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { AdminAuthError, assertAdminRequest } from "@/lib/admin-auth";
import { addRatedTrackToActivePlaylist } from "@/lib/active-playlist";
import { completeAiReplyDraft } from "@/lib/ai-reply-drafts";
import { EmailServiceError, sendSiteEmail } from "@/lib/email";
import { activePlaylistHasTrack, getSpotifyTrackFromUrl } from "@/lib/spotify";
import {
  getSubmission,
  SupabaseRequestError,
  updateSubmission,
  type Submission,
} from "@/lib/submissions";
import {
  assertSubmissionAudioExists,
  SubmissionAudioError,
} from "@/lib/submission-audio";
import {
  DEFAULT_TRACK_RATING,
  getRadioTrackRatingKey,
  isTrackRating,
  setTrackRating,
} from "@/lib/track-ratings";

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
      trackRating?: unknown;
    };
    const subject =
      asTrimmedString(body.subject) ||
      `Re: Upper Left Indie submission from ${submission.artist_name}`;
    const message = asTrimmedString(body.message);
    const draftId = asTrimmedString(body.draftId);
    const trackRating = isTrackRating(body.trackRating)
      ? body.trackRating
      : DEFAULT_TRACK_RATING;

    if (!message) {
      return Response.json(
        { error: "Reply message is required." },
        { status: 400 }
      );
    }

    // Sending the acceptance is what accepts the submission: the email goes
    // out first, then every supplied destination is published. Replies to
    // rejected or archived rows are plain correspondence and publish nothing.
    const isAcceptance = submission.status === "pending";
    const track =
      isAcceptance && submission.song_link
        ? getSpotifyTrackFromUrl(submission.song_link)
        : null;
    const hasRadioAudio = Boolean(
      isAcceptance &&
      submission.audio_storage_path &&
      (submission.audio_upload_status === "uploaded" ||
        submission.audio_upload_status === "published")
    );

    // Checked before the email leaves, so an unusable link never produces an
    // acceptance the playlist cannot honour.
    if (isAcceptance && submission.song_link && !track) {
      return Response.json(
        { error: "Submission song link is not a Spotify track URL." },
        { status: 400 }
      );
    }

    if (isAcceptance && !track && !hasRadioAudio) {
      return Response.json(
        {
          error: "Submission does not have a publishable Spotify track or MP3.",
        },
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
    let ratingSaved: boolean | null = null;
    let radioPublished: boolean | null = null;

    if (track) {
      // Stored before the insert so the Add to Playlist repair path places the
      // track by the same rating if Spotify refuses it below.
      try {
        await setTrackRating(track.uri, trackRating);
        ratingSaved = true;
      } catch (error) {
        console.error("accepted track rating could not be saved", error);
        ratingSaved = false;
      }

      try {
        if (!(await activePlaylistHasTrack(track.uri))) {
          await addRatedTrackToActivePlaylist(track.uri, trackRating);
        }
        playlistAdded = true;
      } catch (error) {
        // The artist has already been told they are in. Surface the failure
        // instead of throwing, which would invite a duplicate send.
        console.error("accepted track could not be added to playlist", error);
        playlistAdded = false;
      }
    }

    if (hasRadioAudio && !track) {
      try {
        await setTrackRating(
          getRadioTrackRatingKey(submission.id),
          trackRating
        );
        ratingSaved = true;
      } catch (error) {
        console.error("accepted radio track rating could not be saved", error);
        ratingSaved = false;
      }
    }

    if (hasRadioAudio && submission.audio_storage_path) {
      try {
        await assertSubmissionAudioExists(submission.audio_storage_path);
        radioPublished = true;
      } catch (error) {
        console.error("accepted MP3 could not be published to radio", error);
        radioPublished = false;
      }
    }

    const publicationComplete =
      (!track || playlistAdded === true) &&
      (!hasRadioAudio || radioPublished === true);

    const updates = {
      // Every supplied destination must succeed before the row graduates, so
      // a partial publication stays in the queue with visible repair actions.
      ...(isAcceptance && publicationComplete
        ? {
            status: "added" as const,
          }
        : {}),
      ...(track && playlistAdded
        ? {
            spotify_track_id: track.id,
            spotify_track_uri: track.uri,
            active_playlist_added_at: new Date().toISOString(),
          }
        : {}),
      ...(hasRadioAudio && radioPublished
        ? {
            audio_upload_status: "published" as const,
            audio_expires_at: null,
            audio_deleted_at: null,
            radio_published_at:
              submission.radio_published_at ?? new Date().toISOString(),
            radio_removed_at: null,
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

    if (playlistAdded || radioPublished) {
      revalidatePath("/");
      revalidatePath("/radio");
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
      radioPublished,
      ratingSaved,
      submissionSaved,
    });
  } catch (error) {
    console.error("admin submission reply error", error);

    if (error instanceof AdminAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof SupabaseRequestError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof EmailServiceError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof SubmissionAudioError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    return Response.json(
      { error: "Reply email could not be sent." },
      { status: 500 }
    );
  }
}
