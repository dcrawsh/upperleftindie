import { NextRequest } from "next/server";
import { AdminAuthError, assertAdminRequest } from "@/lib/admin-auth";
import { listMailboxMessages, MailboxServiceError } from "@/lib/mailbox";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    assertAdminRequest(req);

    const requestedLimit = Number(req.nextUrl.searchParams.get("limit") ?? 50);
    const limit = Number.isInteger(requestedLimit) ? requestedLimit : 50;
    const messages = await listMailboxMessages(limit);

    return Response.json({ messages });
  } catch (error) {
    console.error(
      "admin inbox list error",
      error instanceof Error ? error.message : error
    );

    if (error instanceof AdminAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof MailboxServiceError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    return Response.json(
      { error: "The email inbox could not be loaded." },
      { status: 500 }
    );
  }
}
