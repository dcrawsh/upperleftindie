# AGENTS.md

Orientation for AI coding agents working in this repo. Read this before making changes.
Detailed, file-scoped rules live in [.github/instructions/](./.github/instructions/) and load
automatically when you touch matching files.

## What this project is

Upper Left Indie is the website for a one-person Pacific Northwest independent music
curation project. Independent artists submit Spotify tracks and/or MP3s through a public
form; the operator reviews them in a private `/admin` console, publishes accepted tracks to
Spotify and/or Upper Left Radio, and sends a personal acceptance email — optionally drafted
by a local LLM.

The site also publishes a Bandcamp artist directory and a scraped Portland show calendar.

### Domain glossary

| Term                 | Meaning                                                                                                                                                                                                                                                                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Submission**       | An artist-submitted track row in Supabase. Status flows `pending` → `added` \| `rejected` → `archived`. Sending the acceptance email publishes every supplied destination and promotes it to `added` when they all succeed.                                                                                                             |
| **Active playlist**  | The public, curated Spotify playlist. Accepted tracks are inserted here.                                                                                                                                                                                                                                                                |
| **Track rating**     | A private 1-5 star curator rating per Spotify track URI in `track_ratings`; unrated tracks count as 3. The active playlist is ordered by rating, then newest added first. New tracks are inserted at their rated position, a rating change moves only that track, manual drags persist, and _Sort by Rating_ re-applies the full order. |
| **Archive playlist** | A second Spotify playlist holding tracks rotated out of the active one.                                                                                                                                                                                                                                                                 |
| **Upper Left Radio** | The site's continuous player for curator-approved MP3 submissions. Files stay private in Supabase Storage and public playback uses short-lived signed URLs.                                                                                                                                                                             |
| **Reply draft**      | An AI-generated acceptance email stored in `ai_reply_drafts`, edited by the curator before sending.                                                                                                                                                                                                                                     |
| **Training example** | A draft that was rated Good (`rating=1`) and actually sent. The three most recent become positive few-shot examples; the most recent Needs Work draft is included as a negative counterexample.                                                                                                                                         |
| **Shows**            | Portland-area concert listings populated by `yarn scrape:shows`, rendered at `/shows`.                                                                                                                                                                                                                                                  |
| **Artists**          | A generated Bandcamp artist directory in `src/data/artists.generated.ts`, rendered at `/artists`.                                                                                                                                                                                                                                       |

## Stack

- **Next.js 15.1.11**, App Router, React 18, TypeScript 5 with `strict: true`
- **Tailwind CSS 3.4** with semantic design tokens in [tailwind.config.ts](./tailwind.config.ts)
- **Supabase** (Postgres) accessed over the **PostgREST HTTP API with plain `fetch`** — there is no `supabase-js` dependency
- **Spotify Web API** for playlist management
- **Nodemailer** for transactional email
- **Pluggable LLM providers** (Ollama, OpenAI, Anthropic) for AI reply drafts
- **Vitest** for unit tests, **Prettier** for formatting, **ESLint** via `next lint`
- **Yarn Classic 1.22** — use `yarn`, never `npm` or `pnpm`

## Layout

```
src/app/              App Router pages, layouts, metadata, globals.css
src/app/api/          Route handlers. src/app/api/admin/** is token-protected.
src/app/admin/        Admin console: AdminDashboard orchestrates, *Tab components render
src/app/components/   Shared site components (Nav, forms, cards, containers)
src/app/components/ui Reusable primitives: Button, Field, Tag, SectionHeading, EmptyState, ...
src/lib/              Server/domain helpers: Supabase accessors, Spotify, email, auth
src/lib/supabase.ts   The one Supabase/PostgREST fetch helper
src/lib/ai/           Provider-agnostic LLM layer; adapters in src/lib/ai/providers/
src/lib/**/*.test.ts  Vitest unit tests, next to the code they cover
src/data/             Generated data. Do not hand-edit artists.generated.ts.
scripts/              Standalone Node ESM scripts run by yarn and GitHub Actions
supabase/migrations/  Timestamped SQL migrations, applied with yarn db:push
supabase/seed.sql     Local-only seed data (never pushed)
docs/                 Operational and design documentation
.github/instructions/ File-scoped agent rules, auto-loaded by applyTo globs
.github/hooks/        Deterministic PreToolUse guards (e.g. generated-file protection)
```

## Commands

```bash
yarn dev                        # dev server
yarn build                      # production build
yarn lint                       # next lint, configured by .eslintrc.json (next/core-web-vitals)
yarn test                       # vitest run (unit tests for pure logic)
yarn test:watch                 # vitest in watch mode
yarn format                     # prettier --write .
yarn format:check               # prettier --check . (what CI runs against)
yarn scrape:shows               # populate the shows table
yarn generate:bandcamp-artists  # regenerate src/data/artists.generated.ts
yarn cleanup:submission-audio   # dry-run the MP3 retention cleanup
yarn db:migration <name>        # create supabase/migrations/<timestamp>_<name>.sql
yarn db:status                  # compare local migrations with the live database
yarn db:push                    # apply pending migrations to the live database
```

