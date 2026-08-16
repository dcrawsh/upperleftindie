# Upper Left Indie — Design Plan

**Companion to:** `product-content-ux-audit.md`
**Date:** 2026-08-14 · **Repository state:** `main` @ `d1f8db4`
**Figma file:** Upper Left Indie — UX/UI Audit and Redesign — https://www.figma.com/design/OjfLijKC5fD8zwG9DdtYaa

This plan converts the audit's findings into a design specification. It does not change production code; see `figma-handoff.md` for the delivery mapping.

---

## 1. Design principles

Each principle is traceable to audit evidence and is testable — a design either satisfies it or does not.

### P1 — Never show a song without a way to reach the artist
Every surface that presents a track also presents the artist's name, city, and a route to their own channel.

**From:** Audit §7.3, §M1. The homepage asks visitors to "support the artists you hear here" while the only listening surface is an opaque iframe.
**Test:** From any track shown on the site, an artist destination is reachable in one click.

### P2 — A pick without a reason is just a link
Selections carry human context: why it was chosen, when it was added, who chose it.

**From:** Audit §4.4, §5.1. Nothing in the product distinguishes curated selection from an algorithmic list.
**Test:** The homepage shows at least one piece of first-person curator reasoning above the fold on every viewport.

### P3 — Point outward; do not rebuild
Spotify plays the audio. Bandcamp takes the money. The artist owns the relationship. The site is connective tissue.

**From:** Audit §8.4, §3.3. Also a resourcing constraint — one operator, one shared-secret admin console (§5.5).
**Test:** No design introduces an in-house player, catalogue, store, or artist CMS.

### P4 — The artist ask and the project ask are never the same ask
They differ in wording, placement, and visual weight. The artist ask always outranks the project ask.

**From:** Audit §7.2 (five colliding uses of "support"/"playlist"), §6.4 (two near-identical homepage cards).
**Test:** No two support CTAs share a visual weight class on the same screen; no nav label points a music word at a payment page.

### P5 — Legible before atmospheric
No gradient, texture, or type treatment ships if it costs a contrast threshold or a focus indicator.

**From:** Audit §9. The current background gradient makes contrast position-dependent; focus rings are globally removed.
**Test:** Every text/background pair ≥4.5:1 (≥3:1 for ≥24px); every interactive element has a ≥3:1 non-colour-only focus indicator.

### P6 — Show the region, don't just say it
Place is carried by content — cities, venues, scenes — not only by palette and a landscape illustration.

**From:** Audit §4.2. 80 of 82 artists have a `location`; a Portland venue table exists. Neither is used for browsing.
**Test:** A visitor can browse by region without reading marketing copy.

---

## 2. Selected visual direction

Three directions were explored on Figma page **06 — Visual Direction**. Full mood tiles, specimens, strengths and risks are on that page; summarised here.

| | **A — Field Guide** | **B — Show Flyer** *(selected)* | **C — Liner Notes** |
| --- | --- | --- | --- |
| Premise | Regional reference book | Print ephemera of a live scene | Album-insert editorial |
| Type | Humanist serif + grotesque | Condensed grotesque display + neutral text | Book serif at long measure |
| Colour | Moss/paper naturalist | Ink on paper + one hot accent | Warm neutral + muted spot |
| Image | Documentary, uniform | Artist artwork at full strength, high contrast | Photography-led, generous margins |
| Rhythm | Even, catalogue-like | Dense header, open body, strong rules | Slow, long-form |
| Risk | Reads institutional; understates energy | Can tip into faux-grunge if undisciplined | Too quiet for discovery; heavy content demand |

### Why B — "Show Flyer"

