# AGENTS.md

Orientation for AI coding agents working in this repo. Read this before making changes.
Detailed, file-scoped rules live in [.github/instructions/](./.github/instructions/) and load
automatically when you touch matching files.

## What this project is

Upper Left Indie is the website for a one-person Pacific Northwest independent music
curation project. Independent artists submit Spotify tracks through a public form; the
operator reviews them in a private `/admin` console, adds accepted tracks to a curated
Spotify playlist, and sends a personal acceptance email — optionally drafted by a local LLM.

The site also publishes a Bandcamp artist directory and a scraped Portland show calendar.

### Domain glossary

| Term | Meaning |
| --- | --- |
| **Submission** | An artist-submitted track row in Supabase. Status flows `pending` → `added` \| `rejected` → `archived`. |
| **Active playlist** | The public, curated Spotify playlist. Accepted tracks are inserted here. |
| **Archive playlist** | A second Spotify playlist holding tracks rotated out of the active one. |
| **Reply draft** | An AI-generated acceptance email stored in `ai_reply_drafts`, edited by the curator before sending. |
| **Training example** | A draft that was rated Good (`rating=1`) and actually sent. The two most recent become few-shot examples for later generations. |
| **Shows** | Portland-area concert listings populated by `yarn scrape:shows`, rendered at `/shows`. |
| **Artists** | A generated Bandcamp artist directory in `src/data/artists.generated.ts`, rendered at `/artists`. |

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
src/app/components/   Shared site components (Nav, forms, cards, containers)
src/app/components/ui Reusable primitives: Button, Field, Tag, SectionHeading, EmptyState, ...
src/lib/              Server/domain helpers: Supabase accessors, Spotify, email, auth
src/lib/supabase.ts   The one Supabase/PostgREST fetch helper
src/lib/ai/           Provider-agnostic LLM layer; adapters in src/lib/ai/providers/
src/lib/**/*.test.ts  Vitest unit tests, next to the code they cover
src/data/             Generated data. Do not hand-edit artists.generated.ts.
scripts/              Standalone Node ESM scripts run by yarn and GitHub Actions
supabase/             Hand-applied SQL. No migration CLI.
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

10. **SQL is applied by hand.** Changing a table means editing the file in `supabase/` and
   telling the user to run it in the Supabase SQL editor. Use `create table if not exists`,
   enable RLS, and reuse the shared `set_updated_at()` trigger.

## Invariants — do not break these

- **Submission notes are untrusted input.** They are quoted into the LLM prompt in
  [src/lib/local-ai-reply.ts](./src/lib/local-ai-reply.ts), which instructs the model never
  to follow instructions found inside them, and the route truncates them to 4000
  characters. Preserve both guards in any prompt or pipeline change.
- **Model output is never trusted.** `asDraft()` re-validates shape, types, and length
  bounds before a draft reaches the operator. Keep it in sync with the output schema.
- **Bump `AI_REPLY_PROMPT_VERSION`** whenever the prompt, schema, or example format
  changes — stored drafts are keyed to it for evaluation and future fine-tuning.
- **A submission must be `status === "added"` before a reply can be drafted** — the
  draft-reply route returns 409 otherwise.
- **The AI never sends email.** Drafts populate the subject/message fields; only the
  explicit Send action delivers mail.
- **Only sent drafts with `rating=1` become training examples**, max two, newest first.
- **`src/data/artists.generated.ts` is generated.** Change
  `scripts/update-bandcamp-artists.mjs` or the normalization helpers in
  `src/lib/artists.ts` instead of editing it.
- **Never commit secrets.** `.env.local` and `.env.test1` are local-only; do not read,
  echo, or copy their contents into source, docs, or chat.

## Environment variables

Server-only unless noted. See the referenced file for usage.

| Variable | Used by |
| --- | --- |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | all Supabase accessors in `src/lib`, `scripts/` |
| `SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` *(public)* | `src/app/shows/page.tsx` |
| `ADMIN_API_TOKEN` or `ADMIN_PASSWORD` | `src/lib/admin-auth.ts` |
| `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN` | `src/lib/spotify.ts` |
| `SPOTIFY_ACTIVE_PLAYLIST_ID`, `SPOTIFY_ARCHIVE_PLAYLIST_ID`, `SPOTIFY_REDIRECT_URI` | `src/lib/spotify.ts`, `src/lib/spotify-auth.ts` |
| `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `RECIPIENT_EMAIL` | `src/lib/email.ts` |
| `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `OLLAMA_TIMEOUT_MS` | `src/lib/ai/providers/ollama.ts` |
| `AI_PROVIDER` (`ollama` \| `openai` \| `anthropic`, default `ollama`) | `src/lib/ai/index.ts` |
| `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL` | `src/lib/ai/providers/openai.ts` |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `ANTHROPIC_BASE_URL` | `src/lib/ai/providers/anthropic.ts` |
| `AI_TIMEOUT_MS` | hosted providers in `src/lib/ai/providers/` |
| `MAILER_PROVIDER`, `MAILER_API_KEY`, `MAILERLITE_API_KEY` | `src/app/api/newsletter/subscribe/route.ts` |
| `STRIPE_SECRET_KEY` | `src/app/api/support/checkout/route.ts` |
| `NEXT_PUBLIC_SITE_URL` *(public)* | `src/app/api/support/checkout/route.ts` |

Adding a variable means documenting it here, in [.env.example](./.env.example), and in
[README.md](./README.md).

## Working style

- Match the surrounding file's style; this codebase favors small, explicit, dependency-free
  helpers over abstractions.
- Prefer adding to `src/lib` over inlining logic in a route handler.
- Add dependencies only when genuinely necessary — the dependency list is deliberately tiny.
- Comment only non-obvious decisions. Most of this code is intentionally uncommented.
- After editing TypeScript, run `yarn lint` and `yarn build`.
