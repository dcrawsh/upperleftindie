# upperleftindie

> Working with an AI coding agent? Start with [AGENTS.md](./AGENTS.md) — it documents the
> architecture, conventions, environment variables, and invariants of this codebase.

## Admin playlist desk

The admin page lives at `/admin`.

Required setup:

- Apply the database migrations with `yarn db:push` (see [Database migrations](#database-migrations)).
- Set `ADMIN_PASSWORD` or `ADMIN_API_TOKEN`.
- Set `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, and `SPOTIFY_REFRESH_TOKEN`.
- Set `SPOTIFY_ARCHIVE_PLAYLIST_ID`.
- Optional: set `SPOTIFY_ACTIVE_PLAYLIST_ID`; otherwise the current public playlist id is used.
- Set `EMAIL_USER` and `EMAIL_PASS` to use the Inbox tab. It connects to
  `EMAIL_HOST` over IMAP on port 993 by default; use the `EMAIL_IMAP_*`
  overrides in `.env.example` when the incoming mailbox or server differs.

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

## Upper Left Radio

Artists may upload one MP3 (12 MB maximum) instead of, or alongside, a Spotify track.
Uploads go directly to the private `submission-audio` Supabase Storage bucket with a
short-lived signed URL. They remain private during review. Sending an acceptance publishes
the MP3 to the continuous `/radio` player; public playback uses a new short-lived signed URL
for each track.

Set `SUBMISSION_AUDIO_UPLOADS_ENABLED=false` to stop issuing new MP3 upload URLs when
Storage usage approaches the free-tier ceiling. Existing submissions and radio playback keep
working. Uploaded objects use date-prefixed paths, and a failed submission save removes its
object when no saved submission references it.

On Vercel, upload preparation is limited to five attempts per public IP address in a
24-hour window; the database stores only a keyed hash of the address and removes inactive
hashes after seven days. Radio responses reuse a track's one-hour signed URL until it has
less than five minutes remaining, allowing repeated plays of that track to share a Supabase
CDN cache key.

Submission audio follows a bounded retention policy:

- Published radio tracks remain in private Storage until the curator removes them.
- Rejected MP3s are hidden immediately, deleted from Storage, and retried by cleanup if the
  first deletion fails.
- Unreviewed pending MP3s become cleanup-eligible after 90 days. MP3-only submissions
  become rejected; submissions that still have a Spotify track remain pending for Spotify
  review.
- Direct uploads that never become a submission become cleanup-eligible after 24 hours.
- Pending rows with a sent acceptance are never expired, preserving the radio repair path.

`yarn cleanup:submission-audio` previews eligible files without changing anything;
`yarn cleanup:submission-audio --delete` applies the cleanup. The weekly
`cleanup-submission-audio` GitHub Action applies it automatically, while manually dispatched
runs default to dry-run mode.

Apply the `add_submission_radio` migration before enabling MP3 submissions. It creates the
private bucket, upload limiter, retention timestamps, and the audio, rights-consent, and
radio-publication columns. The app does not create the bucket at runtime.

The Inbox tab shows the 50 newest messages in the configured mailbox. Opening a
message marks it read, and replies are sent through the existing SMTP account
with the original message headers so mail clients keep the conversation
threaded. Email HTML is converted to plain text in the admin console; attachment
names are shown, but attachments are not downloaded through the site.

The admin Radio tab lists every currently published MP3, supports private playback
previews, and uses the same 1-5 star rating as the Spotify playlist. Spotify-backed radio
tracks share one rating with the playlist; MP3-only tracks store their rating in the same
private ratings table. The list puts the lowest-rated, oldest tracks first so removal
candidates are easy to find, while five-star tracks remain at the bottom. It also shows a
conservative 60-track recommendation and current published-audio usage, leaving free-tier
Storage headroom for pending uploads and delayed cleanup. Removing a track requires
confirmation. Removing an MP3-only track archives its submission; removing a dual
Spotify/MP3 submission leaves its Spotify publication unchanged.

The submission review cards identify uploaded audio with a **Play submitted MP3** control.
It streams the full private upload through a one-hour signed URL so the curator can verify
the file before accepting it. A dual Spotify/MP3 submission also keeps a separate streaming
preview control: Spotify's preview URL when available, otherwise a matched Apple Music
30-second preview. Spotify-only submissions use that same streaming preview path.

Artists may also submit a short optional bio and explicitly approve displaying it publicly.
Only approved bio text is returned by the public Radio API. While a track plays, the radio
bar shows that bio and, when the artist can be matched to the generated Bandcamp directory,
the same Bandcamp image used by the Recently Added cards. Bio text is rendered as plain text,
never HTML, and older submissions without a bio continue to work unchanged. Apply the
`add_artist_approved_radio_bio` migration before accepting bios.

## Database migrations

Schema changes live in `supabase/migrations/` as timestamped SQL files and are applied with
the Supabase CLI, which is a dev dependency. There is one Supabase project and it is
production.

One-time setup on a machine:

```bash
npx supabase login                                  # opens the browser, stores a token locally
npx supabase link --project-ref <project-ref>       # the subdomain of SUPABASE_URL
```

Everyday use:

```bash
yarn db:migration add_something   # creates supabase/migrations/<timestamp>_add_something.sql
yarn db:status                    # local vs. applied migrations
yarn db:push                      # applies pending migrations to the live database
```

`20261104000000_baseline.sql` captures the tables that were created by hand before
migrations existed. On a project where those tables already exist, mark it as applied once
instead of running it:

```bash
npx supabase migration repair --status applied 20261104000000
```

`supabase/seed.sql` holds the Bandcamp source import and only runs against a local database
on `supabase db reset`; it is never pushed.

Claude Code is configured in `.claude/settings.json` to ask before `db:push` or
`migration repair` and to refuse `db reset`. `.mcp.json` adds the official Supabase MCP
server in **read-only** mode so an agent can inspect the live schema and data. It reads two
variables from the shell that launches Claude Code (not from `.env.local`):

```bash
export SUPABASE_ACCESS_TOKEN=...   # https://supabase.com/dashboard/account/tokens
export SUPABASE_PROJECT_REF=...    # the subdomain of SUPABASE_URL
```

## AI acceptance drafts

The admin reply editor can draft acceptance emails with an LLM. Drafts are always shown in
the existing subject and message fields; only the separate Send button delivers an email.

Setup:

1. Apply the database migrations with `yarn db:push`.
2. Choose a provider with `AI_PROVIDER` — `ollama` (default), `openai`, or `anthropic`.
3. For the default local setup: install and start Ollama, then
   `ollama pull qwen3.5:4b-q4_K_M`, and keep both Ollama and the dev server running.

Optional environment overrides:

```bash
AI_PROVIDER=ollama

# ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3.5:4b-q4_K_M
OLLAMA_TIMEOUT_MS=90000

# openai
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

# anthropic
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-3-5-haiku-latest
```

Provider adapters live in `src/lib/ai/providers/`. Adding one means writing a single
adapter and registering it in `src/lib/ai/index.ts` — the prompt and validation logic are
provider-agnostic.

Each generation stores the provider, model, prompt version, input snapshot, generated
copy, curator rating, and the final edited copy that was sent. Drafts rated
Good and then sent become the three positive examples for later generations.
The most recent Needs Work draft is included separately as a labeled negative
counterexample, giving each generation a four-shot prompt.
All sent examples remain available for a future fine-tuning export.
