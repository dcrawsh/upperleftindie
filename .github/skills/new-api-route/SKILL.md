---
name: new-api-route
description: "Scaffold a new Next.js API route handler following this repo's conventions: nodejs runtime, async params, admin auth, defensive validation, and instanceof error mapping."
disable-model-invocation: true
argument-hint: "e.g. POST /api/admin/submissions/[id]/reject that sets status to rejected"
---
# New API Route

Create a new route handler for: **$ARGUMENTS**

If the method, path, request body, or response shape is unclear, ask before writing code.

## Steps

1. **Read a reference route first** so the generated code matches current style:
   - public: [src/app/api/submissions/route.ts](../../src/app/api/submissions/route.ts)
   - admin + dynamic param: [src/app/api/admin/submissions/[id]/reply/route.ts](../../src/app/api/admin/submissions/%5Bid%5D/reply/route.ts)
2. **Decide placement.** Anything operator-only belongs under `src/app/api/admin/**` and
   must call `assertAdminRequest(req)`.
3. **Check `src/lib` for an existing helper.** Reuse `submissions.ts`, `spotify.ts`,
   `ai-reply-drafts.ts`, or `email.ts` rather than writing new fetch logic in the route.
   If new data access is needed, add it to the relevant `src/lib` module following that
   module's wrapper and error-class pattern.
4. **Write the handler** in `src/app/api/<path>/route.ts`:
   - `export const runtime = "nodejs";`
   - Next 15 signature with `context: { params: Promise<{ ... }> }` for dynamic segments
   - `@/` alias imports (`@/lib/admin-auth`), never `../../../` chains
   - `assertAdminRequest(req)` as the first statement in the `try` for admin routes
   - `await req.json().catch(() => ({}))`, then narrow each field with `typeof` + `.trim()`
   - JSON via `Response.json(...)`, not `NextResponse.json(...)` (`NextResponse` is only
     for redirects/cookies, as in the Spotify OAuth routes)
   - a single `try`/`catch` with `console.error`, ordered `instanceof` checks returning
     `{ error: error.message }` and `error.status`, and a generic 500 fallback
5. **Pick accurate status codes**: 400 invalid input, 401 auth, 404 missing, 409 wrong
   state, 502/504 upstream failure or timeout.
6. **Wire up the caller** if the admin UI or a form needs to invoke it, following the
   existing fetch-and-render-`{ error }` pattern.
7. **Verify** with `yarn lint`, `yarn test`, and `yarn build`. Add a sibling `*.test.ts`
   for any pure helper you extract into `src/lib`; do not write tests that require a live
   Supabase, Spotify, or model call.

## Report back

- the new file path and the HTTP method it handles
- request/response shapes and every status code the route can return
- any new env var or SQL change the user must apply by hand
