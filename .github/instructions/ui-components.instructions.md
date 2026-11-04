---
description: "Use when building or restyling React components and pages — server vs client components, Tailwind semantic design tokens, shared UI primitives, forms, and accessibility in src/app."
applyTo: "src/app/**/*.tsx"
---

# Component & Styling Conventions

## Server vs client components

- **Server components are the default.** Add `"use client"` only when a file needs state,
  effects, event handlers, or browser APIs.
- Fetch and prepare data in the server page, then pass it to a client component as props —
  see [src/app/artists/page.tsx](../../src/app/artists/page.tsx) →
  `ArtistsBrowser`, and [src/app/admin/page.tsx](../../src/app/admin/page.tsx) →
  `AdminDashboard`.
- Never import a module that reads `process.env` secrets into a `"use client"` file.
  [src/lib/site.ts](../../src/lib/site.ts) is the client-safe constants module.
- Pages export `metadata`; wrap content in `SiteContainer` for consistent page chrome.

## Where components live

- `src/app/components/ui/` — reusable primitives: `Button`, `Field`, `Tag`,
  `SectionHeading`, `EmptyState`, `ConfirmationPanel`, `ArtistImage`.
- `src/app/components/` — composed site components: `Nav`, `SiteFooter`, `SiteContainer`,
  `SubmissionForm`, `ContactForm`, `ArtistCard`, `TrackCard`.
- Route-specific components live beside their page (e.g. `src/app/admin/AdminDashboard.tsx`).

**Check `components/ui` before writing a new button, form field, tag, or empty state.**
Extend the existing primitive rather than hand-rolling a styled `<button>`.

## Tailwind tokens

Use the semantic tokens from [tailwind.config.ts](../../tailwind.config.ts). Do not write
arbitrary hex values or `[#rrggbb]` classes.

| Purpose | Classes |
| --- | --- |
| Surfaces | `bg-page`, `bg-surface`, `bg-sunken`, `bg-inverse`, `bg-accent-soft` |
| Text | `text-primary`, `text-secondary`, `text-tertiary`, `text-on-inverse`, `text-accent` |
| Accent fills (large areas only, never small text) | `bg-accent-solid`, `hover:bg-accent-hover` |
| Borders | `border-subtle`, `border-strong` |
| Feedback | `text-error`, `text-success`, `ring-focus` |
| Radii | `rounded-field`, `rounded-card`, `rounded-panel` |
| Shadows | `shadow-soft`, `shadow-raised`, `shadow-overlay` |
| Width | `max-w-content` (page), `max-w-measure` (prose) |
| Type | `font-sans` (body), `font-display` (headings) |

`ink`, `paper`, `clay`, and `gold` are **legacy** tokens kept only for the private `/admin`
console. Do not use them in public-facing pages.

Global typography utilities and CSS variables are defined in
[src/app/globals.css](../../src/app/globals.css) — prefer those over re-declaring font
sizes inline.

## Forms and interactivity

- Forms POST to a route handler under `src/app/api/**` and render the returned
  `{ error }` message inline.
- Track submitting/success/error state locally with `useState`; disable the submit control
  while in flight.
- Build inputs from the `Field` primitive so labels, hints, and error text stay consistent.

## Accessibility

- Visible labels on every input; use `aria-live` for async status messages.
- Keep the focus ring — `globals.css` defines focus styling and honors
  `prefers-reduced-motion`. Never add a blanket `outline-none`.
- Accent fills carry low contrast at small sizes: use `text-accent` (`#8f4526`) for text and
  reserve `bg-accent-solid` for large surfaces.
