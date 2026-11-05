export const POSITIVE_AI_REPLY_FEEDBACK_TAGS = [
  "insightful-specific",
  "right-tone",
  "concise",
  "ready-to-send",
] as const;

export const NEGATIVE_AI_REPLY_FEEDBACK_TAGS = [
  "too-generic",
  "repeats-submission",
  "invented-details",
  "missed-detail",
  "wrong-tone",
  "too-promotional",
  "too-long",
  "awkward-wording",
] as const;

export type AiReplyFeedbackTag =
  | (typeof POSITIVE_AI_REPLY_FEEDBACK_TAGS)[number]
  | (typeof NEGATIVE_AI_REPLY_FEEDBACK_TAGS)[number];

export class AiReplyFeedbackError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export function parseAiReplyFeedbackTags(
  rating: -1 | 0 | 1,
  value: unknown
): AiReplyFeedbackTag[] {
  if (value === undefined) return [];

  if (!Array.isArray(value)) {
    throw new AiReplyFeedbackError("Draft feedback tags must be an array.");
  }

  const allowed = new Set<string>(
    rating === 1
      ? POSITIVE_AI_REPLY_FEEDBACK_TAGS
      : rating === -1
        ? NEGATIVE_AI_REPLY_FEEDBACK_TAGS
        : []
  );
  const tags = new Set<AiReplyFeedbackTag>();

  for (const tag of value) {
    if (typeof tag !== "string" || !allowed.has(tag)) {
      throw new AiReplyFeedbackError(
        "One or more draft feedback tags are invalid for this rating."
      );
    }

    tags.add(tag as AiReplyFeedbackTag);
  }

  return [...tags];
}
