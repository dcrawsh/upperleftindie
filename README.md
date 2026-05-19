# upperleftindie

## Admin playlist desk

The admin page lives at `/admin`.

Required setup:

- Run `supabase/submissions.sql` in Supabase.
- Set `ADMIN_PASSWORD` or `ADMIN_API_TOKEN`.
- Set `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, and `SPOTIFY_REFRESH_TOKEN`.
- Set `SPOTIFY_ARCHIVE_PLAYLIST_ID`.
- Optional: set `SPOTIFY_ACTIVE_PLAYLIST_ID`; otherwise the current public playlist id is used.

To generate `SPOTIFY_REFRESH_TOKEN` locally:

1. Add this exact redirect URI to the Spotify app:
   `http://127.0.0.1:3000/api/spotify/callback`
   If Next starts on another port, add that version too, for example
   `http://127.0.0.1:3001/api/spotify/callback`.
2. Start the dev server.
3. Visit `http://127.0.0.1:3000/api/spotify/auth`.
4. Authorize Spotify and paste the returned token into `.env.local`.

The token must be generated from the Spotify account that owns or can edit both
the active and archive playlists.

New public submissions are saved to Supabase through `/api/submissions`, then
the admin page can add pending tracks to Spotify or move active playlist tracks
to the archive playlist.
