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

The Inbox tab shows the 50 newest messages in the configured mailbox. Opening a
message marks it read, and replies are sent through the existing SMTP account
with the original message headers so mail clients keep the conversation
threaded. Email HTML is converted to plain text in the admin console; attachment
names are shown, but attachments are not downloaded through the site.

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
Good and then sent become the one- or two-shot examples for later generations.
All sent examples remain available for a future fine-tuning export.
