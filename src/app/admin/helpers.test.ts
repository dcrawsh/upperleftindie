import { describe, expect, it } from "vitest";
import {
  getDefaultReplyMessage,
  getDefaultReplySubject,
  getErrorMessage,
  getSpotifyAppTrackUrl,
  formatFileSize,
  moveTrackInList,
} from "./helpers";

describe("getSpotifyAppTrackUrl", () => {
  it("converts a web track URL to the desktop app URI", () => {
    expect(
      getSpotifyAppTrackUrl(
        "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT"
      )
    ).toBe("spotify:track:4cOdK2wGLETKBW3PvgPWqT");
  });

  it("passes an existing spotify: URI through untouched", () => {
    expect(getSpotifyAppTrackUrl("spotify:track:abc")).toBe(
      "spotify:track:abc"
    );
  });

  it("returns the original value for non-track Spotify links", () => {
    const album = "https://open.spotify.com/album/4cOdK2wGLETKBW3PvgPWqT";
    expect(getSpotifyAppTrackUrl(album)).toBe(album);
  });

  it("returns the original value for non-Spotify or unparseable links", () => {
    expect(getSpotifyAppTrackUrl("https://example.com/track/1")).toBe(
      "https://example.com/track/1"
    );
    expect(getSpotifyAppTrackUrl("not a url")).toBe("not a url");
  });
});

describe("formatFileSize", () => {
  it("formats stored audio bytes", () => {
    expect(formatFileSize(5.25 * 1024 * 1024)).toBe("5.3 MB");
    expect(formatFileSize(12 * 1024 * 1024)).toBe("12 MB");
  });

  it("handles missing size metadata", () => {
    expect(formatFileSize(null)).toBe("Size unknown");
  });
});

describe("moveTrackInList", () => {
  it("moves an item forward", () => {
    expect(moveTrackInList(["a", "b", "c", "d"], 0, 2)).toEqual([
      "b",
      "c",
      "a",
      "d",
    ]);
  });

  it("moves an item backward", () => {
    expect(moveTrackInList(["a", "b", "c", "d"], 3, 1)).toEqual([
      "a",
      "d",
      "b",
      "c",
    ]);
  });

  it("does not mutate the input", () => {
    const original = ["a", "b", "c"];
    moveTrackInList(original, 0, 2);
    expect(original).toEqual(["a", "b", "c"]);
  });

  it("returns the original list when the index is out of range", () => {
    const original = ["a", "b"];
    expect(moveTrackInList(original, 5, 0)).toBe(original);
  });
});

describe("getErrorMessage", () => {
  it("uses the Error message", () => {
    expect(getErrorMessage(new Error("Boom"))).toBe("Boom");
  });

  it("falls back for non-Error values", () => {
    expect(getErrorMessage("a string")).toBe("Something went wrong.");
    expect(getErrorMessage(null)).toBe("Something went wrong.");
  });
});

describe("reply defaults", () => {
  it("names the artist in the subject", () => {
    expect(getDefaultReplySubject("Harbor Static")).toContain("Harbor Static");
  });

  it("greets the contact by name", () => {
    expect(getDefaultReplyMessage("Maya")).toContain("Hello Maya,");
  });

  it("falls back to a neutral greeting when the name is blank", () => {
    expect(getDefaultReplyMessage("")).toContain("Hello there,");
  });

  it("includes the playlist URL", () => {
    expect(getDefaultReplyMessage("Maya")).toContain(
      "https://open.spotify.com/playlist/"
    );
  });
});
