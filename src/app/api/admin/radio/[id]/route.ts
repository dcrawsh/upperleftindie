import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { AdminAuthError, assertAdminRequest } from "@/lib/admin-auth";
import { rateActivePlaylistTrack } from "@/lib/active-playlist";
import { removeSubmissionAudio } from "@/lib/submission-audio";
import { getSpotifyTrackFromUrl, SpotifyRequestError } from "@/lib/spotify";
import {
  getSubmission,
  SupabaseRequestError,
  type Submission,
  updateSubmission,
} from "@/lib/submissions";
import {
  getRadioTrackRatingKey,
  isTrackRating,
  setTrackRating,
  TrackRatingStoreError,
} from "@/lib/track-ratings";

export const runtime = "nodejs";

function isPublishedRadioSubmission(
  submission: Awaited<ReturnType<typeof getSubmission>>
): submission is Submission & {
  audio_storage_path: string;
  audio_upload_status: "published";
  radio_published_at: string;
  radio_removed_at: null | undefined;
} {
  return Boolean(
    submission?.audio_storage_path &&
    submission.audio_upload_status === "published" &&
    submission.radio_published_at &&
    !submission.radio_removed_at
  );
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    assertAdminRequest(req);

    const body = (await req.json().catch(() => ({}))) as { rating?: unknown };

    if (!isTrackRating(body.rating)) {
      return Response.json(
        { error: "Rating must be between 1 and 5 stars." },
        { status: 400 }
      );
    }

    const { id } = await context.params;
    const submission = await getSubmission(id);

    if (!submission) {
      return Response.json(
        { error: "Radio track not found." },
        { status: 404 }
      );
    }

    if (!isPublishedRadioSubmission(submission)) {
      return Response.json(
        { error: "This submission is not currently on Upper Left Radio." },
        { status: 409 }
      );
    }

    const spotifyTrackUri =
      submission.spotify_track_uri ??
      (submission.song_link
        ? getSpotifyTrackFromUrl(submission.song_link)?.uri
        : null);
    const ratingKey = getRadioTrackRatingKey(id, spotifyTrackUri);

    if (spotifyTrackUri) {
      try {
        await rateActivePlaylistTrack(spotifyTrackUri, body.rating);
      } catch (error) {
        if (!(error instanceof SpotifyRequestError) || error.status !== 404) {
          throw error;
        }

        await setTrackRating(ratingKey, body.rating);
      }
    } else {
      await setTrackRating(ratingKey, body.rating);
    }

    return Response.json({ success: true, rating: body.rating });
  } catch (error) {
    console.error("rate radio track error", error);

    if (error instanceof AdminAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (
      error instanceof SupabaseRequestError ||
      error instanceof SpotifyRequestError ||
      error instanceof TrackRatingStoreError
    ) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    return Response.json(
      { error: "The radio track rating could not be saved." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    assertAdminRequest(req);

    const { id } = await context.params;
    const submission = await getSubmission(id);

    if (!submission) {
      return Response.json(
        { error: "Radio track not found." },
        { status: 404 }
      );
    }

    if (!isPublishedRadioSubmission(submission)) {
      return Response.json(
        { error: "This submission is not currently on Upper Left Radio." },
        { status: 409 }
      );
    }

    const removedAt = new Date().toISOString();
    let updatedSubmission = await updateSubmission(id, {
      ...(!submission.song_link
        ? { status: "archived" as const, archived_at: removedAt }
        : {}),
      audio_upload_status: "removed",
      audio_expires_at: null,
      radio_published_at: null,
      radio_removed_at: removedAt,
      radio_playback_url: null,
      radio_playback_url_expires_at: null,
    });

    if (!updatedSubmission) {
      return Response.json(
        { error: "Radio track not found." },
        { status: 404 }
      );
    }

    let cleanupPending = false;

    try {
      await removeSubmissionAudio(submission.audio_storage_path);
      updatedSubmission =
        (await updateSubmission(id, { audio_deleted_at: removedAt })) ??
        updatedSubmission;
    } catch (error) {
      cleanupPending = true;
      console.error("removed radio MP3 cleanup failed", error);
    }

    revalidatePath("/radio");

    return Response.json({
      success: true,
      submission: updatedSubmission,
      cleanupPending,
    });
  } catch (error) {
    console.error("remove radio track error", error);

    if (error instanceof AdminAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof SupabaseRequestError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    return Response.json(
      { error: "The track could not be removed from Upper Left Radio." },
      { status: 500 }
    );
  }
}
