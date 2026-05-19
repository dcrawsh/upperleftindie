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
  admin_notes text
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

drop trigger if exists submissions_set_updated_at on public.submissions;
create trigger submissions_set_updated_at
before update on public.submissions
for each row
execute function public.set_updated_at();

create index if not exists submissions_status_created_at_idx
  on public.submissions (status, created_at desc);

create index if not exists submissions_spotify_track_uri_idx
  on public.submissions (spotify_track_uri);

alter table public.submissions enable row level security;
