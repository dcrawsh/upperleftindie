import { describe, expect, it } from "vitest";
import {
  getRankedInsertIndex,
  moveItem,
  planPlaylistMoves,
  sortRankedTracks,
  type RankedTrack,
} from "@/lib/playlist-order";

type Track = RankedTrack & { id: string };

function track(id: string, rating: 1 | 2 | 3, addedAt: string): Track {
  return { id, rating, addedAt };
}

function applyMoves<T>(
  items: T[],
  moves: ReturnType<typeof planPlaylistMoves>
) {
  return moves.reduce(
    (current, move) => moveItem(current, move.fromIndex, move.toIndex),
    items
  );
}

describe("sortRankedTracks", () => {
  it("puts 3 stars first, then 2, then 1, newest first within each", () => {
    const tracks = [
      track("two-old", 2, "2026-01-01T00:00:00Z"),
      track("one-new", 1, "2026-10-01T00:00:00Z"),
      track("three-old", 3, "2026-02-01T00:00:00Z"),
      track("two-new", 2, "2026-09-01T00:00:00Z"),
      track("three-new", 3, "2026-08-01T00:00:00Z"),
      track("one-old", 1, "2026-03-01T00:00:00Z"),
    ];

    expect(sortRankedTracks(tracks).map((item) => item.id)).toEqual([
      "three-new",
      "three-old",
      "two-new",
      "two-old",
      "one-new",
      "one-old",
    ]);
  });

  it("does not mutate the input", () => {
    const tracks = [
      track("a", 1, "2026-01-01T00:00:00Z"),
      track("b", 3, "2026-01-01T00:00:00Z"),
    ];
    sortRankedTracks(tracks);
    expect(tracks.map((item) => item.id)).toEqual(["a", "b"]);
  });

  it("treats an unparseable date as oldest", () => {
    const tracks = [
      track("bad", 2, "not a date"),
      track("dated", 2, "2020-01-01T00:00:00Z"),
    ];
    expect(sortRankedTracks(tracks).map((item) => item.id)).toEqual([
      "dated",
      "bad",
    ]);
  });
});

describe("getRankedInsertIndex", () => {
  const playlist = [
    track("three-a", 3, "2026-05-01T00:00:00Z"),
    track("three-b", 3, "2026-04-01T00:00:00Z"),
    track("two-a", 2, "2026-06-01T00:00:00Z"),
    track("one-a", 1, "2026-07-01T00:00:00Z"),
  ];

  it("places a new 2-star track below every 3-star track", () => {
    expect(
      getRankedInsertIndex(playlist, track("new", 2, "2026-11-01T00:00:00Z"))
    ).toBe(2);
  });

  it("places a new 3-star track at the top", () => {
    expect(
      getRankedInsertIndex(playlist, track("new", 3, "2026-11-01T00:00:00Z"))
    ).toBe(0);
  });

  it("places an older 3-star track among the 3 stars by date", () => {
    expect(
      getRankedInsertIndex(playlist, track("mid", 3, "2026-04-15T00:00:00Z"))
    ).toBe(1);
  });

  it("appends when the track outranks nothing", () => {
    expect(
      getRankedInsertIndex(playlist, track("old", 1, "2020-01-01T00:00:00Z"))
    ).toBe(4);
  });

  it("returns 0 for an empty playlist", () => {
    expect(
      getRankedInsertIndex([], track("new", 2, "2026-11-01T00:00:00Z"))
    ).toBe(0);
  });
});

describe("planPlaylistMoves", () => {
  it("returns no moves when already in order", () => {
    const items = ["a", "b", "c"];
    expect(planPlaylistMoves(items, [...items])).toEqual([]);
  });

  it("moves a single item forward in one step", () => {
    const current = ["e", "a", "b", "c", "d"];
    const target = ["a", "b", "c", "d", "e"];
    const moves = planPlaylistMoves(current, target);

    expect(moves).toHaveLength(1);
    expect(applyMoves(current, moves)).toEqual(target);
  });

  it("moves a single item backward in one step", () => {
    const current = ["b", "c", "d", "a"];
    const target = ["a", "b", "c", "d"];
    const moves = planPlaylistMoves(current, target);

    expect(moves).toEqual([{ fromIndex: 3, toIndex: 0 }]);
    expect(applyMoves(current, moves)).toEqual(target);
  });

  it("only moves the old top-five block when the rest is already sorted", () => {
    const current = ["p1", "p2", "p3", "p4", "p5", "n1", "n2", "n3", "n4"];
    const target = ["n1", "n2", "n3", "n4", "p1", "p2", "p3", "p4", "p5"];
    const moves = planPlaylistMoves(current, target);

    expect(moves.length).toBe(4);
    expect(applyMoves(current, moves)).toEqual(target);
  });

  it("reaches the target for a reversed list", () => {
    const current = ["a", "b", "c", "d", "e", "f"];
    const target = [...current].reverse();
    const moves = planPlaylistMoves(current, target);

    expect(moves.length).toBe(5);
    expect(applyMoves(current, moves)).toEqual(target);
  });

  it("handles duplicate tracks by item identity", () => {
    const a1 = track("a", 1, "2026-01-01T00:00:00Z");
    const a2 = track("a", 3, "2026-01-01T00:00:00Z");
    const b = track("b", 2, "2026-01-01T00:00:00Z");
    const current = [a1, b, a2];
    const target = sortRankedTracks(current);

    expect(applyMoves(current, planPlaylistMoves(current, target))).toEqual(
      target
    );
  });

  it("rejects orders that do not hold the same items", () => {
    expect(() => planPlaylistMoves(["a", "b"], ["a", "c"])).toThrow();
  });
});
