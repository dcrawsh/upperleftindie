import { NextRequest } from "next/server";
import { assertAdminRequest, AdminAuthError } from "../../../../lib/admin-auth";
import { listSubmissions, SupabaseRequestError } from "../../../../lib/submissions";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    assertAdminRequest(req);

    const status = req.nextUrl.searchParams.get("status") ?? "pending";
    const submissions = await listSubmissions(status);

    return Response.json({ submissions });
  } catch (error) {
    console.error("admin submissions error", error);

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
      { error: "Submissions could not be loaded." },
      { status: 500 }
    );
  }
}
