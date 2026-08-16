# Upper Left Indie — Figma Handoff

**Figma file:** https://www.figma.com/design/OjfLijKC5fD8zwG9DdtYaa
**File name:** Upper Left Indie — UX/UI Audit and Redesign
**Created:** 2026-08-14 · **Audited against:** `main` @ `d1f8db4`
**Companions:** `product-content-ux-audit.md` (findings) · `design-plan.md` (specification)

---

## 1. Page inventory

| Page | Contents |
| --- | --- |
| **00 — Cover & Read Me** | Cover; reading order; evidence conventions (Observed / Inferred / Proposed / Hypothesis); honest limits. |
| **01 — Current Product** | Seven HTML-to-Figma imports of the live local build. **Locked and immutable.** |
| **02 — Audit & Evidence** | Evidence map (capability → source file), product model diagram, accessibility audit with computed contrast, research-gap statement. |
| **03 — Mission, Story & Content** | Mission as found vs proposed, 6 product principles, 7 mission/behaviour contradictions, homepage story sequence, content inventory. |
| **04 — IA & User Flows** | Current vs proposed sitemap, naming table, 5 user flows with alternate/validation/empty/error paths. |
| **05 — Wireframes** | Grey-box structure, 6 frames across desktop and mobile including error and confirmation states. |
| **06 — Visual Direction** | Three direction studies with specimens, strengths, risks; written selection rationale. |
| **07 — Final UI** | Foundations, component library, high-fidelity screens, prototype. |
| **08 — Design Story** | 11-section narrative case study. |

---

## 2. Major frame inventory

### 01 — Current Product (immutable baseline)

All frames locked. Labelled `NN · route — name · viewport · captured date`.

| Frame | Route | Viewport | Height |
| --- | --- | --- | --- |
| `01 · / — Home` | `/` | 1456px | 2140 |
| `02 · / — Home` | `/` | 929px | 2140 |
| `03 · /artists — Artists` | `/artists` | 1456px | 35382 |
| `04 · /archive — Archive` | `/archive` | 929px | 1528 |
| `05 · /submit — Submit` | `/submit` | 929px | 2143 |
| `06 · /support-the-project — Support Project` | `/support-the-project` | 929px | 1264 |
| `07 · /shows — Shows` | `/shows` | 1456px | 803 |

**Not imported, and why:** `/blog` renders only the string "Coming soon." and adds no visual evidence beyond what the audit records. `/contact` duplicates the `/submit` form pattern. `/admin` is private (`robots: noindex`) and out of scope for a public-facing audit. `/support-the-project/success` is captured in the redesign as a state rather than re-imported.

### 07 — Final UI (high-fidelity)

| Frame | Viewport | Journey |
| --- | --- | --- |
| `Home · Desktop 1440` | 1440 | Listener discovery |
| `Home · Tablet 834` | 834 | Listener discovery — materially different layout |
| `Home · Mobile 390` | 390 | Listener discovery |
| `Artists · Desktop 1440` | 1440 | Listener → artist support |
| `Artists · Empty filter result · Desktop` | 1440 | Empty state |
| `Submit · Desktop 1440` | 1440 | Artist submission |
| `Submit · Confirmation · Desktop 1440` | 1440 | Submission success |
| `Submit · Validation error · Mobile 390` | 390 | Submission error |
| `Support the project · Desktop 1440` | 1440 | Project support |

Tablet is drawn only for Home because that is where layout changes materially rather than scaling: the hero stacks, and the track rail moves 3-up → 2-up. Other screens reflow without redrawing.

---

## 3. Variable inventory

### `Color` — 18 semantic variables, 1 mode (Light)

| Variable | Value | Scope | Note |
| --- | --- | --- | --- |
| `bg/page` | `#FFFDF6` | frame/shape fill | **Flat** — replaces the page-length gradient |
| `bg/surface` | `#FFFFFF` | frame/shape fill | |
| `bg/sunken` | `#F3EFE2` | frame/shape fill | |
| `bg/inverse` | `#101014` | frame/shape fill | |
| `bg/accent-soft` | `#F6E7DF` | frame/shape fill | |
| `text/primary` | `#101014` | text fill | 18.65:1 |
| `text/secondary` | `#4C4B4D` | text fill | 8.52:1 |
| `text/tertiary` | `#646363` | text fill | 5.88:1 — **corrected** from `ink/55` @ 4.15:1 |
| `text/on-inverse` | `#FFFDF6` | text fill | 18.65:1 |
| `text/accent` | `#8F4526` | text fill | 6.24:1 — **corrected** from `clay` @ 4.45:1 |
| `border/subtle` | `#DFD9C9` | stroke | Decorative only, never a sole affordance |
| `border/strong` | `#8B8A87` | stroke | 3.09:1 — field borders |
| `border/inverse` | `#101014` | stroke | |
| `accent/solid` | `#B45F3A` | all paints | Large fills only — never small text |
| `accent/hover` | `#8F4526` | all paints | |
| `focus/ring` | `#1D4ED8` | all paints | **New** — no focus token existed |
| `status/error` | `#A02622` | all paints | **New** |
| `status/success` | `#2F5D3A` | all paints | **New** |

