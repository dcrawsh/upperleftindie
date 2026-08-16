import { findArtistByName } from "./artists";
import {
  getPublicTrackDetails,
  getSpotifyTrackFromUrl,
  type SpotifyPublicTrack,
} from "./spotify";

/**
 * Recent playlist adds, attributed.
 *
 * The audit's highest-value finding was that a listener who hears something
 * they like inside the Spotify embed has no route to the artist. The join that
 * fixes it already exists in the data model: submissions carry the Spotify
 * track, the Bandcamp link, and the moment the track went on the active
 * playlist. This module exposes that — and nothing else — to the public site.
 *
 * Three deliberate constraints:
 *  - only columns that are safe to publish are selected; contact name, email,
 *    private notes and admin notes never leave the server;
 *  - a row is only eligible if the artist ticked the "feature this artist on
 *    the site" consent box, because that is exactly what this surface does;
 *  - failures degrade to an empty list rather than taking the homepage down.
 */
const PUBLIC_COLUMNS = [
  "artist_name",
  "city",
  "region",
  "genre",
  "song_link",
  "bandcamp_link",
  "active_playlist_added_at",
].join(",");

export type RecentAdd = {
  artistName: string;
  city: string;
  region: string;
  genre: string;
  songLink: string;
  bandcampLink: string | null;
  addedAt: string;
};

type RecentAddRow = {
  artist_name: string;
  city: string | null;
  region: string | null;
  genre: string | null;
  song_link: string;
  bandcamp_link: string | null;
  active_playlist_added_at: string;
};

const REGION_LABELS: Record<string, string> = {
  oregon: "Oregon",
  washington: "Washington",
  idaho: "Idaho",
  alaska: "Alaska",
  bc: "British Columbia",
  "british-columbia": "British Columbia",
  "other-region": "",
};

function titleCase(value: string) {
  return value
    .split(" ")
    .map((word) =>
      word.length > 0 ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word
    )
    .join(" ");
}

export function formatRecentAddPlace(add: RecentAdd) {
  const city = add.city.trim() ? titleCase(add.city.trim()) : "";
  const region = REGION_LABELS[add.region.trim().toLowerCase()] ?? "";

  return [city, region].filter(Boolean).join(", ");
}

export function formatAddedDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/Los_Angeles",
  }).format(date);
}

export type RecentTrackCard = {
  key: string;
  artistName: string;
  trackTitle?: string;
  place: string;
  addedLabel: string;
  imageSrc?: string;
  spotifyUrl: string;
  bandcampUrl?: string;
};

/**
 * Composes what the homepage rail actually renders: the playlist add, the real
 * track title and album art where Spotify is configured, and the artist's own
 * directory artwork as a second source. Artwork is only ever used when it
 * belongs to that artist — otherwise the card falls back to initials.
 */
export async function getRecentTrackCards(limit = 3): Promise<RecentTrackCard[]> {
  const adds = await getRecentAdds(limit);

  if (adds.length === 0) {
    return [];
  }

  const trackIds = new Map<string, string>();

  for (const add of adds) {
    const track = getSpotifyTrackFromUrl(add.songLink);
    if (track) {
      trackIds.set(add.songLink, track.id);
    }
  }

  let trackDetails = new Map<string, SpotifyPublicTrack>();

  try {
    trackDetails = await getPublicTrackDetails([...trackIds.values()]);
  } catch {
    // Spotify is optional for this surface: without it the card still carries
    // the artist, the place, the date and both outbound links.
    console.error("recent adds: spotify track lookup unavailable");
  }

  return adds.map((add) => {
    const trackId = trackIds.get(add.songLink);
    const details = trackId ? trackDetails.get(trackId) : undefined;
    const directoryArtist = findArtistByName(add.artistName);

    return {
      key: `${add.artistName}-${add.addedAt}`,
      artistName: add.artistName,
      trackTitle: details?.name,
      place: formatRecentAddPlace(add),
      addedLabel: formatAddedDate(add.addedAt),
      imageSrc: details?.imageUrl || directoryArtist?.image || undefined,
      spotifyUrl: details?.externalUrl || add.songLink,
      bandcampUrl:
        add.bandcampLink ?? directoryArtist?.bandcampUrl ?? undefined,
    };
  });
}

export async function getRecentAdds(limit = 3): Promise<RecentAdd[]> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return [];
  }

  const params = new URLSearchParams({
    select: PUBLIC_COLUMNS,
    status: "eq.added",
    artist_page_consent: "is.true",
    active_playlist_added_at: "not.is.null",
    order: "active_playlist_added_at.desc",
    limit: String(limit),
  });

  try {
    const response = await fetch(
      `${supabaseUrl.replace(/\/$/, "")}/rest/v1/submissions?${params.toString()}`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: {
          revalidate: 900,
        },
      }
    );

    if (!response.ok) {
      // Status only — submission rows must never reach the logs.
      console.error("recent adds fetch failed", response.status);
      return [];
    }

    const rows = (await response.json()) as RecentAddRow[];

    return rows.map((row) => ({
      artistName: row.artist_name,
      city: row.city ?? "",
      region: row.region ?? "",
      genre: row.genre ?? "",
      songLink: row.song_link,
      bandcampLink: row.bandcamp_link,
      addedAt: row.active_playlist_added_at,
    }));
  } catch {
    console.error("recent adds fetch failed");
    return [];
  }
}
