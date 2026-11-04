---
description: "Use when creating or modifying Next.js App Router route handlers under src/app/api, including admin-authenticated endpoints, request validation, error responses, and Supabase- or Spotify-backed API work."
applyTo: "src/app/api/**/*.ts"
---

# API Route Handler Conventions

Reference implementations:
[src/app/api/submissions/route.ts](../../src/app/api/submissions/route.ts) (public),
[src/app/api/admin/submissions/[id]/reply/route.ts](../../src/app/api/admin/submissions/%5Bid%5D/reply/route.ts) (admin + dynamic params).

## Required shape

```ts
import { NextRequest } from "next/server";
import { AdminAuthError, assertAdminRequest } from "@/lib/admin-auth";
import { getSubmission, SupabaseRequestError } from "@/lib/submissions";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    assertAdminRequest(req);

    const { id } = await context.params;
    const body = (await req.json().catch(() => ({}))) as { field?: unknown };
    const field = typeof body.field === "string" ? body.field.trim() : "";

    if (!field) {
      return Response.json({ error: "Field is required." }, { status: 400 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("descriptive context", error);

    if (error instanceof AdminAuthError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof SupabaseRequestError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    return Response.json({ error: "Operation failed." }, { status: 500 });
  }
}
```

## Rules

- **Always** `export const runtime = "nodejs";`. These handlers read server secrets.
- **Params are a Promise** under Next 15: type as `Promise<{ id: string }>` and `await` it.
- **Import with the `@/` alias**, which maps to `./src/*` — `@/lib/submissions`,
  `@/lib/admin-auth`. It resolves identically from any route depth, so never write
  `../../../../../../lib/...`. Reserve relative imports for same-directory files.
- **Admin routes call `assertAdminRequest(req)` first, inside the `try`.** Everything under
  `src/app/api/admin/**` is protected; it throws `AdminAuthError` (401, or 500 when
  `ADMIN_API_TOKEN`/`ADMIN_PASSWORD` is unset).
- **Parse defensively**: `await req.json().catch(() => ({}))`, cast to a shape of `unknown`
  fields, then narrow each field with `typeof` checks and `.trim()`. Do not add a schema
  validation library.
- **Return JSON with `Response.json(...)`**, not `NextResponse.json(...)`. `NextResponse` is
  used only where redirects or cookies are required — see the Spotify OAuth routes in
  [src/app/api/spotify/](../../src/app/api/spotify/).
- **Errors**: one `try`/`catch` wrapping the handler, `console.error` with context, then
  ordered `instanceof` checks against the `src/lib` error classes, each returning
  `{ error: error.message }` with `error.status`. End with a generic 500 that does not leak
  internal details.
- **Error messages are user-facing.** They surface in the admin UI, so write them as
  complete, actionable sentences ("Add the track to the playlist before drafting a reply.").
- **Business logic belongs in `src/lib`.** Route handlers orchestrate: authenticate,
  validate, call helpers, shape the response. Supabase access goes through
  `@/lib/supabase`; LLM calls go through `@/lib/ai`.
- Choose status codes deliberately: 400 invalid input, 401 auth, 404 missing resource,
  409 wrong state for the operation, 502/504 upstream failure or timeout.
- **Never log or return secrets**, raw upstream error bodies containing credentials, or
  full submission notes.
