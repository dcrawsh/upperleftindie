import { describe, expect, it } from "vitest";
import { getSpotifyTrackFromUrl } from "@/lib/spotify";

const validId = "4cOdK2wGLETKBW3PvgPWqT";

describe("getSpotifyTrackFromUrl", () => {
  it("parses a standard open.spotify.com track URL", () => {
    expect(
      getSpotifyTrackFromUrl(`https://open.spotify.com/track/${validId}`)
    ).toEqual({ id: validId, uri: `spotify:track:${validId}` });
  });

  it("ignores the ?si= share parameter artists paste from the app", () => {
    expect(
      getSpotifyTrackFromUrl(
        `https://open.spotify.com/track/${validId}?si=abc123&utm_source=copy-link`
      )
    ).toEqual({ id: validId, uri: `spotify:track:${validId}` });
  });

  it("parses locale-prefixed URLs", () => {
    expect(
      getSpotifyTrackFromUrl(
        `https://open.spotify.com/intl-de/track/${validId}`
      )
    ).toEqual({ id: validId, uri: `spotify:track:${validId}` });
  });

  it("accepts a spotify:track: URI", () => {
    expect(getSpotifyTrackFromUrl(`spotify:track:${validId}`)).toEqual({
      id: validId,
      uri: `spotify:track:${validId}`,
    });
  });

  it("trims surrounding whitespace", () => {
    expect(
      getSpotifyTrackFromUrl(`  https://open.spotify.com/track/${validId}  `)
    ).toEqual({ id: validId, uri: `spotify:track:${validId}` });
  });

  it("rejects album and playlist URLs", () => {
    expect(
      getSpotifyTrackFromUrl(`https://open.spotify.com/album/${validId}`)
    ).toBeNull();
    expect(
      getSpotifyTrackFromUrl(`https://open.spotify.com/playlist/${validId}`)
    ).toBeNull();
  });

  it("rejects ids that are not 22 alphanumeric characters", () => {
    expect(
      getSpotifyTrackFromUrl("https://open.spotify.com/track/abc")
    ).toBeNull();
    expect(
      getSpotifyTrackFromUrl("https://open.spotify.com/track/" + "!".repeat(22))
    ).toBeNull();
  });

  it("rejects non-URL input instead of throwing", () => {
    expect(getSpotifyTrackFromUrl("")).toBeNull();
    expect(getSpotifyTrackFromUrl("not a link")).toBeNull();
    expect(getSpotifyTrackFromUrl("bandcamp.com/track/whatever")).toBeNull();
  });
});
