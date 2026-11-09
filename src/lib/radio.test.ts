import { describe, expect, it } from "vitest";
import { getApprovedArtistBio, getReusableRadioAudioUrl } from "@/lib/radio";

describe("getApprovedArtistBio", () => {
  it("publishes a trimmed artist-approved bio", () => {
    expect(
      getApprovedArtistBio("  An artist-supplied biography.  ", "2026-11-09")
    ).toBe("An artist-supplied biography.");
  });

  it("does not publish an unapproved bio", () => {
    expect(getApprovedArtistBio("Private draft", null)).toBeNull();
  });
});

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
