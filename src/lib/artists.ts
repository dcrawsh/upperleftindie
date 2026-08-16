import { artists as generatedArtists, type Artist } from "../data/artists.generated";

/**
 * Presentation helpers for the generated Bandcamp artist directory.
 *
 * The scraper writes `src/data/artists.generated.ts` verbatim from Bandcamp, so
 * the data carries real-world mess: inconsistent location casing and
 * granularity, and bios truncated by Bandcamp with a literal "... more". This
 * module normalises for display only — it never rewrites the generated file.
 */

export type { Artist };

export const REGIONS = [
  "Oregon",
  "Washington",
  "Idaho",
  "Alaska",
  "British Columbia",
  "Elsewhere",
] as const;

export type Region = (typeof REGIONS)[number];

const STATE_ABBREVIATIONS: Record<string, string> = {
  oregon: "OR",
  washington: "WA",
  idaho: "ID",
  alaska: "AK",
  "british columbia": "BC",
  montana: "MT",
  california: "CA",
  colorado: "CO",
  "new york": "NY",
};

const REGION_BY_NAME: Record<string, Region> = {
  oregon: "Oregon",
  washington: "Washington",
  idaho: "Idaho",
  alaska: "Alaska",
  "british columbia": "British Columbia",
};

// A handful of entries carry a bare city with no state. These are the cities
// that actually appear in the generated data.
const REGION_BY_CITY: Record<string, Region> = {
  portland: "Oregon",
  eugene: "Oregon",
  joseph: "Oregon",
  seattle: "Washington",
  bellingham: "Washington",
  eastsound: "Washington",
  tacoma: "Washington",
  spokane: "Washington",
  olympia: "Washington",
  boise: "Idaho",
  anchorage: "Alaska",
  juneau: "Alaska",
  vancouver: "British Columbia",
  victoria: "British Columbia",
};

function titleCase(value: string) {
  return value
    .split(" ")
    .map((word) =>
      word.length > 0 ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word
    )
    .join(" ");
}

function locationParts(location?: string) {
  return (location ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

/** "Bozeman, montana" -> "Bozeman, MT"; "Seattle" -> "Seattle". */
export function formatLocation(location?: string) {
  const parts = locationParts(location);

  if (parts.length === 0) {
    return "";
  }

  const city = titleCase(parts[0]);

  if (parts.length === 1) {
    return city;
  }

  const tail = parts[parts.length - 1];
  const abbreviation = STATE_ABBREVIATIONS[tail.toLowerCase()];

  return `${city}, ${abbreviation ?? titleCase(tail)}`;
}

export function getRegion(artist: Artist): Region {
  const parts = locationParts(artist.location);

  for (const part of parts) {
    const region = REGION_BY_NAME[part.toLowerCase()];
    if (region) {
      return region;
    }
  }

  if (parts.length === 1) {
    const region = REGION_BY_CITY[parts[0].toLowerCase()];
    if (region) {
      return region;
    }
  }

  return "Elsewhere";
}

/**
 * Bandcamp truncates long bios and appends a literal "... more". Shipping that
 * to a visitor reads as a broken link, so the artefact is trimmed back to the
 * last complete sentence or clause.
 */
export function cleanBio(bio?: string) {
  const trimmed = (bio ?? "").trim();

  if (!trimmed) {
    return "";
  }

  const withoutArtefact = trimmed
    .replace(/\s*\.{2,}\s*more\s*$/i, "")
    .replace(/\s*…\s*more\s*$/i, "")
    .trim();

  if (!withoutArtefact) {
    return "";
  }

  // Only re-mark it as truncated if something was actually cut off.
  const wasTruncated = withoutArtefact.length < trimmed.length;

  return wasTruncated && !/[.!?"'’”)…]$/.test(withoutArtefact)
    ? `${withoutArtefact}…`
    : withoutArtefact;
}

/**
 * One genre taxonomy. `submittedGenre` and the scraped `tags` already use the
 * labels offered by the submission form, so the primary genre is simply the
 * first of those that exists — no regex inference over bio text.
 */
export function getPrimaryGenre(artist: Artist) {
  return artist.submittedGenre?.trim() || artist.tags[0]?.trim() || "Other";
}

export function getArtistInitials(name: string) {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "??";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function getArtists(): Artist[] {
  return generatedArtists;
}

/**
 * Used by the homepage to pair a playlist add with directory artwork. Matching
 * is by exact (case- and punctuation-insensitive) artist name — the submissions
 * table and the Bandcamp directory have no shared key.
 */
export function findArtistByName(name: string): Artist | undefined {
  const normalise = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]/gu, "")
      .trim();

  const target = normalise(name);

  if (!target) {
    return undefined;
  }

  return generatedArtists.find((artist) => normalise(artist.name) === target);
}
