import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { AdminAuthError, assertAdminRequest } from "@/lib/admin-auth";
import {
  assertSubmissionAudioExists,
  SubmissionAudioError,
} from "@/lib/submission-audio";
import {
  getSubmission,
  SupabaseRequestError,
  updateSubmission,
} from "@/lib/submissions";

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

    if (!submission.replied_at) {
      return Response.json(
        { error: "Send the acceptance before publishing the MP3 to radio." },
        { status: 409 }
      );
    }

    if (!submission.audio_storage_path) {
      return Response.json(
        { error: "Submission does not have an uploaded MP3." },
        { status: 400 }
      );
    }

    await assertSubmissionAudioExists(submission.audio_storage_path);

    const spotifyComplete =
      !submission.song_link || Boolean(submission.active_playlist_added_at);
    const submissionUpdated = await updateSubmission(id, {
      ...(spotifyComplete ? { status: "added" as const } : {}),
      audio_upload_status: "published",
      audio_expires_at: null,
      audio_deleted_at: null,
      radio_published_at:
        submission.radio_published_at ?? new Date().toISOString(),
      radio_removed_at: null,
    });

    revalidatePath("/radio");

    return Response.json({ success: true, submission: submissionUpdated });
  } catch (error) {
    console.error("publish submission to radio error", error);

    if (error instanceof AdminAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (
      error instanceof SupabaseRequestError ||
      error instanceof SubmissionAudioError
    ) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    return Response.json(
      { error: "The MP3 could not be published to radio." },
      { status: 500 }
    );
  }
}
