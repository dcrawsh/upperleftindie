import { NextRequest } from "next/server";
import {
  AdminAuthError,
  assertAdminRequest,
} from "../../../../../../lib/admin-auth";
import { EmailServiceError, sendSiteEmail } from "../../../../../../lib/email";
import {
  getSubmission,
  SupabaseRequestError,
} from "../../../../../../lib/submissions";

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
    };
    const subject =
      asTrimmedString(body.subject) ||
      `Re: Upper Left Indie submission from ${submission.artist_name}`;
    const message = asTrimmedString(body.message);

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

    return Response.json({ success: true });
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
