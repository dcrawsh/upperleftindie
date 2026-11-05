import { NextRequest } from "next/server";
import { AdminAuthError, assertAdminRequest } from "@/lib/admin-auth";
import {
  getMailboxMessage,
  MailboxServiceError,
  replyToMailboxMessage,
} from "@/lib/mailbox";

export const runtime = "nodejs";

function asUid(value: string) {
  const uid = Number(value);
  return Number.isInteger(uid) && uid > 0 ? uid : null;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ uid: string }> }
) {
  try {
    assertAdminRequest(req);

    const { uid: uidValue } = await context.params;
    const uid = asUid(uidValue);

    if (!uid) {
      return Response.json(
        { error: "Email message is invalid." },
        { status: 400 }
      );
    }

    const message = await getMailboxMessage(uid);
    return Response.json({ message });
  } catch (error) {
    return mailboxErrorResponse("admin inbox message error", error);
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ uid: string }> }
) {
  try {
    assertAdminRequest(req);

    const { uid: uidValue } = await context.params;
    const uid = asUid(uidValue);

    if (!uid) {
      return Response.json(
        { error: "Email message is invalid." },
        { status: 400 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as { message?: unknown };
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!message) {
      return Response.json(
        { error: "Reply message is required." },
        { status: 400 }
      );
    }

    const result = await replyToMailboxMessage(uid, message);
    return Response.json({ success: true, ...result });
  } catch (error) {
    return mailboxErrorResponse("admin inbox reply error", error);
  }
}

function mailboxErrorResponse(context: string, error: unknown) {
  console.error(context, error instanceof Error ? error.message : error);

  if (error instanceof AdminAuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof MailboxServiceError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  return Response.json(
    { error: "The email operation could not be completed." },
    { status: 500 }
  );
}
