do $$
begin
  -- The five-star constraint doubles as an idempotency marker. Without this
  -- guard, rerunning the migration would incorrectly remap a new 3-star rating
  -- to 5 stars.
  if not exists (
    select 1
    from pg_constraint
    where conname = 'track_ratings_rating_five_star_check'
      and conrelid = 'public.track_ratings'::regclass
  ) then
    alter table public.track_ratings
      drop constraint if exists track_ratings_rating_check;

    update public.track_ratings
    set rating = case rating
      when 3 then 5
      when 2 then 3
      else 1
    end;

    alter table public.track_ratings
      add constraint track_ratings_rating_five_star_check
      check (rating between 1 and 5);
  end if;

  alter table public.track_ratings
    alter column rating set default 3;
end
$$;

comment on table public.track_ratings is
  'Private 1-5 star curator ratings used to order the active playlist.';
