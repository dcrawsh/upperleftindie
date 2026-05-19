export type SpotifyPlaylistTrack = {
  uri: string;
  id: string;
  name: string;
  artistNames: string;
  albumName: string;
  externalUrl: string;
  imageUrl: string;
  addedAt: string;
};

export type SpotifyTrackSummary = {
  id: string;
  name: string;
};

export class SpotifyRequestError extends Error {
  constructor(
    message: string,
    readonly status = 500
  ) {
    super(message);
  }
}

const spotifyTrackIdPattern = /^[A-Za-z0-9]{22}$/;
const defaultActivePlaylistId = "3LTI227By7Wt7hGs3mz5hF";
const activePlaylistInsertionPosition = 5;

function getSpotifyConfig() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
  const activePlaylistId =
    process.env.SPOTIFY_ACTIVE_PLAYLIST_ID ?? defaultActivePlaylistId;
  const archivePlaylistId = process.env.SPOTIFY_ARCHIVE_PLAYLIST_ID;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new SpotifyRequestError(
      "Spotify is not configured. Set SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, and SPOTIFY_REFRESH_TOKEN.",
      500
    );
  }

  return {
    clientId,
    clientSecret,
    refreshToken,
    activePlaylistId,
    archivePlaylistId,
  };
}

async function getAccessToken() {
  const { clientId, clientSecret, refreshToken } = getSpotifyConfig();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new SpotifyRequestError(
      `Spotify token request failed with ${response.status}`,
      response.status
    );
  }

  const token = (await response.json()) as { access_token?: string };
  if (!token.access_token) {
    throw new SpotifyRequestError("Spotify token response was missing a token.");
  }

  return token.access_token;
}

async function spotifyRequest<T>(path: string, init: RequestInit = {}) {
  const accessToken = await getAccessToken();
  const response = await fetch(`https://api.spotify.com/v1/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    const details = await response.text();
    throw new SpotifyRequestError(
      details || `Spotify request failed with ${response.status}`,
      response.status
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function getSpotifyTrackFromUrl(value: string) {
  const trimmed = value.trim();

  if (trimmed.startsWith("spotify:track:")) {
    const id = trimmed.split(":")[2] ?? "";
    return spotifyTrackIdPattern.test(id) ? { id, uri: trimmed } : null;
  }

  try {
    const url = new URL(trimmed);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const trackIndex = pathParts.indexOf("track");
    const id = trackIndex >= 0 ? pathParts[trackIndex + 1] : "";

    if (!spotifyTrackIdPattern.test(id)) {
      return null;
    }

    return { id, uri: `spotify:track:${id}` };
  } catch {
    return null;
  }
}

export async function addTrackToActivePlaylist(trackUri: string) {
  const { activePlaylistId } = getSpotifyConfig();

  await spotifyRequest(`playlists/${activePlaylistId}/items`, {
    method: "POST",
    body: JSON.stringify({
      uris: [trackUri],
      position: activePlaylistInsertionPosition,
    }),
  });
}

export async function getSpotifyTrackSummary(trackId: string) {
  const track = await spotifyRequest<SpotifyTrackSummary>(`tracks/${trackId}`);

  return {
    id: track.id,
    name: track.name,
  };
}

export async function archiveTrack(trackUri: string) {
  const { activePlaylistId, archivePlaylistId } = getSpotifyConfig();

  if (!archivePlaylistId) {
    throw new SpotifyRequestError(
      "Spotify archive playlist is not configured. Set SPOTIFY_ARCHIVE_PLAYLIST_ID.",
      500
    );
  }

  await spotifyRequest(`playlists/${archivePlaylistId}/items`, {
    method: "POST",
    body: JSON.stringify({ uris: [trackUri] }),
  });

  await spotifyRequest(`playlists/${activePlaylistId}/items`, {
    method: "DELETE",
    body: JSON.stringify({ items: [{ uri: trackUri }] }),
  });
}

type SpotifyPlaylistTracksResponse = {
  next?: string | null;
  items: Array<{
    added_at: string;
    item: {
      uri: string;
      id: string;
      name: string;
      type?: string;
      album?: {
        name?: string;
        images?: Array<{ url: string; width?: number; height?: number }>;
      };
      artists?: Array<{ name: string }>;
      external_urls?: { spotify?: string };
    } | null;
  }>;
};

async function listPlaylistTracks(playlistId: string) {
  const fields = encodeURIComponent(
    "next,items(added_at,item(uri,id,name,type,album(name,images),artists(name),external_urls))"
  );
  const items: SpotifyPlaylistTracksResponse["items"] = [];
  let offset = 0;
  let hasNextPage = true;

  while (hasNextPage) {
    const data = await spotifyRequest<SpotifyPlaylistTracksResponse>(
      `playlists/${playlistId}/items?limit=50&offset=${offset}&fields=${fields}`
    );

    items.push(...data.items);
    hasNextPage = Boolean(data.next);
    offset += 50;
  }

  return items
    .filter((item) => item.item?.uri && item.item.type === "track")
    .map((item): SpotifyPlaylistTrack => {
      const track = item.item!;
      const image = track.album?.images?.[0]?.url ?? "";

      return {
        uri: track.uri,
        id: track.id,
        name: track.name,
        artistNames:
          track.artists?.map((artist) => artist.name).join(", ") ||
          "Unknown artist",
        albumName: track.album?.name ?? "Unknown album",
        externalUrl: track.external_urls?.spotify ?? "",
        imageUrl: image,
        addedAt: item.added_at,
      };
    });
}

export async function listActivePlaylistTracks() {
  const { activePlaylistId } = getSpotifyConfig();

  return listPlaylistTracks(activePlaylistId);
}

export async function listArchivePlaylistTracks() {
  const { archivePlaylistId } = getSpotifyConfig();

  if (!archivePlaylistId) {
    throw new SpotifyRequestError(
      "Spotify archive playlist is not configured. Set SPOTIFY_ARCHIVE_PLAYLIST_ID.",
      500
    );
  }

  return listPlaylistTracks(archivePlaylistId);
}

export async function unarchiveTrack(trackUri: string) {
  const { activePlaylistId, archivePlaylistId } = getSpotifyConfig();

  if (!archivePlaylistId) {
    throw new SpotifyRequestError(
      "Spotify archive playlist is not configured. Set SPOTIFY_ARCHIVE_PLAYLIST_ID.",
      500
    );
  }

  await spotifyRequest(`playlists/${activePlaylistId}/items`, {
    method: "POST",
    body: JSON.stringify({
      uris: [trackUri],
      position: activePlaylistInsertionPosition,
    }),
  });

  await spotifyRequest(`playlists/${archivePlaylistId}/items`, {
    method: "DELETE",
    body: JSON.stringify({ items: [{ uri: trackUri }] }),
  });
}