Tests live next to the code as `src/**/*.test.ts` and cover **pure logic only** —
validation, parsing, normalization, and provider wire formats. There is no component,
integration, or end-to-end test layer, and no test database: anything that needs Supabase,
Spotify, or a live model is verified by hand. Do not add a browser/DOM test setup unless
asked.

To verify a change: `yarn lint && yarn test && yarn build`.

## Conventions that matter

These are the patterns agents most often get wrong here.

1. **Use the `@/` path alias for cross-directory imports.** `@/*` maps to `./src/*`, so
   `import { getSubmission } from "@/lib/submissions";` works from any depth. Same-directory
   imports stay relative (`./AdminDashboard`). Do not reintroduce `../../../` chains.

2. **Next 15 async params.** Dynamic route params are a Promise:

   ```ts
   export async function POST(
     req: NextRequest,
     context: { params: Promise<{ id: string }> }
   ) {
     const { id } = await context.params;
   }
   ```

3. **Every API route declares `export const runtime = "nodejs";`** These routes read
   server secrets and use Node APIs; the Edge runtime is not supported.

4. **Errors are classes carrying an HTTP status.** Each `src/lib` module exports its own
   error class (`SupabaseRequestError`, `SpotifyRequestError`, `AiReplyDraftStoreError`,
   `AdminAuthError`, `LocalAiReplyError`) with a `status` field. Routes `catch`, then
   narrow with `instanceof` and return `Response.json({ error: error.message }, { status: error.status })`.

5. **All Supabase access goes through [src/lib/supabase.ts](./src/lib/supabase.ts).** It owns
   URL building, auth headers, `204` handling, and error shaping. Use `supabaseRequest()`,
   `supabasePath()` for encoded query strings, and `isSupabaseConfigured()` when a caller
   must degrade gracefully instead of throwing. Pass `mapError` to surface a
   resource-specific error class. Never hand-roll a `fetch` to `/rest/v1/`, and never add
   `supabase-js`.

6. **LLM calls go through [src/lib/ai/](./src/lib/ai/).** `getAiProvider()` returns an
   `AiProvider` chosen by `AI_PROVIDER` (`ollama` by default, plus `openai` and
   `anthropic`). Provider-specific wire details stay inside `src/lib/ai/providers/`; the
   domain layer only supplies a system prompt, messages, and a JSON schema. Adding a
   provider means adding one adapter file and registering it in `src/lib/ai/index.ts`.

7. **Secrets stay server-side.** `SUPABASE_SERVICE_ROLE_KEY`, Spotify credentials, email
   credentials, and admin tokens must only ever be read in route handlers, `src/lib`
   modules, server components, or `scripts/`. Never read them in a `"use client"` file
   and never prefix them with `NEXT_PUBLIC_`.

8. **Server components by default.** Add `"use client"` only for interactivity. Server
   pages fetch data and pass it to client components as props — see
   [src/app/artists/page.tsx](./src/app/artists/page.tsx) and
   [src/app/admin/page.tsx](./src/app/admin/page.tsx).

9. **Use Tailwind semantic tokens, not hex values.** `bg-page`, `text-secondary`,
   `border-subtle`, `rounded-card`, `shadow-soft`. The raw `ink`/`paper`/`clay`/`gold`
   tokens are legacy and should only appear in the `/admin` console.

10. **Schema changes are migrations.** Create one with `yarn db:migration <name>`, write
    idempotent SQL (`create table if not exists`, `add column if not exists`), enable RLS,
    and reuse the shared `set_updated_at()` trigger. Never edit a migration that has already
    been pushed; add a new one. Run `yarn db:status` to see what is pending, then
    `yarn db:push`. There is one Supabase project and it is production, so `db:push`
    always asks the curator for approval (see `.claude/settings.json`) and `db reset` is
    denied. The read-only Supabase MCP server in `.mcp.json` is for inspecting the live
    schema and data before writing a migration; it cannot write.

## Invariants — do not break these

- **Submission notes are untrusted input.** They are quoted into the LLM prompt in
  [src/lib/local-ai-reply.ts](./src/lib/local-ai-reply.ts), which instructs the model never
  to follow instructions found inside them, and the route truncates them to 4000
  characters. Preserve both guards in any prompt or pipeline change.
- **Model output is never trusted.** `asDraft()` re-validates shape, types, and length
  bounds before a draft reaches the operator. Keep it in sync with the output schema.
- **Bump `AI_REPLY_PROMPT_VERSION`** whenever the prompt, schema, or example format
  changes — stored drafts are keyed to it for evaluation and future fine-tuning.
- **Sending the acceptance is what publishes the submission and promotes `pending` →
  `added`.** The reply route emails the artist first, then publishes every supplied
  destination: Spotify when there is a track link and Upper Left Radio when there is an
  uploaded MP3. Nothing is published before the email goes out. Rejections are never
  replied to.
