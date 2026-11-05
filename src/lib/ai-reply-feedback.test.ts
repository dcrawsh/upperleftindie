import { describe, expect, it } from "vitest";
import { parseAiReplyFeedbackTags } from "./ai-reply-feedback";

describe("parseAiReplyFeedbackTags", () => {
  it("accepts and deduplicates positive feedback", () => {
    expect(
      parseAiReplyFeedbackTags(1, [
        "insightful-specific",
        "right-tone",
        "right-tone",
      ])
    ).toEqual(["insightful-specific", "right-tone"]);
  });

  it("accepts negative feedback for a needs-work rating", () => {
    expect(
      parseAiReplyFeedbackTags(-1, ["too-generic", "repeats-submission"])
    ).toEqual(["too-generic", "repeats-submission"]);
  });

  it("rejects tags that conflict with the rating", () => {
    expect(() => parseAiReplyFeedbackTags(1, ["too-generic"])).toThrow(
      /invalid for this rating/
    );
    expect(() => parseAiReplyFeedbackTags(-1, ["right-tone"])).toThrow(
      /invalid for this rating/
    );
  });

  it("rejects unknown tags and non-array values", () => {
    expect(() => parseAiReplyFeedbackTags(-1, ["unknown"])).toThrow(
      /invalid for this rating/
    );
    expect(() => parseAiReplyFeedbackTags(-1, "too-generic")).toThrow(
      /must be an array/
    );
  });

  it("allows an omitted or empty tag list", () => {
    expect(parseAiReplyFeedbackTags(1, undefined)).toEqual([]);
    expect(parseAiReplyFeedbackTags(0, [])).toEqual([]);
  });
});
