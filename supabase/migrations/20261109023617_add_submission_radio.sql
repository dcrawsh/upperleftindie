-- A private holding bucket for artist-submitted MP3s. Uploads use short-lived
-- signed URLs; playback URLs are only minted for the curator or published
-- radio tracks.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'submission-audio',
  'submission-audio',
  false,
  12582912,
  array['audio/mpeg']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.submissions
  alter column song_link drop not null;

alter table public.submissions
  add column if not exists track_title text;

alter table public.submissions
  add column if not exists audio_storage_path text;

alter table public.submissions
  add column if not exists audio_original_filename text;

alter table public.submissions
  add column if not exists audio_mime_type text;

alter table public.submissions
  add column if not exists audio_size_bytes bigint;

alter table public.submissions
  add column if not exists audio_upload_status text
    check (audio_upload_status in ('uploaded', 'published', 'removed'));

alter table public.submissions
  add column if not exists audio_expires_at timestamptz;

alter table public.submissions
  add column if not exists audio_deleted_at timestamptz;

alter table public.submissions
  add column if not exists radio_rights_version text;

alter table public.submissions
  add column if not exists radio_rights_accepted_at timestamptz;

alter table public.submissions
  add column if not exists radio_published_at timestamptz;

alter table public.submissions
  add column if not exists radio_removed_at timestamptz;

alter table public.submissions
  add column if not exists radio_playback_url text;

alter table public.submissions
  add column if not exists radio_playback_url_expires_at timestamptz;

create table if not exists public.submission_audio_upload_limits (
  key_hash text primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  updated_at timestamptz not null default now()
);

alter table public.submission_audio_upload_limits enable row level security;

revoke all on table public.submission_audio_upload_limits from anon, authenticated;

create index if not exists submission_audio_upload_limits_updated_at_idx
  on public.submission_audio_upload_limits (updated_at);

drop trigger if exists submission_audio_upload_limits_set_updated_at
  on public.submission_audio_upload_limits;

create trigger submission_audio_upload_limits_set_updated_at
before update on public.submission_audio_upload_limits
for each row
execute function public.set_updated_at();

create or replace function public.claim_submission_audio_upload(
  p_key_hash text,
  p_max_requests integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_time timestamptz := clock_timestamp();
  allowed boolean;
begin
  if
    length(p_key_hash) <> 64
    or p_max_requests < 1
    or p_window_seconds < 1
  then
    return false;
  end if;

  delete from public.submission_audio_upload_limits
  where updated_at < current_time - interval '7 days';

  insert into public.submission_audio_upload_limits (
    key_hash,
    window_started_at,
    request_count,
    updated_at
  )
  values (p_key_hash, current_time, 1, current_time)
  on conflict (key_hash) do update
  set
    window_started_at = case
      when submission_audio_upload_limits.window_started_at
        <= current_time - make_interval(secs => p_window_seconds)
        then current_time
      else submission_audio_upload_limits.window_started_at
    end,
    request_count = case
      when submission_audio_upload_limits.window_started_at
        <= current_time - make_interval(secs => p_window_seconds)
        then 1
      else submission_audio_upload_limits.request_count + 1
    end,
    updated_at = current_time
  returning request_count <= p_max_requests into allowed;

  return allowed;
end;
$$;

revoke all on function public.claim_submission_audio_upload(text, integer, integer)
  from public, anon, authenticated;

grant execute on function public.claim_submission_audio_upload(text, integer, integer)
  to service_role;

create unique index if not exists submissions_audio_storage_path_idx
  on public.submissions (audio_storage_path)
  where audio_storage_path is not null;

create index if not exists submissions_audio_expires_at_idx
  on public.submissions (audio_expires_at)
  where audio_upload_status = 'uploaded';

create index if not exists submissions_radio_published_at_idx
  on public.submissions (radio_published_at desc)
  where radio_published_at is not null;

alter table public.submissions
  drop constraint if exists submissions_listening_source_check;

alter table public.submissions
  add constraint submissions_listening_source_check check (
    nullif(btrim(song_link), '') is not null
    or audio_storage_path is not null
  );
