# Upper Left Indie — Product, Content & UX Audit

**Audit date:** 2026-08-14
**Repository state:** `main` @ `d1f8db4`
**Method:** Static reading of the repository plus a local run (`yarn dev`, Next.js 15.1.11) of every user-facing route. No live-site traffic, analytics, interviews, or user research were used or fabricated.

**Evidence conventions used throughout this document:**

| Label | Meaning |
| --- | --- |
| **[O]** Observed | Directly verifiable in the repository or the local build. Cited to a file and line. |
| **[I]** Inferred | A reasonable reading of observed evidence. Could be wrong; the reasoning is shown. |
| **[P]** Proposed | A design recommendation. Not a finding. |
| **[H]** Hypothesis | An assumption about people that this repository cannot confirm. Requires real research. |

---

## 1. Executive summary

Upper Left Indie is a one-person Pacific Northwest music curation project. It runs an active Spotify playlist, an archive playlist, a free artist submission pipeline, a 82-artist Bandcamp directory built by an automated scraper, a scraped Portland show calendar, a Stripe tip jar, and a MailerLite newsletter — with a private admin console for triaging submissions directly into the Spotify playlist. **[O]**

The product is substantially more capable than its interface admits. The central problem is not missing features; it is that **the navigation, naming, and page hierarchy do not describe the product that has been built.**

Five findings drive the redesign:

1. **The two most listener-valuable routes are effectively hidden.** `/shows` appears in no navigation anywhere — header, footer, or body — and is reachable only by typing the URL or finding it in `sitemap.xml`. `/archive` appears in the footer and in three body paragraphs but never in the header nav, and is missing from `sitemap.ts` entirely. **[O]** §7.1
2. **"Support" is overloaded to the point of collision.** The header offers "Support **Artists** / **Playlist**", where "Playlist" leads to a payment page. The tip jar then sells a "$5 Support the Playlist" tier *and* a "$20 Support the Project" tier on a page titled "Support the Project". A visitor cannot reliably predict where any of these lead. **[O]** §7.2
3. **Discovery dead-ends at the embed.** The homepage's primary content is an opaque Spotify iframe. A listener who hears a song they love inside it has no path to that artist's page, Bandcamp, or merch — the `/artists` directory is a separate alphabetical list with no relationship to what is playing. This directly undercuts the site's own stated ask: "Support the artists you hear here." **[O]** §7.3
4. **Curation is asserted but never shown.** Every page says the artists are under-heard and hand-picked; no page ever says *who* curates, *why* a track was chosen, or *when* it was added. The single first-person sentence in the entire product is on `/submit`. **[O]** §5
5. **Accessibility has systemic, measurable defects.** Focus rings are removed globally on form fields and replaced with a border-colour change; the homepage `<h1>` is `sr-only` while the visible headline is a `<p>`; the submission form's success/error message has no live region; and several body-text tokens fall below WCAG AA — worsened by a page-length background gradient that makes contrast position-dependent. **[O]** §9

The recommended direction keeps the product's actual shape — it stays a curation project that points outward to Spotify, Bandcamp, and artists' own channels — and fixes the layer above it: navigation, naming, the link between a song and its artist, and the visible presence of a human curator.

**This audit recommends against building a streaming platform, an in-house player, or an artist CMS.** §8.4

---

## 2. Evidence map

Every capability mapped to its source.

### 2.1 Routes

| Route | Source | Rendering | In header nav? | In footer? | In `sitemap.ts`? |
| --- | --- | --- | --- | --- | --- |
| `/` | `src/app/page.tsx` | Static | Logo only | — | Yes |
| `/artists` | `src/app/artists/page.tsx`, `artists/ArtistsBrowser.tsx` | Static from generated data | Yes ("Artists") | — | Yes |
| `/archive` | `src/app/archive/page.tsx` | Static | **No** | Yes | **No** |
| `/shows` | `src/app/shows/page.tsx` | `force-dynamic`, Supabase REST | **No** | **No** | Yes |
| `/submit` | `src/app/submit/page.tsx`, `components/SubmissionForm.tsx` | Static + client form | Yes | — | Yes |
| `/support-the-project` | `support-the-project/page.tsx`, `SupportOptions.tsx`, `supportData.ts` | Static + client | Yes ("Playlist") | Yes | Yes |
| `/support-the-project/success` | `support-the-project/success/page.tsx` | Static | — | — | No |
| `/blog` | `src/app/blog/page.tsx` | Static stub — "Coming soon." | Yes | — | Yes |
| `/contact` | `src/app/contact/page.tsx`, `components/ContactForm.tsx` | Static + client form | Yes | — | Yes |
| `/admin` | `src/app/admin/page.tsx`, `admin/AdminDashboard.tsx` (1,263 lines) | Client, `robots: noindex` | — | — | No |

Legacy redirects `/support` → `/support-the-project` and `/support/success` → `/support-the-project/success` are permanent (`next.config.ts:13-26`). **[O]**

### 2.2 API routes

| Endpoint | Source | Purpose | External dependency |
| --- | --- | --- | --- |
| `POST /api/submissions` | `api/submissions/route.ts` | Persist a submission | Supabase (`SUPABASE_SERVICE_ROLE_KEY`) |
| `POST /api/sendEmail` | `api/sendEmail/route.ts` | Notify the operator | Nodemailer SMTP |
| `POST /api/newsletter/subscribe` | `api/newsletter/subscribe/route.ts` | Newsletter opt-in | MailerLite Connect API |
| `POST /api/bandcamp/queue` | `api/bandcamp/queue/route.ts` | Append artist to the directory source list | GitHub Contents API (commits to `main`) |
| `POST /api/support/checkout` | `api/support/checkout/route.ts` | Create a tip checkout | Stripe Checkout (raw `fetch`, no SDK) |
| `GET /api/spotify/auth`, `/callback` | `api/spotify/*` | One-time operator OAuth to mint a refresh token | Spotify Accounts |
| `/api/admin/submissions/*` | 5 routes | List, read, update, reply, add-to-playlist | Supabase + Spotify + SMTP |
| `/api/admin/playlist/*` | 6 routes | active, archive, archived, preview, reorder, unarchive | Spotify Web API |

