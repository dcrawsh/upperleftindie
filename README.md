# upperleftindie

> Working with an AI coding agent? Start with [AGENTS.md](./AGENTS.md) — it documents the
> architecture, conventions, environment variables, and invariants of this codebase.

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

## AI acceptance drafts

The admin reply editor can draft acceptance emails with an LLM. Drafts are always shown in
the existing subject and message fields; only the separate Send button delivers an email.

Setup:

1. Run `supabase/ai-reply-drafts.sql` in the Supabase SQL editor.
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
