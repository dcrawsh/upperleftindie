import { describe, expect, it } from "vitest";
import { normalizeReplySubject } from "./mailbox";

describe("normalizeReplySubject", () => {
  it("adds a reply prefix", () => {
    expect(normalizeReplySubject("A new message")).toBe("Re: A new message");
  });

  it("does not duplicate an existing reply prefix", () => {
    expect(normalizeReplySubject("re: A new message")).toBe(
      "re: A new message"
    );
  });

  it("provides a subject when the original is blank", () => {
    expect(normalizeReplySubject("  ")).toBe("Re: (No subject)");
  });
});
