import { NextRequest } from "next/server";
import { AdminAuthError, assertAdminRequest } from "@/lib/admin-auth";
import {
  AiReplyDraftStoreError,
  rateAiReplyDraft,
} from "@/lib/ai-reply-drafts";
import {
  AiReplyFeedbackError,
  parseAiReplyFeedbackTags,
} from "@/lib/ai-reply-feedback";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    assertAdminRequest(req);

    const { id } = await context.params;
    const body = (await req.json().catch(() => ({}))) as {
      rating?: unknown;
      feedbackTags?: unknown;
    };

    if (body.rating !== -1 && body.rating !== 0 && body.rating !== 1) {
      return Response.json(
        { error: "Draft rating must be -1, 0, or 1." },
        { status: 400 }
      );
    }

    const feedbackTags = parseAiReplyFeedbackTags(
      body.rating,
      body.feedbackTags
    );

    await rateAiReplyDraft({ id, rating: body.rating, feedbackTags });

    return Response.json({ success: true });
  } catch (error) {
    console.error("AI reply draft rating error", error);

    if (error instanceof AdminAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof AiReplyDraftStoreError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof AiReplyFeedbackError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json(
      { error: "AI reply draft rating could not be saved." },
      { status: 500 }
    );
  }
}
