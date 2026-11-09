import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { assertAdminRequest, AdminAuthError } from "@/lib/admin-auth";
import {
  getSubmission,
  SupabaseRequestError,
  updateSubmission,
} from "@/lib/submissions";
import { removeSubmissionAudio } from "@/lib/submission-audio";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    assertAdminRequest(req);

    const { id } = await context.params;
    const body = (await req.json()) as {
      status?: "pending" | "added" | "rejected" | "archived";
      adminNotes?: string;
    };
    const values = {
      ...(body.status ? { status: body.status } : {}),
      ...(typeof body.adminNotes === "string"
        ? { admin_notes: body.adminNotes.trim() || null }
        : {}),
    };
    const existing = await getSubmission(id);

    if (!existing) {
      return Response.json({ error: "Submission not found." }, { status: 404 });
    }

    const shouldRemoveAudio = Boolean(
      body.status === "rejected" &&
      existing.audio_storage_path &&
      !existing.audio_deleted_at
    );

    if (shouldRemoveAudio) {
      Object.assign(values, {
        audio_upload_status: "removed" as const,
        audio_expires_at: null,
        radio_published_at: null,
        radio_removed_at: new Date().toISOString(),
        radio_playback_url: null,
        radio_playback_url_expires_at: null,
      });
      revalidatePath("/radio");
    }

    let submission = await updateSubmission(id, values);

    if (!submission) {
      return Response.json({ error: "Submission not found." }, { status: 404 });
    }

    if (shouldRemoveAudio && existing.audio_storage_path) {
      try {
        await removeSubmissionAudio(existing.audio_storage_path);
        submission =
          (await updateSubmission(id, {
            audio_deleted_at: new Date().toISOString(),
          })) ?? submission;
      } catch (error) {
        // The database already hides this private file from radio. Cleanup can
        // be retried without making the curator repeat the rejection action.
        console.error("rejected submission MP3 cleanup failed", error);
      }
    }

    return Response.json({ success: true, submission });
  } catch (error) {
    console.error("admin submission update error", error);

    if (error instanceof AdminAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof SupabaseRequestError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    return Response.json(
      { error: "Submission could not be updated." },
      { status: 500 }
    );
  }
}