`moss` and `night` from the current Tailwind theme are dropped — they are declared but used by no component.

### `Spacing` — 12 variables
`space/1` 4 · `space/2` 8 · `space/3` 12 · `space/4` 16 · `space/5` 20 · `space/6` 24 · `space/8` 32 · `space/10` 40 · `space/12` 48 · `space/16` 64 · `space/20` 80 · `space/24` 96. Scoped to gap and width/height.

### `Radius` — 4 variables
`radius/sm` 6 · `radius/md` 10 · `radius/lg` 16 · `radius/pill` 999. Scoped to corner radius.

### `Layout` — 4 variables × 3 modes

| Variable | Mobile 390 | Tablet 834 | Desktop 1440 |
| --- | --- | --- | --- |
| `layout/gutter` | 16 | 24 | 32 |
| `layout/max-content` | 358 | 786 | 1200 |
| `layout/section-gap` | 48 | 64 | 96 |
| `layout/card-min` | 358 | 381 | 373 |

---

## 4. Styles

### Text styles — 13
`Display/XL` 56/102 · `Display/XL Mobile` 36/105 · `Display/L` 40/105 · `Display/L Mobile` 28/110 · `Heading/M` 24/120 · `Heading/S` 18/130 · `Body/L` 18/160 · `Body/M` 16/160 · `Body/M Medium` 16/160 · `Body/S` 14/155 · `Label/M` 12/130 +0.12em upper · `Label/S` 11/130 +0.10em upper · `Button/M` 14/120 +0.06em upper.

**Fonts:** Archivo Narrow (display) and Public Sans (text). Both open-source, so implementable. **The current product loads no webfont at all** (`globals.css:24` — `Arial, Helvetica, sans-serif`), so this is a net payload addition requiring a performance budget. If the budget cannot absorb it, Direction B degrades to a system stack and the display/text contrast must be carried by weight and scale alone.

### Effect styles — 2
`Elevation/Raised` (cards) · `Elevation/Overlay` (drawer, modals).

---

## 5. Component inventory

| Component | Variants | Documented states |
| --- | --- | --- |
| **Button** | 18 — Emphasis (Primary/Secondary/Quiet) × State | default, hover, pressed, focus, disabled, loading |
| **Text Field** | 6 — State | default, hover, focus, filled, error, disabled |
| **Tag** | 6 — Selected × State | default, hover, focus |
| **Consent Checkbox** | 3 — State | unchecked, checked, focus |
| **Track Row** | 3 — State | default, hover, focus |
| **Artist Image** | 3 — Media (Photo/Artwork/Initials) | default |
| **Artist Card** | 6 — Media (image/initials) × State | default, hover, focus |
| **Support Tier Card** | 6 — Kind (artist/project) × State | default, hover, loading |
| **Header** | 2 — Breakpoint (desktop/mobile) | default |
| **Empty State** | 1 | default |
| **Confirmation Panel** | 1 | default |

**Variant-axis decision.** Button is Emphasis × State, not Emphasis × Size × State. Size is handled by padding and text-style overrides. A three-axis set would produce 54 variants — unmaintainable for a single operator, and the size difference is not a semantic distinction.

**Fixed-geometry media slots.** `Artist Image` exists specifically so the media slot cannot collapse. All three variants are a fixed 1:1 **72×72** with `radius/sm`, centre alignment and `clipsContent` — so swapping to the Initials fallback never shifts card content. The header `Logo mark` is likewise a fixed **36×36** square with `radius/md`. Neither may use hug-content horizontal sizing: an earlier revision did, producing 16×36 and 28×72 vertical pills. Enforced geometry, for regression checking:

| Element | Size | Sizing | Radius |
| --- | --- | --- | --- |
| `Logo mark` (11 instances) | 36×36 | FIXED / FIXED | `radius/md` (10) |
| `Artist Image` (12 instances) | 72×72 | FIXED / FIXED | `radius/sm` (6) |

**Promotion rule.** A pattern became a shared component only where reuse is demonstrated in the existing codebase or required by the screen inventory. The primary button class string is repeated in at least nine places; the artist card renders 82 times; release rows render 106+ times. Page wrappers, the hero and one-off editorial layouts were deliberately **not** componentised.

Every component carries a `description` explaining what it is for and which audit finding it addresses.

---

## 6. Prototype

**Page:** 07 — Final UI. Four named flow starting points:

| Flow | Starts at | Covers |
| --- | --- | --- |
| 1 · Listener discovery | `Home · Desktop 1440` | Home → Artists → filter to empty state → clear filters → Artists |
| 2 · Artist submission | `Submit · Desktop 1440` | Submit → confirmation (smart animate) → submit again |
| 3 · Project support | `Support the project · Desktop 1440` | Support → artist ask → Artists |
| 4 · Mobile | `Home · Mobile 390` | Mobile discovery → submission validation error |

Header navigation (Listen / Artists / Submit music / logo) is wired on all six desktop screens — 20 hotspots — so the prototype can be explored non-linearly rather than only along scripted paths.

---

## 7. Known limitations