All admin routes are guarded by `assertAdminRequest` (`src/lib/admin-auth.ts`), a shared-secret comparison against `ADMIN_API_TOKEN`/`ADMIN_PASSWORD` sent via `x-admin-token` or a bearer header. **[O]**

### 2.3 Data model

| Store | Definition | Contents |
| --- | --- | --- |
| `public.submissions` | `supabase/submissions.sql` | 24 columns. Status enum `pending \| added \| rejected \| archived`; Spotify track id/uri; `active_playlist_added_at`, `archived_at`, `replied_at`, `reply_subject`, `admin_notes`. RLS enabled. |
| `public.bandcamp_sources` | `supabase/bandcamp-sources.sql` | Artist directory source of truth. Status `active \| hidden \| failed`, `genre`, `last_scraped_at`, `last_error`. Seeded from `bandcamp-sources-import.sql` (61 rows, `source = 'legacy-json'`). |
| `public.shows` | `supabase/shows.sql` | Scraped events. Public read policy. Indexed on `starts_at`, `venue_name`, `artist_name`, `genre`. |
| `src/data/artists.generated.ts` | Generated by `scripts/update-bandcamp-artists.mjs` | **82 artists**, 1,258+ lines, committed to the repo. |
| `src/data/bandcamp-urls.json` | Hand/queue-appended | Legacy URL list, still read by the queue endpoint. |
| `src/data/show-sources.json` | Hand-maintained | Portland venue calendar sources. |

### 2.4 Generated artist data — measured completeness

Computed directly from `src/data/artists.generated.ts` at `d1f8db4`:

| Field | Coverage |
| --- | --- |
| Total artists | 82 |
| `bio` present | 76 / 82 |
| `location` present | 80 / 82 |
| `image` present | 80 / 82 |
| `tags` non-empty | 81 / 82 |
| `releases` non-empty | 77 / 82 |
| **Bios ending in the literal string `"... more"`** | **21 / 76** |

Distinct `location` values include `"Washington"`, `"Seattle"`, `"Seattle, Washington"`, `"Bozeman, montana"` (lower-case), `"San Francisco, California"`, and `"Puerto Vallarta, Mexico"`. **[O]**

### 2.5 Automation

- `.github/workflows/update-bandcamp-artists.yml` — daily at 10:00 UTC plus on push; runs the scraper, builds, and commits `artists.generated.ts` back to `main`.
- `.github/workflows/scrape-portland-shows.yml` — populates `public.shows`.
- `docs/shows-scraper.md` — the only pre-existing design/product documentation in the repository. **[O]**

### 2.6 Design system as it exists today

| Layer | Where | State |
| --- | --- | --- |
| Colour | `tailwind.config.ts:11-18` | Six tokens: `ink #101014`, `paper #fffdf6`, `moss #52634a`, `clay #b45f3a`, `gold #d8a648`, `night #1d2430`. **`moss` and `night` are never used in any component.** |
| Elevation | `tailwind.config.ts:19-21` | One shadow: `soft`. |
| Type | `src/app/globals.css:24` | `font-family: Arial, Helvetica, sans-serif` — **no webfont is loaded anywhere in the project.** |
| Background | `globals.css:21-23` | A fixed radial + 135° linear gradient from `#fffdf6` → `#f3efe2` → `#e5dac4`. |
| Layout | `components/SiteContainer.tsx` | Three widths: `site` (72rem), `medium` (56rem), `narrow` (48rem). |
| Breakpoints | Tailwind defaults | `sm` 640 / `md` 768 / `lg` 1024. `md` is the nav's mobile↔desktop switch. |

There are no component primitives. Buttons, cards, inputs, and tags are re-declared inline as Tailwind class strings at every call site. The primary button string `rounded-full bg-ink px-6 py-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-paper transition hover:bg-clay` (or a near-variant) is repeated in at least nine places. **[O]**

---

## 3. Mission

### 3.1 What the repository says

The mission is stated almost identically in four places: **[O]**

