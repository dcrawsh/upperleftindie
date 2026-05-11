# Shows Scraper Setup

This feature stores a small Portland show calendar in Supabase and displays it
at `/shows`.

## Minimal Data Collected

- Show title
- Venue name
- Start date/time
- Event URL
- Last scraped timestamp

## Supabase Setup

Run `supabase/shows.sql` in the Supabase SQL editor for the project. It creates
the `shows` table, adds indexes, and enables public read access through RLS.

## Environment Variables

Add these to the deployed app so `/shows` can read from Supabase:

```text
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

Add these as GitHub Actions repository secrets so the weekly scraper can write:

```text
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only. Do not expose it as a public
or browser env var.

## Venue Source List

Put the pages you want scraped in `src/data/show-sources.json`:

```json
[
  {
    "key": "venue-slug",
    "name": "Venue Name",
    "url": "https://venue.example.com/events",
    "parser": "html-lines"
  }
]
```

The scraper first looks for JSON-LD `Event` or `MusicEvent` data. If a source is
marked with `"parser": "html-lines"`, it falls back to a visible-text parser
that looks for nearby date/title/time lines. That works as a starting point for
plain venue calendars, but venue-specific parsers may still be needed for pages
with unusual markup or JavaScript-rendered calendars.

## Running

The weekly GitHub Action runs every Monday at 12:00 UTC:

```text
.github/workflows/scrape-portland-shows.yml
```

Manual run:

```bash
yarn scrape:shows
```

Local test without writing to Supabase:

```bash
DRY_RUN=1 yarn scrape:shows
```