1. **It matches the product's actual metabolism.** The active playlist rotates and songs age into an archive (`archive/page.tsx:75-79`). A flyer aesthetic is inherently *dated and current* — it suits a thing that changes weekly. A field guide implies permanence the product does not have.
2. **It subordinates itself to artist artwork.** Principle P1 and P3 require album art and artist images to be the visual payload. B's ink-on-paper structure with a single accent frames artwork rather than competing with it. C's photographic richness competes; A's uniform treatment flattens it.
3. **It carries place without cliché.** Northwest show flyers are a real regional artefact — stapled to poles outside the venues already listed in `show-sources.json`. This satisfies P6 without evergreens, rain, or Space Needle imagery.
4. **It supports the CTA hierarchy P4 needs.** A strong display/text contrast gives four distinct emphasis levels (display, primary, secondary, quiet) so the artist ask can visibly outrank the project ask.
5. **It is honest about scale.** One person makes this. Flyer design is a medium of limited means — that is the truth of the project, not a costume.

### Discipline applied to B's stated risk

The audit and brief both warn against faux-grunge. Constraints adopted:

- **No** distressed textures, torn edges, photocopy noise, tape, or staple graphics.
- **No** rotated or overlapping text.
- Density comes from **structure** — rules, tight display leading, strong alignment — not from decoration.
- Body text is a neutral, highly legible face at generous line-height; only display type is condensed.
- Every colour pairing is contrast-verified before use (P5).

The reference is a *well-printed* flyer, not a degraded one.

---

## 3. Screen inventory

| # | Screen | Viewports | Figma page | Journey |
| --- | --- | --- | --- | --- |
| 1 | Home / discovery | 1440 · 834 · 390 | 05 wires, 07 hi-fi | Listener |
| 2 | Artists — browse | 1440 · 390 | 05, 07 | Listener → artist support |
| 3 | Artist detail | 1440 · 390 | 05, 07 | Listener → artist support |
| 4 | Archive | 1440 · 390 | 05, 07 | Returning visitor |
| 5 | Submit — form | 1440 · 390 | 05, 07 | Artist |
| 6 | Submit — validation error | 390 | 05, 07 | Artist (alternate) |
| 7 | Submit — confirmation | 1440 · 390 | 05, 07 | Artist (success) |
| 8 | Support the project | 1440 · 834 · 390 | 05, 07 | Supporter |
| 9 | Support — success | 1440 | 07 | Supporter (success) |
| 10 | Shows | 390 | 05, 07 | Listener (regional) |
| 11 | Artists — empty filter result | 390 | 07 | Listener (empty) |

Screens 3 and 10 are included because repository evidence supports them: `artists.generated.ts` already carries bio, location, image, links and releases per artist (audit §2.4), and `/shows` is a functioning dynamic route (§2.1). Screen 11 exists because `ArtistsBrowser.tsx:426-468` has **no** zero-result branch (§7.4).

**Tablet (834)** is drawn only for Home and Support — the two screens whose layout changes materially rather than scaling: Home's recent-adds rail moves 3-up → 2-up and the hero relayouts; Support's tier grid moves 4-up → 2-up. Other screens simply reflow.

---

## 4. Responsive behaviour

### 4.1 Breakpoints

| Token | Width | Rationale |
| --- | --- | --- |
| `sm` | 640 | Retained from Tailwind defaults; already used correctly. |
| `md` | 768 | **No longer the nav switch** — audit §7.5 found the desktop nav crowds between 768–900. |
| `lg` | 1024 | **New nav switch point.** |
| `xl` | 1280 | Max content width engages. |

### 4.2 Layout

| Viewport | Grid | Gutter | Max content |
| --- | --- | --- | --- |
| 390 | 4 col | 16 | fluid |
| 834 | 8 col | 24 | fluid |
| 1440 | 12 col | 32 | 1200 |

Measure is capped at ~68ch for body copy at all sizes (audit §9.4 — currently uncontrolled).

### 4.3 Component behaviour

| Component | 390 | 834 | 1440 |
| --- | --- | --- | --- |
| Header | Logo + menu button; drawer as a true dialog | Logo + condensed nav | Full nav + CTA |
| Hero | Stacked; artwork capped 320 | Stacked, wider | Two-column: artwork + now-playing |
| Recent adds | 1-up stacked | 2-up | 3-up rail |
| Playlist embed | Full width, 352 tall | 380 | 380, in-column |
| Artist card | Full width, stacked | 2-up | 3-up |
| Artist filters | Horizontal scroll chips | Wrapped chips | Wrapped chips + count |
| Tier card | 1-up | 2-up | 4-up |
| Submit form | 1 col, grouped sections | 1 col, wider | 2 col within sections |
| Footer | Stacked | 2 col | 3 col |

