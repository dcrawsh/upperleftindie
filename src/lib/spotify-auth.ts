const defaultSpotifyRedirectUri =
  "http://127.0.0.1:3000/api/spotify/callback";

export function getSpotifyRedirectUri(origin?: string) {
  if (process.env.SPOTIFY_REDIRECT_URI) {
    return process.env.SPOTIFY_REDIRECT_URI;
  }

  if (origin) {
    return `${origin.replace(/\/$/, "")}/api/spotify/callback`;
  }

  return defaultSpotifyRedirectUri;
}

export function getRequestOrigin(headers: Headers) {
  const host = headers.get("host");
  const protocol = headers.get("x-forwarded-proto") ?? "http";

  return host ? `${protocol}://${host}` : undefined;
}

export function assertSpotifyAuthConfigured() {
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    throw new Error(
      "Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.local first."
    );
  }
}

export function assertLocalSpotifyAuth() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Spotify auth helper is disabled in production.");
  }
}
