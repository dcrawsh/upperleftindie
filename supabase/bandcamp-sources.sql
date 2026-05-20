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
