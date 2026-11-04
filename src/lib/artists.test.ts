import { describe, expect, it } from "vitest";
import {
  cleanBio,
  formatLocation,
  getArtistInitials,
  getPrimaryGenre,
  getRegion,
} from "@/lib/artists";
import type { Artist } from "@/data/artists.generated";

function artist(overrides: Partial<Artist> = {}): Artist {
  return {
    name: "Test Artist",
    location: "Portland, Oregon",
    tags: [],
    ...overrides,
  } as Artist;
}

describe("formatLocation", () => {
  it("title-cases the city and abbreviates the state", () => {
    expect(formatLocation("portland, oregon")).toBe("Portland, OR");
    expect(formatLocation("seattle, washington")).toBe("Seattle, WA");
  });

  it("returns just the city when no region is supplied", () => {
    expect(formatLocation("tacoma")).toBe("Tacoma");
  });

  it("returns an empty string for missing or blank input", () => {
    expect(formatLocation(undefined)).toBe("");
    expect(formatLocation("")).toBe("");
    expect(formatLocation("   ")).toBe("");
  });
});

describe("getRegion", () => {
  it("matches a region named in the location", () => {
    expect(getRegion(artist({ location: "Portland, Oregon" }))).toBe("Oregon");
    expect(getRegion(artist({ location: "Seattle, Washington" }))).toBe(
      "Washington"
    );
  });

  it("falls back to a known city when only a city is given", () => {
    expect(getRegion(artist({ location: "Portland" }))).toBe("Oregon");
  });

  it("returns Elsewhere for unrecognized locations", () => {
    expect(getRegion(artist({ location: "Austin, Texas" }))).toBe("Elsewhere");
    expect(getRegion(artist({ location: "" }))).toBe("Elsewhere");
  });
});

describe("cleanBio", () => {
  it("strips Bandcamp's trailing '... more' artefact", () => {
    expect(cleanBio("A quiet band from the coast... more")).toBe(
      "A quiet band from the coast…"
    );
  });

  it("strips the ellipsis-character variant", () => {
    expect(cleanBio("A quiet band from the coast… more")).toBe(
      "A quiet band from the coast…"
    );
  });

  it("leaves an untruncated bio untouched", () => {
    expect(cleanBio("A quiet band from the coast.")).toBe(
      "A quiet band from the coast."
    );
  });

  it("does not double up terminal punctuation", () => {
    expect(cleanBio("Who are they?... more")).toBe("Who are they?");
  });

  it("returns an empty string for missing or blank input", () => {
    expect(cleanBio(undefined)).toBe("");
    expect(cleanBio("   ")).toBe("");
  });
});

describe("getArtistInitials", () => {
  it("uses the first letter of the first two words", () => {
    expect(getArtistInitials("Harbor Static")).toBe("HS");
    expect(getArtistInitials("The Quiet Hours")).toBe("TQ");
  });

  it("uses the first two letters of a single-word name", () => {
    expect(getArtistInitials("Softcurrent")).toBe("SO");
  });

  it("ignores punctuation", () => {
    expect(getArtistInitials("!!! Static")).toBe("ST");
  });

  it("falls back to ?? when there are no letters", () => {
    expect(getArtistInitials("")).toBe("??");
    expect(getArtistInitials("---")).toBe("??");
  });
});

describe("getPrimaryGenre", () => {
  it("prefers the submitted genre", () => {
    expect(
      getPrimaryGenre(artist({ submittedGenre: "indie rock", tags: ["shoegaze"] }))
    ).toBe("indie rock");
  });

  it("falls back to the first scraped tag", () => {
    expect(getPrimaryGenre(artist({ tags: ["shoegaze", "dream pop"] }))).toBe(
      "shoegaze"
    );
  });

  it("falls back to Other when nothing is known", () => {
    expect(getPrimaryGenre(artist({ tags: [] }))).toBe("Other");
  });
});