1. **No mobile current-state baseline.** The browser automation surface used for the HTML import is pinned to a fixed rendering width; `window.innerWidth` stayed at 1456 regardless of window resizing. Current mobile behaviour was assessed from source instead — breakpoints, container widths and layout classes — and is documented in the audit at §7.5. The two baseline widths that were captured (1456 and 929) still give a real responsive pair.
2. **Spotify iframes render empty in the baseline.** Cross-origin iframe content cannot be serialised by the capture. The grey box in the imported homepage *is* the embed. This is faithful to what the site owns, and is itself part of the finding.
3. **Artwork in the high-fidelity comps is illustrative.** Images are real hashes sampled from the captured `/artists` page, but are not always matched to the artist named beside them. Do not read the comps as real editorial pairings.
4. **The transparency figures on the support screen are placeholders** and are labelled as such in the design itself. Real amounts must come from the operator before that panel ships.
5. **Copy in the comps is proposed, not approved.** All body copy is a design recommendation and needs the operator's voice check — particularly the first-person curator lines, which assert things about a real person.
6. **The track→artist join has a real gap.** It draws on the `submissions` table, so it covers tracks that arrived through the form — **not** operator-added tracks that never passed through it. Unresolved; see audit §12.
7. **No production code was modified.** The Figma capture script was temporarily added to `layout.tsx` for the import and removed immediately afterwards; `git status` is clean apart from these documentation files.

---

## 8. Items requiring validation before build

| Item | Why it is not settled |
| --- | --- |
| Whether listeners want a directory at all | They may simply follow the playlist in Spotify. Instrument outbound clicks before building `/artists/[slug]`. |
| The Spotify-only submission rule | Deliberate quality filter, or implementation convenience? Determines whether the Bandcamp fallback is correct. |
| The tip model | Nothing establishes why anyone tips or whether $3–$20 one-time is the right shape. |
| Geographic boundary | Rule or centre of gravity? The directory already contains non-Northwest artists. |
| Whether `/blog` is still intended | It holds a nav slot and promises content in its metadata. |
| Whether placement is ever paid or traded | The answer belongs on `/about` either way. |
| Real operator identity and voice | The curator strip asserts a person exists and has a stance. That person must approve it. |

---

## 9. Mapping to the Fender Sr. UI/UX Web Designer rubric

| Role expectation | Where it is evidenced |
| --- | --- |
| Translate business goals and user needs into user-centred design | Mission and audiences reconstructed from repository evidence (audit §3, §5), converted into six testable principles (design plan §1), each traceable to a finding. |
| Information architecture, user flows, wireframes, structured problem solving | Page 04 (current vs proposed sitemap, naming table, five flows with alternate/validation/empty/error paths); page 05 (responsive wireframes before any styling). |
| Evolve and scale responsive design systems | Page 07 foundations: 18 semantic colour variables, 12 spacing steps, 4 radii, 4 layout variables across 3 modes, 13 text styles, 2 elevation styles; 10 components with documented states and a stated variant-axis rationale. |
| Product discovery, listing, detail and merchandising modules | Discovery = Home recent-adds rail; listing = Artists browse with region/genre/recency filters and an empty state; detail = Artist Card → Bandcamp; "merchandising" reinterpreted honestly as *artist* revenue on Bandcamp rather than project revenue (audit §8.4). |
| Brand storytelling and elevation | Page 03 (story sequence, contradictions); page 06 (three deliberate directions with a written selection); the curator strip that gives the project a protagonist it did not have. |
| Present work clearly and persuasively to stakeholders | Page 08 — an 11-section narrative with before/after, explicit trade-offs, and a section devoted to what remains unproven. |
| Balance large initiatives with iterative optimisation | Now / Next / Later / Not-recommended, ranked on mission alignment, user value, product clarity, accessibility, effort and evidence strength — with portfolio value deliberately excluded as a ranking input (audit §11). |
| Accessibility and Baymard-informed commerce practice | Contrast computed for every token including across the background gradient; focus, live-region, semantic and consent findings; 14 acceptance criteria each mapped to a finding. Commerce practice applied as: never disable a whole option grid on one selection, keep errors adjacent to their control, explain format requirements, and recap consent at confirmation. |
| Comfort with ambiguity; self-direction in a lean environment | No brief, no analytics, no stakeholders. Scope, evidence standard and priorities were all self-defined, and the boundary of what could not be known was stated rather than filled in. |
| Passion for music and consumer/lifestyle products | The central recommendation is to route money to musicians on Bandcamp rather than capture it — including an explicit recommendation *against* building the commerce layer that would have been the more impressive portfolio artefact. |

---

## 10. What was deliberately not done

- **No production code was redesigned or implemented.** Out of scope by instruction.
- **No streaming platform, in-house player, artist CMS, merch or ticketing commerce** — argued against in audit §8.4 on both mission and resourcing grounds.
- **No `/blog`, `/contact` or `/admin` redesign.** Blog is a stub, contact duplicates submit, admin is private and single-operator.
- **No multiple full redesigns.** One direction was selected and carried through, per brief.
- **No fabricated research.** Every audience statement is labelled as a hypothesis, and §13 of the audit lists exactly what would be needed to resolve each one.
