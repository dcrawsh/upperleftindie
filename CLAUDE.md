# CLAUDE.md

This project keeps a single, tool-agnostic brief for AI agents so that Copilot, Claude Code,
and Codex all read the same rules.

**Read [AGENTS.md](./AGENTS.md) and follow it.** It covers the stack, directory layout,
commands, naming and error-handling conventions, environment variables, and the invariants
that must not be broken.

Additional file-scoped rules live in [.github/instructions/](./.github/instructions/):

- [api-routes.instructions.md](./.github/instructions/api-routes.instructions.md) — route handlers in `src/app/api/**`
- [data-access.instructions.md](./.github/instructions/data-access.instructions.md) — Supabase/Spotify helpers in `src/lib/**`
- [ui-components.instructions.md](./.github/instructions/ui-components.instructions.md) — React components and Tailwind styling

Quick reminders: Yarn Classic (not npm), `@/` path alias for cross-directory imports,
`export const runtime = "nodejs"` in every route, Supabase through `@/lib/supabase`, LLM
calls through `@/lib/ai`. Verify with `yarn lint`, `yarn test`, and `yarn build`.
