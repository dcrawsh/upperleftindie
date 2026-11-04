---
description: "Review uncommitted changes in this repo against its conventions and invariants before committing — checks secrets, Next 15 route patterns, import depth, Tailwind tokens, and AI prompt safety."
argument-hint: "optional: a path or area to focus on"
agent: agent
---

# Review Changes

Review the current uncommitted changes$ARGUMENTS against this repo's conventions.

Start by running `git --no-pager status` and `git --no-pager diff` (add `--staged` as
needed) to see exactly what changed. Read the surrounding code for any file you are unsure
about — judge the change in context, not from the diff alone.

Report only real problems, ordered by severity. Say so plainly if the change is clean.
Skip subjective style nits.

## Checklist

**Security — highest priority**
- No secrets, tokens, API keys, `.env` contents, or real email addresses committed.
- No server-only env var (`SUPABASE_SERVICE_ROLE_KEY`, Spotify, email, admin tokens) read
  from a `"use client"` file or exposed through `NEXT_PUBLIC_`.
- Every new or modified route under `src/app/api/admin/**` calls `assertAdminRequest(req)`.
- Interpolated values in PostgREST query strings are `encodeURIComponent()`-wrapped.
- Error responses and logs do not leak credentials or raw upstream bodies.

**Route handlers**
- `export const runtime = "nodejs";` present.
- Dynamic params typed as `Promise<{ ... }>` and awaited.
- One `try`/`catch` with `console.error`, `instanceof` checks returning `error.status`, and
  a generic 500 fallback.
- Request bodies parsed with `.catch(() => ({}))` and each field validated.
- Status codes are accurate (400/401/404/409/502/504).

**Conventions**
- Cross-directory imports use the `@/` alias, not `../../` chains.
- New failure modes export an error class with a `status` field, and changing which error a
  helper throws does not break what its callers narrow on.
- Supabase access goes through `@/lib/supabase` — no hand-rolled `/rest/v1/` fetches, no
  `supabase-js`.
- LLM calls go through `@/lib/ai`, not a provider's HTTP API directly.
- New pure logic has a sibling `*.test.ts`; no DOM/integration test layer was introduced.
- No new dependency, test runner, or formatter added without a clear reason.
- Tailwind uses semantic tokens (`bg-page`, `text-secondary`, `border-subtle`,
  `rounded-card`), not hex values or legacy `ink`/`paper`/`clay` outside `/admin`.
- Existing `components/ui` primitives reused instead of re-implemented.

**Domain invariants**
- Submission notes still treated as untrusted and length-bounded; the prompt-injection
  guard in `src/lib/local-ai-reply.ts` is intact.
- `AI_REPLY_PROMPT_VERSION` bumped if the prompt, schema, or example format changed.
- Reply drafting still requires `submission.status === "added"`.
- The AI still cannot send email on its own.
- `src/data/artists.generated.ts` not hand-edited.

**Consistency**
- A new env var is documented in `AGENTS.md`, `.env.example`, and `README.md`.
- A schema change has a matching file in `supabase/` using `if not exists`, RLS, and the
  shared `set_updated_at()` trigger — and the user is told to run it manually.
- User-facing error strings are complete, actionable sentences.

Finish by running `yarn lint`, `yarn test`, and `yarn build`, and report any failures.
