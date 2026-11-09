import { describe, expect, it } from "vitest";
import { getReusableRadioAudioUrl } from "@/lib/radio";

describe("getReusableRadioAudioUrl", () => {
  const now = Date.parse("2026-11-08T20:00:00.000Z");

  it("reuses a signed URL with more than five minutes remaining", () => {
    expect(
      getReusableRadioAudioUrl(
        {
          url: "https://storage.example/signed-track",
          expiresAt: "2026-11-08T20:06:00.000Z",
        },
        now
      )
    ).toBe("https://storage.example/signed-track");
  });

  it("refreshes a signed URL near expiry", () => {
    expect(
      getReusableRadioAudioUrl(
        {
          url: "https://storage.example/signed-track",
          expiresAt: "2026-11-08T20:05:00.000Z",
        },
        now
      )
    ).toBeNull();
  });

  it("refreshes malformed cache data", () => {
    expect(
      getReusableRadioAudioUrl(
        { url: "https://storage.example/signed-track", expiresAt: "invalid" },
        now
      )
    ).toBeNull();
  });
});
