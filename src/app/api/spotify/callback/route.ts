import { NextRequest, NextResponse } from "next/server";
import {
  assertLocalSpotifyAuth,
  assertSpotifyAuthConfigured,
  getRequestOrigin,
  getSpotifyRedirectUri,
} from "../../../../lib/spotify-auth";

export const runtime = "nodejs";

function renderHtml(body: string) {
  return new Response(
    `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Spotify Refresh Token</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 2rem; line-height: 1.5; color: #101014; background: #fffdf6; }
      code, textarea { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
      textarea { width: 100%; min-height: 9rem; padding: 1rem; border: 1px solid #ccc; border-radius: 6px; }
      .box { max-width: 840px; padding: 1.5rem; background: white; border: 1px solid #ddd; border-radius: 8px; }
    </style>
  </head>
  <body>
    <main class="box">${body}</main>
  </body>
</html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    }
  );
}

export async function GET(req: NextRequest) {
  try {
    assertLocalSpotifyAuth();
    assertSpotifyAuthConfigured();

    const code = req.nextUrl.searchParams.get("code");
    const spotifyError = req.nextUrl.searchParams.get("error");
    const state = req.nextUrl.searchParams.get("state");
    const expectedState = req.cookies.get("spotify_auth_state")?.value;

    if (spotifyError) {
      return renderHtml(`
        <h1>Spotify did not authorize the request.</h1>
        <p>Spotify returned: <code>${spotifyError}</code></p>
        <p>Start again from <a href="/api/spotify/auth">/api/spotify/auth</a>.</p>
      `);
    }

    if (!code) {
      return renderHtml(`
        <h1>No authorization code returned.</h1>
        <p>Start from <a href="/api/spotify/auth">/api/spotify/auth</a>, not this callback URL.</p>
        <p>If Spotify sent you here, make sure this exact redirect URI is saved in your Spotify app:</p>
        <p><code>${getSpotifyRedirectUri(getRequestOrigin(req.headers))}</code></p>
      `);
    }

    if (!state || state !== expectedState) {
      return renderHtml("<h1>Spotify auth state did not match.</h1>");
    }

    const credentials = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString("base64");

    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: getSpotifyRedirectUri(getRequestOrigin(req.headers)),
      }),
    });

    const response = NextResponse.next();
    response.cookies.delete("spotify_auth_state");

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      return renderHtml(`<h1>Spotify token exchange failed.</h1><pre>${errorText}</pre>`);
    }

    const token = (await tokenResponse.json()) as {
      refresh_token?: string;
      scope?: string;
    };

    if (!token.refresh_token) {
      return renderHtml("<h1>No refresh token returned by Spotify.</h1>");
    }

    return renderHtml(`
      <h1>Spotify refresh token</h1>
      <p>Add this to <code>.env.local</code> as <code>SPOTIFY_REFRESH_TOKEN</code>.</p>
      <textarea readonly>${token.refresh_token}</textarea>
      <p>Granted scope: <code>${token.scope ?? "unknown"}</code></p>
    `);
  } catch (error) {
    return renderHtml(
      `<h1>Spotify auth failed.</h1><p>${
        error instanceof Error ? error.message : "Unknown error"
      }</p>`
    );
  }
}
