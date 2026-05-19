import { NextRequest } from "next/server";
import {
  assertAdminRequest,
  AdminAuthError,
} from "../../../../../lib/admin-auth";
import {
  SupabaseRequestError,
  updateSubmission,
} from "../../../../../lib/submissions";

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
    const submission = await updateSubmission(id, values);

    if (!submission) {
      return Response.json({ error: "Submission not found." }, { status: 404 });
    }

    return Response.json({ success: true, submission });
  } catch (error) {
    console.error("admin submission update error", error);

    if (error instanceof AdminAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof SupabaseRequestError) {
      return Response.json(
        { error: error.message },
        { status: error.status }
      );
    }

    return Response.json(
      { error: "Submission could not be updated." },
      { status: 500 }
    );
  }
}