### 4.4 Cross-cutting rules

- Touch targets ≥44×44 at every viewport (the current build already does this well — preserve it).
- Horizontal scroll containers (`overflow-x-auto`) keep visible edge affordance and are keyboard-scrollable.
- The mobile drawer uses `100dvh`, not `h-screen` (audit §7.5).
- Spotify embeds get viewport-appropriate heights rather than one fixed height (§7.5).
- Nothing is disabled purely because a sibling is loading (fixes `SupportOptions.tsx:74`, §7.4).

---

## 5. Component inventory

Built on Figma page **07 — Final UI** as components with variants, auto layout, constraints, and variable bindings. Promotion rule: a pattern becomes a shared component only where reuse is demonstrated in the existing codebase or required by the screen inventory above.

| Component | Variants | States documented | Reuse evidence |
| --- | --- | --- | --- |
| Button | emphasis: primary / secondary / quiet · size: lg / md / sm | default, hover, pressed, focus, disabled, loading | Same class string repeated ≥9× (audit §2.6) |
| Link — inline | default / visited | default, hover, focus | `page.tsx:57`, `submit/page.tsx:44`, `support-the-project/page.tsx:42` |
| Header | desktop / mobile-closed / mobile-open | default, scrolled, focus-within | `Nav.tsx` |
| Footer | desktop / mobile | default | `layout.tsx:97-120` |
| Track row (recent add) | with-artwork / without | default, hover, focus | New — implements P1/§X1 |
| Artist card | grid / list · with-image / initials-fallback | default, hover, focus | `ArtistsBrowser.tsx:126-251`, 82 instances |
| Release row | album / track | default, hover, focus | `ArtistsBrowser.tsx:228-247`, 106+ instances |
| Tag / chip | genre / region · selected / unselected | default, hover, pressed, focus | `ArtistsBrowser.tsx:162-194`, 351-415 |
| Show card | — | default, hover, focus | `shows/page.tsx:165-196` |
| Support tier card | artist / project | default, hover, focus, loading, disabled | `SupportOptions.tsx:57-81` |
| Text field | text / email / url | default, hover, focus, filled, error, disabled | 12 fields across 2 forms |
| Select | — | default, focus, error, placeholder | `SubmissionForm.tsx` region + genre |
| Textarea | — | default, focus, error | 2 instances |
| Checkbox + consent block | consent / newsletter | default, checked, focus, error | `SubmissionForm.tsx:503-540` |
| Helper / validation text | helper / error / success | — | `SubmissionForm.tsx:456`, `:466` |
| Newsletter signup | footer / inline | default, submitting, success, already-subscribed, error | `FooterSubscribe.tsx` — 4 real states exist |
| Empty state | no-results / not-configured | default | `shows/page.tsx:152-163`; **missing** on `/artists` |
| Confirmation panel | submission / support | default | Replaces `SubmissionForm.tsx:553` |
| Section header | with-eyebrow / without | default | Every page uses this pattern |

**Deliberately not componentised:** page wrappers, one-off editorial layouts, and the hero — single-use, and premature abstraction would obscure intent.

---

## 6. Design tokens

Semantic variables in Figma, mapped from the existing Tailwind theme so the system stays implementable. Values that fail contrast are corrected, and the correction is recorded.

### 6.1 Colour — semantic layer

