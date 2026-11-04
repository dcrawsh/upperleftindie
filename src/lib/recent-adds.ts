import { findArtistByName } from "./artists";
import {
  getSpotifyTrackFromUrl,
  listActivePlaylistTracks,
} from "./spotify";
import {
  isSupabaseConfigured,
  supabasePath,
  supabaseRequest,
} from "./supabase";

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
  // Fetch enough historical candidates to backfill the rail when older rows
  // still say "added" even though the track was removed directly in Spotify.
  const adds = await getRecentAdds(Math.max(limit, 100));

  if (adds.length === 0) {
    return [];
  }

  const activeTracks = await listActivePlaylistTracks().catch(() => {
    // Fail closed: a card should never claim a track is currently active when
    // Spotify membership could not be verified.
    console.warn("recent adds: active playlist unavailable");
    return null;
  });

  if (!activeTracks) {
    return [];
  }

  const activeTracksByUri = new Map(
    activeTracks.map((track) => [track.uri, track])
  );

  return adds
    .flatMap((add) => {
      const parsedTrack = getSpotifyTrackFromUrl(add.songLink);
      const activeTrack = parsedTrack
        ? activeTracksByUri.get(parsedTrack.uri)
        : undefined;

      if (!activeTrack) {
        return [];
      }

      const directoryArtist = findArtistByName(add.artistName);

      return [
        {
          key: `${add.artistName}-${add.addedAt}`,
          artistName: add.artistName,
          trackTitle: activeTrack.name,
          place: formatRecentAddPlace(add),
          addedLabel: formatAddedDate(add.addedAt),
          imageSrc: activeTrack.imageUrl || directoryArtist?.image || undefined,
          spotifyUrl: activeTrack.externalUrl || add.songLink,
          bandcampUrl:
            add.bandcampLink ?? directoryArtist?.bandcampUrl ?? undefined,
        },
      ];
    })
    .slice(0, limit);
}

export async function getRecentAdds(limit = 3): Promise<RecentAdd[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const path = supabasePath("submissions", {
    select: PUBLIC_COLUMNS,
    status: "eq.added",
    artist_page_consent: "is.true",
    active_playlist_added_at: "not.is.null",
    order: "active_playlist_added_at.desc",
    limit: String(limit),
  });

  try {
    const rows = await supabaseRequest<RecentAddRow[]>(path);

    return rows.map((row) => ({
      artistName: row.artist_name,
      city: row.city ?? "",
      region: row.region ?? "",
      genre: row.genre ?? "",
      songLink: row.song_link,
      bandcampLink: row.bandcamp_link,
      addedAt: row.active_playlist_added_at,
    }));
  } catch (error) {
    // Status/message only — submission rows must never reach the logs.
    console.error(
      "recent adds fetch failed",
      error instanceof Error ? error.message : "Unknown error"
    );
    return [];
  }
}