- `layout.tsx:9-10` (meta description) — "a Northwest music curation project supporting local underserved and under-heard independent artists."
- `page.tsx:19-22` (the homepage's largest visible text) — "A local Northwest music curator supporting underserved and under-heard independent artists."
- `manifest.ts:7-8` — the same sentence again.
- `archive/page.tsx:85-88` — the geographic scope: "Oregon, Washington, Idaho, Alaska, British Columbia, and the wider Northwest orbit."

### 3.2 Values expressed explicitly **[O]**

| Value | Evidence |
| --- | --- |
| Under-heard artists come first | The mission sentence, repeated in four files |
| Submissions stay free | `supportData.ts:30-33`; repeated on `/submit`, `/blog`, `/support-the-project` |
| Independence | "independently run and community supported" — 4 occurrences |
| Buying beats streaming | `page.tsx:80-83` — "Listening helps. Buying a download, record, tape, shirt… helps even more." |
| Freshness is a duty to artists | `archive/page.tsx:75-79` — the active playlist is rotated so the "front door" stays open |

### 3.3 Values implied by product behaviour **[I]**

- **Artists are treated as people to be asked, not data to be harvested.** Featuring an artist requires an explicit opt-in checkbox plus a Bandcamp URL (`SubmissionForm.tsx`, `artistPageConsent`), and the API refuses to queue anything that is not a `*.bandcamp.com` host (`api/bandcamp/queue/route.ts:31-51`). That is a deliberate ethical choice, not an accident.
- **The operator refuses to be a gatekeeper who ghosts people.** The submissions table carries `replied_at` and `reply_subject`, and there is a dedicated `/api/admin/submissions/[id]/reply` endpoint. Someone built a replying tool for themselves.
- **Money is deliberately de-emphasised.** Every monetary CTA in the product is a low-emphasis outlined button; the highest-emphasis buttons are "Submit Music" and "Listen". No page pressures a visitor to pay.

### 3.4 Is the mission immediately understandable?

**Partly. [I]** The sentence is the largest text on the homepage and reads clearly. But it describes a *person* ("a local Northwest music curator") while the surrounding interface never introduces that person. A first-time visitor learns the category but not the identity, and the site offers no answer to "why should I trust these picks?"

### 3.5 Who is the experience actually built for?

**Currently: the submitting artist. [I]** The evidence:

- The one persistent header CTA on every page and viewport is "Send a Track" (`Nav.tsx:90-95`, `184-189`).
- `/submit` is the only page with a first-person voice — "**I** listen through submissions" (`submit/page.tsx:36-38`).
- The submissions pipeline is the only journey with a database, an admin console, a reply tool, and email notification.
- The listener's journey terminates at a third-party iframe with no follow-on.

This contradicts the mission sentence, which is written from the *listener's* point of view — it promises the visitor a curator, and then hands them a submission form.

### 3.6 Proposed mission statement **[P]**

> Upper Left Indie finds independent musicians across the Pacific Northwest who deserve more ears, puts them in front of listeners with a reason attached, and sends those listeners to the places where supporting the artist actually counts.

Grounded in: the four repeated mission strings (§3.1), the Bandcamp-first support model (`page.tsx:66-91`), and the rotation policy (`archive/page.tsx:75-79`).

### 3.7 Proposed product principles **[P]**

1. **Never show a song without a way to reach the artist.** Every track surface carries a route to that artist's own channels. Directly addresses §7.3.
2. **A pick is worthless without a reason.** Human context accompanies selections. Addresses §5.2.
3. **Point outward; do not rebuild.** Spotify plays the audio, Bandcamp takes the money, the artist owns the relationship. Addresses §8.4.
4. **The artist ask and the project ask are never the same ask.** They differ in wording, placement, and visual weight. Addresses §7.2.
5. **Legible before atmospheric.** No gradient, texture, or type treatment ships if it costs a contrast threshold. Addresses §9.

### 3.8 Mission / behaviour contradictions **[O] unless noted**

| # | Contradiction | Evidence |
| --- | --- | --- |
| M1 | "Support the artists you hear here" — but you cannot get from a song you hear to that artist. | `page.tsx:77` vs. the iframe at `page.tsx:40-49` and the unrelated `/artists` list |
| M2 | Mission names "Northwest"; the directory ships San Francisco, Bozeman, and Puerto Vallarta artists. | §2.4 |
| M3 | Submit's region selector offers only OR / WA / ID / BC / Other — omitting Alaska, which prose names three times. | `SubmissionForm.tsx:38-44` vs. `submit/page.tsx:32-33` |
| M4 | The archive is presented as central to the model but is absent from the nav and from `sitemap.ts`. | §2.1 |
| M5 | A "local Northwest music curator" is claimed, but the curator is never named or shown. | §5.2 |
| M6 | `/shows` — real, dynamic, listener-facing — is reachable from nowhere. | §2.1 |
| M7 | "Blog" holds a permanent top-level nav slot while rendering "Coming soon." | `blog/page.tsx:26-31` |

---

## 4. Brand story

### 4.1 The story currently told **[I]**

Assembled from every string in the product, the narrative is: *a Northwest playlist exists; you may submit to it; please support the artists on it; please also tip the person running it.* It is a **service description**, not a story. It has no protagonist, no origin, no point of view, and no stakes.

### 4.2 The role of the Pacific Northwest

Place is carried almost entirely by **naming and one image**. "Upper Left" is a regional idiom; `public/Upperleftindie.png` is a painted alpine-lake-and-wildflowers scene with hand-lettered type; the palette (`moss`, `clay`, `gold`, `paper`) reads as Northwest-ish. **[O]**

But place is never carried by **content**. The product knows the city of nearly every artist (80/82 have `location`) and holds a table of Portland venues — and displays neither as a way to browse. Region is an input on the submission form and a filter on nothing. **[I]**

### 4.3 Discovery / curation / independence / support

These four ideas are each stated, but the *connections* between them are missing. **[I]** The archive page comes closest to real narrative reasoning — "the active playlist works best when it keeps room for new submissions… moving older adds keeps that front door open" (`archive/page.tsx:75-79`). That is the single strongest piece of writing in the product: it explains a mechanism, justifies it in terms of fairness to artists, and gives the archive a purpose. It sits on the one page with no navigation entry.

### 4.4 Do visitors know who runs this, and why trust the curation?

**No. [O]** Searched across all user-facing routes: no person's name, no photo, no "about", no history, no track record, no statement of taste, no disclosure of whether placement can be bought. The strongest trust signal available — "I listen through submissions and add tracks that fit the playlist. Because of volume, I may not be able to respond to every submission" (`submit/page.tsx:36-38`) — is honest, specific, and human, and it is shown only to artists.

### 4.5 Does the story differentiate from a generic playlist / blog / submission portal?

**Not yet. [I]** Strip the logo and the copy would fit any regional playlist. The genuinely differentiating assets already exist in the repository and are unused as story: the rotation-and-archive ethic, the consent-gated artist directory, the Bandcamp-first support stance, the show calendar, and the operator's own voice.

### 4.6 Proposed story sequence **[P]**

**Homepage:**
1. **Who and where** — one line naming the project, the region, and the person.
2. **What's on right now** — the active playlist, with recent adds broken out as individual, attributed tracks.
3. **Why these** — curator context on at least the top picks.
4. **Who made it** — artist, city, and a direct route to their Bandcamp.
5. **How to help the artist** — the primary support ask.
6. **What else is here** — archive, artists, shows.
7. **Two smaller asks, clearly distinct** — submit music; support the project.

**Supporting pages:** `/about` (new, §8.3) carries origin and taste; `/archive` inherits the rotation ethic as its lead; `/artists` becomes region-and-genre browsable; `/shows` earns a nav slot.

---

## 5. Audiences and jobs to be done

> **Research status.** These are structured hypotheses derived from repository evidence — data models, form fields, consent flags, and copy. **No interviews, analytics, session data, or surveys exist in this repository.** Every "goal", "question", and "friction" below is labelled **[H]** where it asserts something about a real person's intent. §13 lists what would need to be validated.

### 5.1 Listener

- **Repository support for this audience:** the Spotify embeds, `/artists`, `/archive`, `/shows`, the footer newsletter (`role: "listener"`, `FooterSubscribe.tsx:26-27`).
- **Primary goal [H]:** find music worth their time that they would not have found on an algorithmic feed.
- **Arrives asking [H]:** What is this? Who picked it? Is it any good? Is it near me? What do I do if I like something?
- **Desired actions [O-supported]:** play; save the playlist; open an artist's Bandcamp; subscribe.
- **Necessary content:** current picks; curator reasoning; artist identity and place; a support route.
- **Friction [O]:** the iframe is a dead end (§7.3); `/artists` is 82 undifferentiated cards; `/archive` and `/shows` are unreachable from the nav.
- **Trust requirement [H]:** evidence that a person with taste chose these, and that placement is not for sale.
- **Success state:** left the site having played something *and* reached the artist's own channel.
- **Unsupported assumption [H]:** that listeners want a browsable directory at all rather than simply following the playlist in Spotify.

### 5.2 Artist / submitter

- **Repository support:** `/submit`, the 12-field form, the `submissions` table, the admin reply tool, the artist newsletter group.
- **Primary goal [H]:** get heard by a curator, and get a real answer.
- **Arrives asking [H]:** Am I eligible? Does it cost anything? What do you need? Will I hear back? What happens if you take it?
- **Necessary content [O — partially present]:** eligibility (present, but contradicted, §M3); cost (present); required links (present); response expectations (present, `submit/page.tsx:36-38`); consent scope (present, `SubmissionForm.tsx:509-517`); **what happens after acceptance (absent)**.
- **Friction [O]:** 12 fields in one unsegmented column; Spotify-track-only validation with no explanation of *why*; success is a paragraph appended below the button rather than a state change; the newsletter box is **pre-checked** (`SubmissionForm.tsx:30`).
- **Trust requirement [H]:** that submitting is not a marketing funnel and their data will not be misused.
- **Success state:** submitted with confidence, knows the timeline, knows what consent they gave.
- **Unsupported assumption [H]:** that artists have a Spotify track at all. The form **requires** one, structurally excluding Bandcamp-only artists — precisely the most under-heard cohort the mission names.

### 5.3 Artist supporter (listener converting to buyer)

- **Repository support:** `/artists` cards link to Bandcamp and up to 106+ releases; the homepage Bandcamp panel.
- **Primary goal [H]:** put money directly to a musician they just discovered.
- **Friction [O]:** there is no path from *hearing* to *buying* (§M1); truncated `"... more"` bios (21 cases) damage credibility at exactly the moment of decision; no price, format, or release-recency signal appears anywhere.
- **Success state:** landed on the artist's Bandcamp from the song that prompted it.

### 5.4 Project supporter

- **Repository support:** `/support-the-project`, four Stripe tiers, the success page.
- **Friction [O]:** naming collisions (§7.2); the tiers state what the money *enables* but the project never states what it has *done*; no recurring option; no transparency on amounts raised or spent.
- **Trust requirement [H]:** that the project is real, active, and that the money changes something.
- **Unsupported assumption [H]:** that a $3–$20 one-time tip model suits this audience at all.

### 5.5 Curator / operator

- **Repository support:** `/admin` (1,263 lines), 11 admin API routes, Spotify OAuth, the reply tool, two scheduled scrapers.
- **Primary goal [I — strongly evidenced]:** process submissions quickly, move accepted tracks into the playlist, rotate old ones to the archive, and reply to people.
- **Observed constraint [O]:** the entire back office is protected by a single shared secret compared in application code (`admin-auth.ts:24`). Adequate for one operator; it is the reason this audit does not propose multi-curator features.
- **Friction [I]:** the operator's work — the actual product — is invisible to the public. Nothing they do in `/admin` produces a visible artefact of curation on the site.

---

## 6. Content inventory

Disposition: **Keep · Clarify · Move · Merge · Expand · Create · Remove**

### 6.1 Mission and identity

| Content | Where | Disposition | Reasoning |
| --- | --- | --- | --- |
| "A local Northwest music curator supporting underserved and under-heard independent artists." | `page.tsx:19-22` | **Keep + Clarify** | Strong and repeated. But it is a `<p>` while the `<h1>` is `sr-only` (§9). Promote to a real heading; name the region concretely. |
| Mission string duplicated in 4 files | §3.1 | **Merge** | Single source of truth; drift risk today. |
| Operator identity | — | **Create** | The single largest trust gap (§4.4). |
| "Pacific Northwest artists, heard closer." | `layout.tsx:101` | **Keep + Move** | The best line in the product. Wasted in the footer. |

### 6.2 Discovery

| Content | Where | Disposition | Reasoning |
| --- | --- | --- | --- |
| Active playlist iframe | `page.tsx:40-49` | **Keep + Expand** | Keep the embed (rights and playback stay with Spotify) but surround it with attributed, linkable recent adds. Fixes §7.3. |
| Archive↔active explainer | `page.tsx:51-63` | **Keep + Move** | Good content, buried under the embed. |
| "Artists from the playlist." + 82 cards | `artists/page.tsx`, `ArtistsBrowser.tsx` | **Keep + Expand** | Needs region filtering (data exists), recency, and a real card/detail split. |
| A–Z / Genre toggle | `ArtistsBrowser.tsx:318-345` | **Clarify** | Alphabet is a filing metaphor, not a discovery one. Region and recency are more useful and already in the data. |
| Genre labels | `ArtistsBrowser.tsx:67-81` | **Merge** | Three competing sources: `submittedGenre`, scraped `tags`, then regex inference over the bio, falling back to "Uncategorized". One taxonomy — the 29-value `genreOptions` list already in `SubmissionForm.tsx:51-80`. |
| Scraped bios | `artists.generated.ts` | **Clarify** | 21 of 76 end in `"... more"`. Truncate cleanly or link out. |
| `location` values | `artists.generated.ts` | **Clarify** | Normalise casing and granularity (§2.4); then use as a region filter. |
| "Bandcamp profile queued for metadata." | `ArtistsBrowser.tsx:156` | **Remove** | Internal pipeline language shown to the public. |
| Show calendar | `shows/page.tsx` | **Keep + Move** | Real, dynamic, regional, listener-valuable — and unreachable. Give it a nav slot. |
| Shows disclaimer | `shows/page.tsx:117-120` | **Keep** | Honest and correct for scraped data. |

### 6.3 Archive

| Content | Where | Disposition | Reasoning |
| --- | --- | --- | --- |
| "A longer shelf for Northwest songs." | `archive/page.tsx:33-35` | **Keep** | Best headline in the product. |
| "Why songs move" / "What stays here" | `archive/page.tsx:73-89` | **Keep + Move** | The clearest articulation of the project's ethic. Should inform the homepage (§4.3). |
| Archive nav entry | — | **Create** | Absent from header and `sitemap.ts`. |

### 6.4 Artist support vs. project support

| Content | Where | Disposition | Reasoning |
| --- | --- | --- | --- |
| "Support the artists you hear here" panel | `page.tsx:66-91` | **Keep + Expand** | Right message; currently cannot be acted on from what is playing. |
| "Listening helps. Buying… helps even more." | `page.tsx:80-83` | **Keep** | Specific, warm, on-brand. |
| Project-support panel | `page.tsx:94-113` | **Clarify** | Nearly identical card treatment to the artist panel two inches above. Must be visually subordinate. |
| Nav label "Support Artists / Playlist" | `Nav.tsx:43-64` | **Remove** | "Playlist" pointing at a payment page is the single most misleading label in the product. |
| Tier "Support the Playlist" $5 | `supportData.ts:23-27` | **Clarify** | Collides with the nav label and the page title. |
| Tier "Support the Project" $20 | `supportData.ts:35-41` | **Clarify** | Same name as the page it lives on. |
| "keep submissions free" | 4 locations | **Merge** | Strong rationale, diluted by repetition. |
| Impact evidence | — | **Create** | Tiers promise outcomes; nothing reports any. |

### 6.5 Submission

| Content | Where | Disposition | Reasoning |
| --- | --- | --- | --- |
| "Send music from the upper left." | `submit/page.tsx:28-30` | **Keep** | Excellent. |
| Geographic scope prose | `submit/page.tsx:32-33` | **Clarify** | Names Alaska; the region `<select>` omits it (§M3). |
| "I listen through submissions…" | `submit/page.tsx:36-38` | **Keep + Move** | The most trust-building sentence in the product; shown only to artists. |
| 12-field single-column form | `SubmissionForm.tsx` | **Clarify** | Group into Artist / Music / Permissions. |
| Spotify-track-only requirement | `SubmissionForm.tsx:37-40` | **Clarify** | Structurally excludes Bandcamp-only artists (§5.2). At minimum explain why; ideally accept a Bandcamp fallback. |
| Error "Please enter a Spotify song link, like…" | `SubmissionForm.tsx:41-42` | **Keep** | Shows the expected format — good practice. |
| Consent checkbox + scope | `SubmissionForm.tsx:503-517` | **Keep** | Genuinely good consent design. |
| Newsletter checkbox **pre-checked** | `SubmissionForm.tsx:30` | **Clarify** | Opt-out, not opt-in. Contradicts the consent care shown directly above it. |
| Success paragraph + playlist nudge | `SubmissionForm.tsx:553-565` | **Move + Expand** | Should be a confirmation *state*, not text under a button. |
| Degraded-path messages ("Admin queue save could not be completed.") | `SubmissionForm.tsx` | **Clarify** | Internal vocabulary surfaced to artists. |
| What happens after acceptance | — | **Create** | Named as a gap in §5.2. |

### 6.6 Newsletter, editorial, contact

| Content | Where | Disposition | Reasoning |
| --- | --- | --- | --- |
| "Join the Upper Left Indie list" + value prop | `FooterSubscribe.tsx:53-60` | **Keep** | Concrete about what arrives. |
| "No spam. Unsubscribe anytime." | `FooterSubscribe.tsx:82` | **Keep + Clarify** | Correct promise; `text-ink/50` fails AA (§9). |
| "You're already on the list." | `FooterSubscribe.tsx:39-42` | **Keep** | Thoughtful state handling. |
| Blog: "Coming soon." | `blog/page.tsx:26-31` | **Remove (from nav)** | A top-level nav slot that leads nowhere. Restore when there is a post. |
| Contact page | `contact/page.tsx` | **Keep + Merge** | Overlaps `/submit` in purpose; fold into one "get in touch" surface with a reason selector. |

---

## 7. Current product model and UX findings

### 7.0 The model as built **[O]**

```
Submission (Supabase) ──admin──> Active Spotify playlist ──rotation──> Archive playlist
      │                                    │                                │
      │ consent + Bandcamp URL             │ (embed on /)                   │ (embed on /archive)
      ▼                                    ▼                                ▼
bandcamp_sources ──daily scraper──> artists.generated.ts ──> /artists   [no link back to tracks]

shows (scraped) ──> /shows [orphaned]        Stripe tiers ──> /support-the-project
MailerLite: listener group | artist group
```

The pipeline from submission to playlist to archive to artist directory is genuinely well built. **The breaks are all in the presentation layer.**

### 7.1 Orphaned and under-linked routes **[O]**

- `/shows`: zero inbound links anywhere in the application. Present in `sitemap.ts`, so search engines can reach it but visitors cannot.
- `/archive`: three body links (`page.tsx:55`, `submit/page.tsx:42`, `support-the-project/page.tsx:40`) and one footer link — but no header nav entry, and **missing from `sitemap.ts`**, so it is neither browsable nor properly indexable.
- `/support-the-project/success` is correctly excluded from the sitemap.

The inverse errors — shows indexed but unnavigable, archive navigable but unindexed — suggest nav and sitemap have drifted independently. **[I]**

### 7.2 Naming collisions around "support" **[O]**

Five distinct things compete for the same words:

| Surface | Label | Destination |
| --- | --- | --- |
| Header | "Support **Artists**" | `/artists` (directory) |
| Header | "Support **Playlist**" | `/support-the-project` (**payment**) |
| Page title | "Support the Project" | `/support-the-project` |
| Tier ($5) | "Support the **Playlist**" | Stripe |
| Tier ($20) | "Support the **Project**" | Stripe |

"Playlist" in the header means *give money*; "Playlist" everywhere else means *the music*. **[I]** This is the highest-confidence, lowest-effort fix in the audit.

### 7.3 Discovery dead-ends at the embed **[O]**

The homepage's core content is a third-party iframe (`page.tsx:40-49`). Everything inside it — track names, artist names, artwork — is inaccessible to the site. The site therefore cannot:

- name the artists currently featured,
- link a track to that artist's `/artists` entry or Bandcamp,
- show when a track was added,
- explain why it was chosen.

`/artists` is generated from `bandcamp_sources`, which has no relationship to playlist membership. So the "Support Artists" directory and the playlist are two disconnected sets. **[O]** Yet the `submissions` table already stores `spotify_track_id`, `spotify_track_uri`, `bandcamp_link`, `active_playlist_added_at`, and `archived_at` — **the join needed to fix this already exists in the data model** and is simply not exposed to the public site. **[O]** This is the single highest-value opportunity in the audit.

### 7.4 Form and state findings **[O]**

- **Submission form** — 12 fields, one column, no grouping or progress; success and failure both render as an unstyled `<p>` (`:553`); partial-failure messages leak internal vocabulary; newsletter pre-checked; no client-side required-field summary.
- **Support checkout** — every tier button disables when *any* tier is loading (`SupportOptions.tsx:74`), so the whole grid greys out; errors render below the grid, far from the pressed button.
- **Contact form** — duplicates the submission pattern with a different newsletter default (`false` vs `true`).
- **Empty states** — `/shows` has two good ones (unconfigured / no upcoming shows, `shows/page.tsx:152-163`). `/artists` has **no** empty state for a filter that matches nothing. Confirmed by reading `ArtistsBrowser.tsx:426-468`: all three render branches map over arrays with no zero-length guard.
- **Loading states** — none anywhere except button label swaps ("Sending…", "Opening…", "Joining").

### 7.5 Responsive findings **[O]**

- Single breakpoint (`md`, 768px) drives the nav switch; between 768 and ~900px the desktop nav crowds badly — `Nav.tsx:42` compensates with `gap-4 … lg:gap-6` and `text-xs … lg:text-sm`, evidence the layout is already under pressure at `md`.
- The mobile drawer is `w-72` fixed and `h-screen` (`Nav.tsx:117-121`); `h-screen` is unreliable with mobile browser chrome.
- Spotify embeds are fixed-height (380px home, 520px archive) at every viewport.
- `/artists` cards go one-column below `lg` — 82 cards single-file on mobile with no pagination, virtualisation, or jump-to-letter affordance once scrolled.
- `/shows` venue filters use `overflow-x-auto` on mobile — good.
- The hero image is `max-w-xl` (576px) inside a `max-w-3xl` column, so on a 1440px desktop the entire above-the-fold is a centred 576px square. **[I]** Considerable desktop space does no work.

### 7.6 Capabilities suggested but not implemented **[O]**

| Suggested by | Not implemented |
| --- | --- |
| "Blog" nav item + `/blog` metadata "Notes, interviews, and discoveries" | Any editorial content |
| "Helps fund artist features, merch experiments, photography, writing" (`supportData.ts:39`) | Artist features, merch, photography, writing |
| "Expand our playlists to Tidal, Apple Music, YouTube" (`supportData.ts:33`) | Any non-Spotify playlist |
| `src/lib/apple-preview.ts` (131 lines, functional) | Any public use — admin preview only |
| `genre` on `shows` + `artist_name` indexed | Any genre or artist filtering on `/shows` |
| Newsletter `role` field (`listener` / `artist`) | Any differentiated messaging |

### 7.7 Redundancies **[O]**

- Two forms (`SubmissionForm`, `ContactForm`) with near-identical field, status, and submit patterns and no shared primitives.
- Two artist-source stores: `bandcamp_sources` (Supabase) and `src/data/bandcamp-urls.json` — the queue endpoint still writes the JSON file via the GitHub API.
- Four near-identical "independently run and community supported / keep submissions free" paragraphs.
- Two unused colour tokens (`moss`, `night`).

---

## 8. Information architecture

### 8.1 Current sitemap **[O]**

```
/  (logo only — no "Home" nav item)
├── Support Artists ......... /artists
├── Support Playlist ........ /support-the-project      ← label says music, page takes money
├── Submit .................. /submit
├── Blog .................... /blog                     ← "Coming soon."
├── Contact ................. /contact
├── [footer only] ........... /archive                  ← not in sitemap.ts
├── [unreachable] ........... /shows                    ← in sitemap.ts, linked nowhere
└── [private] ............... /admin
```

### 8.2 Problems this IA creates **[I]**

1. Two of the four listener-facing surfaces are not in the nav.
2. The only nav grouping ("Support") mixes a free browsing destination with a payment destination.
3. Editorial holds a slot it does not earn.
4. There is no route to "who is this and why trust them".
5. Nothing in the nav says **"listen"** — the primary action for the primary audience.

### 8.3 Proposed sitemap **[P]**

```
/                        Home — what's on now, why, and who made it
├── Listen               ← NEW top-level grouping
│   ├── /                  Active playlist + recent adds, attributed
│   └── /archive           Past selections            (promoted from footer)
├── Artists              /artists — browse by region, genre, recency
│   └── /artists/[slug]    Artist detail              (new; §8.5)
├── Shows                /shows                       (promoted from orphan)
├── About                /about                       (new — curator, ethic, trust)
└── Submit               /submit

Footer: Support the project · Newsletter · Contact · Instagram · Archive
Removed from nav: Blog (restore when a post exists)
Renamed: "Support Playlist" → "Support the project" (footer, not header)
```

Five top-level items, each mapping to a distinct job. The money ask moves out of the primary nav into the footer and into contextual placements — consistent with the project's own de-emphasis of money (§3.3).

### 8.4 What should stay external — explicitly **[P]**

Do **not** build: an in-house audio player, a music catalogue, a store or checkout for artist merch, an artist-managed profile CMS, or a ticketing integration.

Reasoning: playback rights and the recommendation surface belong to Spotify; artist revenue belongs on Bandcamp, where the artist controls pricing and keeps the relationship; the operator is one person with a shared-secret admin console (§5.5). The mission is to *send people onward*, not to intermediate. What should be built is the **connective tissue** — the join described in §7.3 — which the data model already supports.

### 8.5 Naming recommendations **[P]**

| Current | Proposed | Why |
| --- | --- | --- |
| "Support Artists" (nav) | "Artists" | The page is a directory; support is the action *on* it. |
| "Support Playlist" (nav) | Remove from header → "Support the project" (footer) | Removes the §7.2 collision. |
| Tier "Support the Playlist" $5 | "Keep the playlist running" | Distinguishes from the $20 tier. |
| Tier "Support the Project" $20 | "Fund the next feature" | Matches its own description. |
| "Featured Artists" (eyebrow) | "Artists we've played" | States the relationship to the playlist. |
| "Tip jar" (eyebrow) | "Support the project" | Aligns eyebrow, title, and nav. |

---

## 9. Accessibility findings

All measured or read directly from source. **[O]**

### 9.1 Contrast — computed, WCAG 2.1 AA

Foreground `ink #101014` composited at Tailwind opacity over the background. The body background is a **gradient** (`globals.css:21-23`), so the same token yields different ratios at different scroll positions.

| Token | On `#fffdf6` (top) | On `#e5dac4` (bottom) | AA normal (4.5:1) |
| --- | --- | --- | --- |
| `text-ink/70` | 7.07:1 | — | Pass |
| `text-ink/65` | 5.88:1 | 5.17:1 | Pass |
| `text-ink/60` | 4.93:1 | **4.44:1** | **Passes at top, fails at bottom** |
| `text-ink/55` | **4.15:1** | **3.82:1** | **Fail** |
| `text-ink/50` | **3.53:1** | **3.29:1** | **Fail** |
| `text-ink/45` | **3.05:1** | — | **Fail** |
| `text-ink/40` (placeholders) | **2.63:1** | — | **Fail** |
| `clay #b45f3a` on background | **4.45:1** | **3.27:1** | **Fail** |
| `paper` on `clay` (nav CTA) | **4.45:1** | — | **Fail** |
| `paper` on `ink` (primary button) | 18.65:1 | — | Pass |

Failing usages include: footer links `text-ink/55` (`layout.tsx:104`, `:113`); consent helper text `text-ink/55` (`SubmissionForm.tsx:515`, `:534`; `ContactForm.tsx:189`); show metadata `text-ink/55` (`shows/page.tsx:176`); "No spam. Unsubscribe anytime." `text-ink/50` (`FooterSubscribe.tsx:82`); release type/date `text-ink/50` (`ArtistsBrowser.tsx:245`); the Bandcamp-required hint `text-ink/45` (`SubmissionForm.tsx:456`); placeholder `text-ink/40` (`FooterSubscribe.tsx:67`); **every `clay` eyebrow label** on `/submit`, `/artists`, `/archive`, `/support-the-project`, `/blog`, `/contact`, `/shows`; and the persistent **"Send a Track"** header CTA (`Nav.tsx:92`).

**The lowest-contrast text in the product is the consent and privacy language** — the content with the strongest ethical claim on being readable.

### 9.2 Focus visibility **[O]**

Every text input, select, and textarea uses `outline-none … focus:border-clay` (`SubmissionForm.tsx`, `ContactForm.tsx`, `FooterSubscribe.tsx:67`, `AdminDashboard.tsx`). This **removes the browser focus ring** and replaces it with a 1px border-colour change measuring 4.45:1 against white — below the 3:1 required by WCAG 2.1 SC 1.4.11 for non-text contrast, and a colour-only signal (SC 1.4.1).

`grep -rn 'focus-visible\|focus:ring' src` returns **zero matches**. Buttons and links have no focus styling at all beyond the UA default, which the reset does not restore.

### 9.3 Semantics and structure **[O]**

- **Homepage heading inversion** — `<h1 className="sr-only">Upper Left Indie</h1>` (`page.tsx:18`) while the visible headline is a `<p>` (`:19-22`). Visual and semantic hierarchies disagree on the most important page.
- **No live region on the submission form** — status renders as a bare `<p>` (`SubmissionForm.tsx:553`). `ContactForm.tsx:205` and `FooterSubscribe.tsx:84` both use `aria-live="polite"`. The highest-stakes form is the one that does not announce.
- **Field-level errors are not associated** — `songLinkError` renders in a `<span>` (`SubmissionForm.tsx:466-468`) with no `aria-describedby`, no `aria-invalid`, and no programmatic link to the input.
- **Mobile drawer is not a dialog** — `Nav.tsx:117-191`: no `role="dialog"`, no `aria-modal`, no focus trap, no Escape handler, no `inert`/`aria-hidden` on background content. When closed it remains in the DOM and focusable, translated off-screen — keyboard users can tab into an invisible menu. `grep -rn 'role=' src` returns zero matches.
- **Icon-only controls** — the Instagram links carry `aria-label` (good, `Nav.tsx:85`); `react-icons` output is marked `aria-hidden` consistently (good).
- **Genre/letter filters** use `aria-pressed` on `<button>` (good, `ArtistsBrowser.tsx:170`).
- **Iframes are titled** (good, `page.tsx:48`, `archive/page.tsx:68`).

### 9.4 Motion and other **[O]**

- `html { scroll-behavior: smooth }` (`globals.css:14-16`) with **no `prefers-reduced-motion` guard**. `grep` for `prefers-reduced-motion`: zero matches. Transitions and the 300ms drawer slide are likewise unguarded.
- **No skip link.**
- **No webfont** — `Arial, Helvetica, sans-serif` (`globals.css:24`), so rendering differs materially across platforms; the design has no typographic control.
- **Touch targets** are handled well — `min-h-11` (44px) is used deliberately on filters and links in `ArtistsBrowser.tsx` and `Nav.tsx`.
- `lang="en"` is set (`layout.tsx:88`). Images have `alt` text.

---

## 10. Key user flows

Detailed flows including alternate, validation, empty, and error paths are specified in `design-plan.md` and drawn on Figma page **04 — IA & User Flows**. Summary of the current-state break in each:

| # | Flow | Current-state break **[O]** |
| --- | --- | --- |
| 1 | Listener → hears a track → understands why → reaches artist support | **Severed at the embed.** No route from a playing track to any artist surface (§7.3). |
| 2 | Artist → checks eligibility → submits → gets confirmation | Eligibility contradicts itself (Alaska, §M3); Spotify-only requirement excludes Bandcamp-only artists; confirmation is a paragraph, not a state. |
| 3 | Supporter → understands impact → distinguishes artist vs project → chooses → knows what's next | Naming collisions (§7.2); no impact evidence; whole tier grid disables on any click. |
| 4 | Returning visitor → finds what's new or archived | No "recently added" anywhere; `/archive` not in nav; `/artists` has no recency sort. |
| 5 | Subscriber → understands value → consents | Footer signup is genuinely good; the submission-form checkbox is **pre-checked** (opt-out). |

---

## 11. Prioritised recommendations

Ranked on mission alignment, user value, product clarity, brand value, accessibility, effort, and evidence strength. Portfolio value was **not** used as a ranking input.

### NOW — high value, strong evidence, low-to-moderate effort

| # | Recommendation | Evidence | Effort |
| --- | --- | --- | --- |
| N1 | Resolve the "support" naming collision; remove "Playlist" from the header. | §7.2 | XS |
| N2 | Put `/archive` and `/shows` in the nav; add `/archive` to `sitemap.ts`. | §7.1 | XS |
| N3 | Restore focus rings; add `:focus-visible` with a ≥3:1 indicator. | §9.2 | S |
| N4 | Raise failing text tokens to `ink/65`+; fix `clay` on background and the nav CTA. | §9.1 | S |
| N5 | Fix the homepage heading inversion. | §9.3 | XS |
| N6 | Add `aria-live` + `aria-describedby`/`aria-invalid` to the submission form. | §9.3 | S |
| N7 | Un-check the newsletter box on the submission form. | §5.2, §6.5 | XS |
| N8 | Add Alaska to the region selector. | §M3 | XS |
| N9 | Guard `scroll-behavior` and transitions with `prefers-reduced-motion`. | §9.4 | XS |
| N10 | Remove "Blog" from the nav until a post exists. | §M7 | XS |

### NEXT — high value, moderate effort

| # | Recommendation | Evidence |
| --- | --- | --- |
| X1 | **Build the track→artist join.** Surface recent adds from `submissions` (`spotify_track_id`, `active_playlist_added_at`, `bandcamp_link`) as attributed cards beside the embed. | §7.3 |
| X2 | Add `/about` with the curator, the rotation ethic, and a no-pay-for-play statement. | §4.4 |
| X3 | Rebuild `/artists` with region + genre + recency filters and a proper empty state. | §6.2, §7.4 |
| X4 | Segment the submission form and give it a real confirmation state. | §5.2 |
| X5 | Unify genre taxonomy on the existing 29-value list. | §6.2 |
| X6 | Clean the `"... more"` bio truncation and normalise `location`. | §2.4 |
| X7 | Make the mobile drawer a proper dialog (focus trap, Escape, `inert`). | §9.3 |
| X8 | Extract shared Button / Field / Card primitives. | §2.6 |

### LATER — valuable, higher effort or weaker evidence

| # | Recommendation | Evidence |
| --- | --- | --- |
| L1 | `/artists/[slug]` detail pages. | §8.5 — **[H]** demand unvalidated |
| L2 | Editorial, once there is a cadence to sustain it. | §7.6 |
| L3 | Impact reporting on the support page. | §5.4 |
| L4 | Genre/artist filtering on `/shows` (indexes exist). | §7.6 |
| L5 | Differentiated newsletter by `role`. | §7.6 |
| L6 | Adopt a webfont with a performance budget. | §9.4 |

### NOT RECOMMENDED

| Not recommended | Why |
| --- | --- |
| In-house audio player / catalogue | §8.4 — rights and discovery belong to Spotify; enormous effort, no mission gain. |
| Artist-managed profile CMS | §8.4 — one operator, shared-secret admin; consent model already works. |
| Merch or ticketing commerce | §8.4 — money should reach artists on Bandcamp, not route through the project. |
| Recurring memberships / paywalled tiers | Contradicts "submissions stay free" and the de-emphasis of money (§3.3). **[H]** no evidence of demand. |
| Removing the Spotify embed | It is the working core of the product. |
| Multi-curator accounts | `admin-auth.ts` is a single shared secret; would require a real auth system for unevidenced benefit. |

---

## 12. Open questions

1. Is the primary audience the listener or the submitting artist? The mission says listener; the interface says artist (§3.5).
2. Is the geographic boundary a rule or a centre of gravity? The directory contains non-Northwest artists (§M2).
3. Why is `/shows` unlinked — abandoned, unfinished, or deliberately soft-launched?
4. Is the Spotify-track requirement a deliberate quality filter or an implementation convenience (§5.2)?
5. Is `/blog` still intended?
6. Should `bandcamp-urls.json` be retired now that `bandcamp_sources` exists (§7.7)?
7. What does the project actually want money for, and would it report on it (§5.4)?
8. Is the archive playlist meant to grow indefinitely?
9. Is placement ever paid or traded? The answer belongs on `/about` either way.

---

## 13. Explicit research gaps

**Nothing in this repository describes a real user.** The following would need genuine research before the **[H]** items in §5 can be treated as findings:

| Gap | What would resolve it |
| --- | --- |
| No analytics | No event tracking exists in the codebase. Route, play, and outbound-click instrumentation would establish whether listeners ever reach `/artists`. |
| No listener research | 5–8 interviews with people who follow regional playlists. |
| No artist research | Interviews with past submitters — especially rejected ones — on expectations and the Spotify requirement. |
| No supporter research | Nothing establishes why anyone tips, or whether the tier model fits. |
| No conversion data | Submission completion, tier selection, and newsletter rates are all unknown. |
| No accessibility user testing | §9 is a code and contrast audit only — no assistive-technology testing was performed. |
| No competitive research | The §4.5 differentiation claim is reasoning, not benchmarking. |
| No content performance data | Keep/remove calls in §6 rest on structural logic, not engagement. |

**No analytics, conversion figures, user quotes, business results, or research findings appear anywhere in this audit, because none exist in this repository.**
