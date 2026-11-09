import { describe, expect, it } from "vitest";
import {
  DEFAULT_TRACK_RATING,
  getRadioTrackRatingKey,
  isTrackRating,
} from "./track-ratings";

describe("track ratings", () => {
  it("uses 3 stars as the neutral default", () => {
    expect(DEFAULT_TRACK_RATING).toBe(3);
  });

  it("accepts every whole-star rating from 1 through 5", () => {
    expect([1, 2, 3, 4, 5].every(isTrackRating)).toBe(true);
  });

  it("rejects values outside the five-star scale", () => {
    for (const value of [0, 6, 2.5, "3", null, undefined]) {
      expect(isTrackRating(value)).toBe(false);
    }
  });
});

describe("getRadioTrackRatingKey", () => {
  it("shares the Spotify rating when a track URI exists", () => {
    expect(getRadioTrackRatingKey("submission-id", "spotify:track:abc")).toBe(
      "spotify:track:abc"
    );
  });

  it("uses a namespaced rating key for MP3-only submissions", () => {
    expect(getRadioTrackRatingKey("submission-id")).toBe(
      "radio:submission:submission-id"
    );
  });
});
