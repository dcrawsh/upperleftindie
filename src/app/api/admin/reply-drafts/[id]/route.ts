import { NextRequest } from "next/server";
import {
  AdminAuthError,
  assertAdminRequest,
} from "@/lib/admin-auth";
import {
  AiReplyDraftStoreError,
  rateAiReplyDraft,
} from "@/lib/ai-reply-drafts";

export const runtime = "nodejs";

const allowedFeedbackTags = new Set([
  "too-long",
  "wrong-tone",
  "invented-details",
  "too-generic",
  "missed-detail",
]);

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    assertAdminRequest(req);

    const { id } = await context.params;
    const body = (await req.json()) as {
      rating?: unknown;
      feedbackTags?: unknown;
    };

    if (body.rating !== -1 && body.rating !== 0 && body.rating !== 1) {
      return Response.json(
        { error: "Draft rating must be -1, 0, or 1." },
        { status: 400 }
      );
    }

    const feedbackTags = Array.isArray(body.feedbackTags)
      ? body.feedbackTags.filter(
          (tag): tag is string =>
            typeof tag === "string" && allowedFeedbackTags.has(tag)
        )
      : [];

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

    return Response.json(
      { error: "AI reply draft rating could not be saved." },
      { status: 500 }
    );
  }
}
