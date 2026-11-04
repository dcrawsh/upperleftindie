# GitHub Copilot Instructions

**Read [AGENTS.md](../AGENTS.md) at the repository root and follow it.** It is the single
source of truth for this project's architecture, conventions, environment variables, and
invariants, shared by every agent used on this repo.

File-scoped rules in [instructions/](./instructions/) load automatically when you edit
matching files.

Highest-frequency mistakes to avoid:

- This is **Yarn Classic** — never run `npm install` or `pnpm`.
- Import across directories with the **`@/` alias** (`@/lib/submissions`, `@/app/components/ui/Button`),
  which maps to `./src/*`. Keep same-directory imports relative.
- Every route handler needs `export const runtime = "nodejs";` and Next 15's
  `context: { params: Promise<{ id: string }> }` signature.
- Supabase access goes through `@/lib/supabase`. Do not hand-roll `fetch` to `/rest/v1/`
  and do not add `supabase-js`.
- LLM calls go through `@/lib/ai` (`getAiProvider()`), never a provider's HTTP API directly.
- Verify changes with `yarn lint`, `yarn test`, and `yarn build`.
