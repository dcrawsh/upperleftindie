import { describe, expect, it } from "vitest";
import { normalizeSubmissionPayload } from "@/lib/submissions";

const required = {
  artistName: "Harbor Static",
  contactName: "Maya",
  email: "maya@example.com",
};

const audio = {
  storagePath: "incoming/track.mp3",
  size: 1024,
  mimeType: "audio/mpeg" as const,
};

describe("normalizeSubmissionPayload", () => {
  it("accepts a Spotify-only submission", () => {
    expect(
      normalizeSubmissionPayload({
        ...required,
        songLink: "https://open.spotify.com/track/123",
      }).song_link
    ).toBe("https://open.spotify.com/track/123");
  });

  it("requires a Spotify link or verified MP3", () => {
    expect(() => normalizeSubmissionPayload(required)).toThrow(
      "Add a Spotify song link or upload an MP3."
    );
  });

  it("stores a verified MP3 when title and permission are present", () => {
    const result = normalizeSubmissionPayload(
      {
        ...required,
        trackTitle: "Sunroom",
        audioOriginalFilename: "sunroom.mp3",
        radioRightsAccepted: true,
      },
      audio
    );

    expect(result).toMatchObject({
      song_link: null,
      track_title: "Sunroom",
      audio_storage_path: "incoming/track.mp3",
      audio_original_filename: "sunroom.mp3",
      audio_upload_status: "uploaded",
      audio_deleted_at: null,
    });
    expect(Date.parse(result.audio_expires_at)).toBeGreaterThan(
      Date.now() + 89 * 24 * 60 * 60 * 1000
    );
  });

  it("requires radio permission for an MP3", () => {
    expect(() =>
      normalizeSubmissionPayload({ ...required, trackTitle: "Sunroom" }, audio)
    ).toThrow("Confirm that you have permission");
  });

  it("stores an artist-approved optional bio", () => {
    const result = normalizeSubmissionPayload({
      ...required,
      songLink: "https://open.spotify.com/track/123",
      artistBio: "Pacific Northwest dream-pop made beside the river.",
      artistBioApproved: true,
    });

    expect(result.artist_bio).toBe(
      "Pacific Northwest dream-pop made beside the river."
    );
    expect(result.artist_bio_approved_at).toEqual(expect.any(String));
  });

  it("requires public display approval when a bio is supplied", () => {
    expect(() =>
      normalizeSubmissionPayload({
        ...required,
        songLink: "https://open.spotify.com/track/123",
        artistBio: "A short artist bio.",
      })
    ).toThrow("Confirm that the artist bio may be displayed publicly.");
  });

  it("limits an artist bio to 600 characters", () => {
    expect(() =>
      normalizeSubmissionPayload({
        ...required,
        songLink: "https://open.spotify.com/track/123",
        artistBio: "a".repeat(601),
        artistBioApproved: true,
      })
    ).toThrow("600 characters or fewer");
  });
});
