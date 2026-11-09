alter table public.submissions
  add column if not exists artist_bio text;

alter table public.submissions
  add column if not exists artist_bio_approved_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'submissions_artist_bio_length_check'
      and conrelid = 'public.submissions'::regclass
  ) then
    alter table public.submissions
      add constraint submissions_artist_bio_length_check
      check (
        artist_bio is null
        or char_length(btrim(artist_bio)) between 1 and 600
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'submissions_artist_bio_approval_check'
      and conrelid = 'public.submissions'::regclass
  ) then
    alter table public.submissions
      add constraint submissions_artist_bio_approval_check
      check (artist_bio is null or artist_bio_approved_at is not null);
  end if;
end
$$;

comment on column public.submissions.artist_bio is
  'Optional artist-supplied biography approved for public display.';

comment on column public.submissions.artist_bio_approved_at is
  'When the submitting artist approved displaying artist_bio publicly.';