| Variable | Value | Note |
| --- | --- | --- |
| `bg/page` | `#FFFDF6` | From `paper`. **Flat** — replaces the page-length gradient (audit §9.1). |
| `bg/surface` | `#FFFFFF` | Cards, fields |
| `bg/inverse` | `#101014` | From `ink` |
| `text/primary` | `#101014` | 18.65:1 |
| `text/secondary` | `#4C4B4D` | was `ink/70` — 8.52:1 |
| `text/tertiary` | `#646363` | **was `ink/55` @ 4.15:1 → now 5.88:1** |
| `text/on-inverse` | `#FFFDF6` | 18.65:1 |
| `text/accent` | `#8F4526` | **was `clay #b45f3a` @ 4.45:1 → now ≥5.5:1** |
| `border/subtle` | `rgba(16,16,20,0.12)` | Non-text; decorative only |
| `border/strong` | `rgba(16,16,20,0.35)` | Field borders — ≥3:1 |
| `accent/solid` | `#B45F3A` | `clay` retained for **large** fills only, never small text |
| `focus/ring` | `#1D4ED8` | New. ≥3:1 on both page and inverse |
| `status/error` | `#A02622` | ≥4.5:1 on surface |
| `status/success` | `#2F5D3A` | ≥4.5:1 on surface |

`moss` and `night` are dropped — unused in every component (audit §2.6).

### 6.2 Type

Display: a condensed grotesque. Text: a neutral sans. **The current product loads no webfont at all** (`globals.css:24`, audit §9.4), so this is a net addition and must ship with a performance budget (§8).

| Style | Size / line-height | Use |
| --- | --- | --- |
| Display/XL | 56/1.02 (mobile 36/1.05) | Page headline |
| Display/L | 40/1.05 (mobile 28/1.1) | Section headline |
| Heading/M | 24/1.2 | Card titles |
| Heading/S | 18/1.3 | Sub-sections |
| Body/L | 18/1.6 | Lead paragraphs |
| Body/M | 16/1.6 | Default |
| Body/S | 14/1.55 | Helper, meta |
| Label | 12/1.3, +0.12em, uppercase | Eyebrows, tags |

Eyebrow tracking is reduced from the current `0.26em` — at 12px that is near the upper bound of comfortable reading.

### 6.3 Spacing, radius, elevation

4px base scale: `space/1` 4 → `space/12` 96.
Radius: `sm` 6 · `md` 10 · `pill` 999. Elevation: `raised` (cards), `overlay` (drawer). One shadow token exists today; two is the ceiling.

---

## 7. Accessibility requirements

Non-negotiable acceptance criteria. Each maps to an audit finding.

| # | Requirement | Audit ref |
| --- | --- | --- |
| A1 | All text ≥4.5:1 (≥3:1 at ≥24px or ≥19px bold), verified against the **flat** page background. | §9.1 |
| A2 | Page background is flat. Any gradient is decorative only and never sits behind body text. | §9.1 |
| A3 | Every interactive element has a visible `:focus-visible` indicator ≥3:1 against adjacent colours, ≥2px, never colour-only. | §9.2 |
| A4 | Exactly one `<h1>` per page, and it is the **visible** page headline. | §9.3 |
| A5 | All async form results announced via `aria-live="polite"`; errors via `role="alert"`. | §9.3 |
| A6 | Field errors linked by `aria-describedby` + `aria-invalid`. | §9.3 |
| A7 | Mobile drawer is `role="dialog"` + `aria-modal`, focus-trapped, Escape-closable, background `inert`, and **not focusable when closed**. | §9.3 |
| A8 | All motion respects `prefers-reduced-motion`, including `scroll-behavior`. | §9.4 |
| A9 | Skip-to-content link as the first focusable element. | §9.4 |
| A10 | Touch targets ≥44×44. | §9.4 (already met — preserve) |
| A11 | Newsletter consent is opt-**in** (unchecked) everywhere. | §6.5 |
| A12 | Body measure ≤68ch. | §9.4 |
| A13 | Iframes titled; icons `aria-hidden`; icon-only controls labelled. | §9.3 (already met — preserve) |
| A14 | Loading states announced, not conveyed by disabling alone. | §7.4 |

---

## 8. Implementation sequence

Mirrors audit §11. Design deliverables exist for every NOW and NEXT item.

