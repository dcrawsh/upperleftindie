-- Baseline: the schema that was applied by hand in the Supabase SQL editor
-- before migrations were introduced. It is recorded as already applied on the
-- live project (supabase migration repair --status applied), so db push never
-- re-runs it there. Every statement is idempotent regardless.

-- submissions ----------------------------------------------------------------

create extension if not exists pgcrypto;

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'pending'
    check (status in ('pending', 'added', 'rejected', 'archived')),
  artist_name text not null,
  contact_name text not null,
  email text not null,
  city text not null default '',
  region text not null default '',
  genre text not null default '',
  song_link text not null,
  bandcamp_link text,
  social_link text,
  notes text,
  artist_page_consent boolean not null default false,
  subscribe_to_newsletter boolean not null default true,
  spotify_track_id text,
  spotify_track_uri text,
  active_playlist_added_at timestamptz,
  archived_at timestamptz,
  replied_at timestamptz,
  reply_subject text,
  admin_notes text
);

alter table public.submissions
  add column if not exists replied_at timestamptz;

alter table public.submissions
  add column if not exists reply_subject text;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists submissions_set_updated_at on public.submissions;
create trigger submissions_set_updated_at
before update on public.submissions
for each row
execute function public.set_updated_at();

create index if not exists submissions_status_created_at_idx
  on public.submissions (status, created_at desc);

create index if not exists submissions_spotify_track_uri_idx
  on public.submissions (spotify_track_uri);

create index if not exists submissions_replied_at_idx
  on public.submissions (replied_at desc);

alter table public.submissions enable row level security;

-- ai_reply_drafts ------------------------------------------------------------

create extension if not exists pgcrypto;

create table if not exists public.ai_reply_drafts (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null
    references public.submissions(id) on delete cascade,
  model text not null,
  prompt_version text not null,
  generation_settings jsonb not null default '{}'::jsonb,
  input_snapshot jsonb not null,
  generated_subject text not null,
  generated_message text not null,
  final_subject text,
  final_message text,
  rating smallint check (rating in (-1, 0, 1)),
  feedback_tags text[] not null default '{}',
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'discarded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ai_reply_drafts_set_updated_at
  on public.ai_reply_drafts;
create trigger ai_reply_drafts_set_updated_at
before update on public.ai_reply_drafts
for each row
execute function public.set_updated_at();

create index if not exists ai_reply_drafts_submission_id_idx
  on public.ai_reply_drafts (submission_id, created_at desc);

create index if not exists ai_reply_drafts_training_examples_idx
  on public.ai_reply_drafts (status, rating, sent_at desc);

alter table public.ai_reply_drafts enable row level security;

comment on table public.ai_reply_drafts is
  'Private AI reply generations paired with curator edits and feedback.';

-- bandcamp_sources ----------------------------------------------------------

create extension if not exists pgcrypto;

create table if not exists public.bandcamp_sources (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  artist_name text not null default '',
  bandcamp_url text not null,
  genre text not null default '',
  source text not null default 'submission-form',

  status text not null default 'active'
    check (status in ('active', 'hidden', 'failed')),

  last_scraped_at timestamptz,
  last_error text,

  unique (bandcamp_url)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bandcamp_sources_set_updated_at on public.bandcamp_sources;

create trigger bandcamp_sources_set_updated_at
before update on public.bandcamp_sources
for each row
execute function public.set_updated_at();

create index if not exists bandcamp_sources_status_created_at_idx
  on public.bandcamp_sources (status, created_at desc);

create index if not exists bandcamp_sources_bandcamp_url_idx
  on public.bandcamp_sources (bandcamp_url);

alter table public.bandcamp_sources enable row level security;

-- shows ----------------------------------------------------------------------

create table if not exists public.shows (
  id bigint generated by default as identity primary key,
  source_id text not null unique,
  venue_name text not null,
  title text not null,
  artist_name text,
  genre text,
  starts_at timestamptz not null,
  url text not null,
  scraped_at timestamptz not null default now()
);

alter table public.shows add column if not exists artist_name text;
alter table public.shows add column if not exists genre text;

update public.shows
set artist_name = title
where artist_name is null;

create index if not exists shows_starts_at_idx on public.shows (starts_at);
create index if not exists shows_venue_name_idx on public.shows (venue_name);
create index if not exists shows_artist_name_idx on public.shows (artist_name);
create index if not exists shows_genre_idx on public.shows (genre);

alter table public.shows enable row level security;

drop policy if exists "Shows are publicly readable" on public.shows;
create policy "Shows are publicly readable"
  on public.shows
  for select
  using (true);
