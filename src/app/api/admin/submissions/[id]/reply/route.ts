import { NextRequest } from "next/server";
import {
  AdminAuthError,
  assertAdminRequest,
} from "@/lib/admin-auth";
import { completeAiReplyDraft } from "@/lib/ai-reply-drafts";
import { EmailServiceError, sendSiteEmail } from "@/lib/email";
import {
  getSubmission,
  SupabaseRequestError,
  updateSubmission,
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

    await sendSiteEmail({
      to: submission.email,
      subject,
      text: message,
      fromName: "Upper Left Indie",
    });

    const updatedSubmission = await updateSubmission(id, {
      replied_at: new Date().toISOString(),
      reply_subject: subject,
    });

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