**Phase 1 — Clarity and access (NOW).** N1–N10. Nav rename and restructure, `/archive` + `/shows` promoted, `/archive` added to `sitemap.ts`, focus rings restored, contrast corrections, `<h1>` fix, live regions, newsletter opt-in, Alaska added, reduced-motion guards, Blog removed from nav. Mostly copy, tokens, and attributes — no new data plumbing.

**Phase 2 — The join (NEXT).** X1 first: expose recent adds from `submissions` (`spotify_track_id`, `active_playlist_added_at`, `bandcamp_link`) as attributed, linkable cards. This is the highest-value change in the plan and requires no new data model (audit §7.3). Then `/about`, `/artists` filtering + empty state, submission form segmentation + confirmation state, genre unification, data hygiene, drawer dialog semantics, shared primitives.

**Phase 3 — Depth (LATER).** L1–L6, each gated on evidence: artist detail pages only if Phase 2 instrumentation shows listeners reaching `/artists`; editorial only with a sustainable cadence; impact reporting only if the operator will commit to it.

**Instrumentation note.** No analytics exist (audit §13). Phase 1 should add minimal event tracking — outbound Bandcamp clicks, playlist plays, submission starts/completions, tier selection — otherwise Phase 3 gating stays guesswork.

---

## 9. Acceptance criteria

### Global
- [ ] Every screen meets A1–A14.
- [ ] Every component ships default, hover, pressed, focus, disabled, loading, error, success where applicable.
- [ ] All colour, spacing, and radius values bind to variables — no raw hex or magic numbers in final frames.
- [ ] Every frame uses auto layout with correct fill/hug and constraints.

### Home
- [ ] States what Upper Left Indie is, in a real `<h1>`, above the fold at 390.
- [ ] Shows what is currently worth hearing, with **named, linked** artists — not only an embed (P1).
- [ ] Shows at least one curator reason above the fold (P2).
- [ ] Offers listen, support-artist, submit, and support-project — at **four distinguishable** emphasis levels (P4).
- [ ] Explains the active↔archive relationship, with a link to `/archive`.

### Artists
- [ ] Filterable by region and genre; sortable by recently added.
- [ ] Empty state for a zero-result filter (currently absent).
- [ ] Every card reaches the artist's own channel in one click (P1).
- [ ] No `"... more"` truncation artefacts.

### Submit
- [ ] Fields grouped into Artist / Music / Permissions.
- [ ] Eligibility states the region rule and matches the selector, Alaska included.
- [ ] Inline validation explains *why* a link format is required.
- [ ] Newsletter unchecked by default (A11).
- [ ] Success is a distinct confirmation state with timeline and consent recap — not a paragraph under the button.
- [ ] Partial-failure messages are in artist-facing language, not internal vocabulary.

### Support
- [ ] Artist support and project support are visually and verbally distinct on every screen where both appear (P4).
- [ ] No tier name duplicates the page title or a nav label.
- [ ] Selecting one tier does not disable the others.
- [ ] Errors appear adjacent to the pressed control.
- [ ] The success page states what the money does next.

### Prototype
- [ ] Listener discovery, artist submission, and project support are each clickable end-to-end.
- [ ] At least one validation/error path and one empty state are reachable.

---

## 10. Constraints and honest limitations

1. **No user research exists.** Everything about user motivation is hypothesis (audit §5, §13). This plan optimises for clarity against stated intent — not for validated behaviour.
2. **No analytics.** Priority ordering uses mission alignment and evidence strength, not measured impact.
3. **One operator.** Nothing here assumes staffing that does not exist. This is why editorial is deferred and multi-curator features are rejected.
4. **The Spotify embed is opaque and stays that way.** The track→artist join (X1) draws on the `submissions` table, so it covers tracks that arrived through submissions — **not** operator-added tracks that never passed through the form. That gap is real and unresolved; see open question §12.4 in the audit.
5. **A webfont is a net addition.** The product currently loads none. If the performance budget cannot absorb it, Direction B degrades to a system-font stack, and the display/text contrast must then be carried by weight and scale alone.
6. **Nothing here has been implemented.** No production code was modified. These are design specifications only.
