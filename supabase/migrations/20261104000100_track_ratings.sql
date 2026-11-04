create table if not exists public.track_ratings (
  track_uri text primary key,
  rating smallint not null default 2 check (rating between 1 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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

drop trigger if exists track_ratings_set_updated_at on public.track_ratings;
create trigger track_ratings_set_updated_at
before update on public.track_ratings
for each row
execute function public.set_updated_at();

alter table public.track_ratings enable row level security;

comment on table public.track_ratings is
  'Private 1-3 star curator ratings that decide active playlist order.';

-- Every track that has already been accepted starts at two stars. Tracks added
-- to the playlist directly in Spotify are backfilled at two stars the first
-- time the admin Active Playlist tab loads.
insert into public.track_ratings (track_uri, rating)
select distinct spotify_track_uri, 2
from public.submissions
where spotify_track_uri is not null
on conflict (track_uri) do nothing;
