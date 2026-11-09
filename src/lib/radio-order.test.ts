import { describe, expect, it } from "vitest";
import { sortRadioTracksByRemovalPriority } from "./radio-order";

describe("sortRadioTracksByRemovalPriority", () => {
  it("puts low ratings before high ratings", () => {
    const tracks = [
      { id: "five", rating: 5 as const, radio_published_at: "2026-01-01" },
      { id: "one", rating: 1 as const, radio_published_at: "2026-03-01" },
      { id: "three", rating: 3 as const, radio_published_at: "2026-02-01" },
    ];

    expect(
      sortRadioTracksByRemovalPriority(tracks).map(({ id }) => id)
    ).toEqual(["one", "three", "five"]);
  });

  it("puts the oldest track first when ratings match", () => {
    const tracks = [
      { id: "new", rating: 2 as const, radio_published_at: "2026-03-01" },
      { id: "old", rating: 2 as const, radio_published_at: "2026-01-01" },
    ];

    expect(
      sortRadioTracksByRemovalPriority(tracks).map(({ id }) => id)
    ).toEqual(["old", "new"]);
  });

  it("uses three stars for an unrated track without mutating the input", () => {
    const tracks = [
      { id: "four", rating: 4 as const, radio_published_at: "2026-01-01" },
      { id: "unrated", radio_published_at: "2026-02-01" },
    ];

    expect(
      sortRadioTracksByRemovalPriority(tracks).map(({ id }) => id)
    ).toEqual(["unrated", "four"]);
    expect(tracks.map(({ id }) => id)).toEqual(["four", "unrated"]);
  });
});
