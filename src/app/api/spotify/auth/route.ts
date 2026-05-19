import { NextRequest, NextResponse } from "next/server";
import {
  assertLocalSpotifyAuth,
  assertSpotifyAuthConfigured,
  getRequestOrigin,
  getSpotifyRedirectUri,
} from "../../../../lib/spotify-auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    assertLocalSpotifyAuth();
    assertSpotifyAuthConfigured();

    const state = crypto.randomUUID();
    const authorizeUrl = new URL("https://accounts.spotify.com/authorize");
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("client_id", process.env.SPOTIFY_CLIENT_ID!);
    authorizeUrl.searchParams.set(
      "scope",
      [
        "playlist-read-private",
        "playlist-read-collaborative",
        "playlist-modify-public",
        "playlist-modify-private",
      ].join(" ")
    );
    authorizeUrl.searchParams.set(
      "redirect_uri",
      getSpotifyRedirectUri(getRequestOrigin(req.headers))
    );
    authorizeUrl.searchParams.set("state", state);

    const response = NextResponse.redirect(authorizeUrl);
    response.cookies.set("spotify_auth_state", state, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 10 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Spotify auth could not start.",
      },
      { status: 500 }
    );
  }
}