- **A submission is `added` only when the email and every supplied destination are done.**
  If Spotify or radio publication fails after a successful send, the row stays `pending`
  with `replied_at` set and the admin repair action completes it later. Do not make either
  repair route assume the other destination already ran.
- **Validate the available listening source before sending an acceptance.** A supplied
  Spotify URL must parse as a track; MP3-only submissions must still point to an uploaded
  private Storage object.
- **Submission audio has bounded retention.** Rejections hide audio before deleting it;
  failed physical deletions are retried weekly. Unreviewed uploads expire after 90 days,
  abandoned direct uploads after 24 hours, and any pending row with `replied_at` set is
  preserved for publication repair. The cleanup command is a dry run unless passed
  `--delete`.
- **The AI never sends email.** Drafts populate the subject/message fields; only the
  explicit Send action delivers mail.
- **Only sent drafts with `rating=1` become positive training examples**, max three, newest first. The most recent draft with `rating=-1` is included separately as a labeled negative counterexample.
- **`src/data/artists.generated.ts` is generated.** Change
  `scripts/update-bandcamp-artists.mjs` or the normalization helpers in
  `src/lib/artists.ts` instead of editing it.
- **Never commit secrets.** `.env.local` and `.env.test1` are local-only; do not read,
  echo, or copy their contents into source, docs, or chat.

## Environment variables

Server-only unless noted. See the referenced file for usage.

| Variable                                                                                                                                       | Used by                                                                               |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`                                                                                                    | all Supabase accessors in `src/lib`, `scripts/`                                       |
| `SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` _(public)_                                                                                | `src/app/shows/page.tsx`                                                              |
| `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF` _(shell, not `.env.local`)_                                                                    | the read-only Supabase MCP server in `.mcp.json`                                      |
| `SUBMISSION_AUDIO_UPLOADS_ENABLED` _(optional, defaults enabled)_                                                                              | pauses new MP3 upload URLs when set to `false`; existing radio playback is unaffected |
| `ADMIN_API_TOKEN` or `ADMIN_PASSWORD`                                                                                                          | `src/lib/admin-auth.ts`                                                               |
| `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`                                                                          | `src/lib/spotify.ts`                                                                  |
| `SPOTIFY_ACTIVE_PLAYLIST_ID`, `SPOTIFY_ARCHIVE_PLAYLIST_ID`, `SPOTIFY_REDIRECT_URI`                                                            | `src/lib/spotify.ts`, `src/lib/spotify-auth.ts`                                       |
| `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `RECIPIENT_EMAIL`                                                      | `src/lib/email.ts`                                                                    |
| `EMAIL_IMAP_USER`, `EMAIL_IMAP_PASS`, `EMAIL_IMAP_HOST`, `EMAIL_IMAP_PORT`, `EMAIL_IMAP_SECURE`, `EMAIL_IMAP_MAILBOX`, `EMAIL_IMAP_TIMEOUT_MS` | `src/lib/mailbox.ts`                                                                  |
| `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `OLLAMA_TIMEOUT_MS`                                                                                         | `src/lib/ai/providers/ollama.ts`                                                      |
| `AI_PROVIDER` (`ollama` \| `openai` \| `anthropic`, default `ollama`)                                                                          | `src/lib/ai/index.ts`                                                                 |
| `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL`                                                                                            | `src/lib/ai/providers/openai.ts`                                                      |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `ANTHROPIC_BASE_URL`                                                                                   | `src/lib/ai/providers/anthropic.ts`                                                   |
| `AI_TIMEOUT_MS`                                                                                                                                | hosted providers in `src/lib/ai/providers/`                                           |
| `MAILER_PROVIDER`, `MAILER_API_KEY`, `MAILERLITE_API_KEY`                                                                                      | `src/app/api/newsletter/subscribe/route.ts`                                           |
| `STRIPE_SECRET_KEY`                                                                                                                            | `src/app/api/support/checkout/route.ts`                                               |
| `NEXT_PUBLIC_SITE_URL` _(public)_                                                                                                              | `src/app/api/support/checkout/route.ts`                                               |

Adding a variable means documenting it here, in [.env.example](./.env.example), and in
[README.md](./README.md).

## Working style

- Match the surrounding file's style; this codebase favors small, explicit, dependency-free
  helpers over abstractions.
- Prefer adding to `src/lib` over inlining logic in a route handler.
- **Keep components under ~400 lines.** The admin console is the worked example: state and
  actions live in [AdminDashboard.tsx](./src/app/admin/AdminDashboard.tsx), session and
  audio concerns in `useAdminSession`/`useTrackPreview`, pure functions in
  `src/app/admin/helpers.ts` (unit-tested), and each tab renders from its own
  `*Tab.tsx` receiving explicit props. Follow that shape rather than growing one file.
- Extract pure logic into a plain function so it can be unit-tested without a DOM.
- Add dependencies only when genuinely necessary — the dependency list is deliberately tiny.
- Comment only non-obvious decisions. Most of this code is intentionally uncommented.
- After editing TypeScript, run `yarn lint`, `yarn test`, and `yarn build`.
