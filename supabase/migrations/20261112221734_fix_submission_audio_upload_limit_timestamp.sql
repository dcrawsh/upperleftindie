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
  v_claimed_at timestamptz := clock_timestamp();
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
  where updated_at < v_claimed_at - interval '7 days';

  insert into public.submission_audio_upload_limits (
    key_hash,
    window_started_at,
    request_count,
    updated_at
  )
  values (p_key_hash, v_claimed_at, 1, v_claimed_at)
  on conflict (key_hash) do update
  set
    window_started_at = case
      when submission_audio_upload_limits.window_started_at
        <= v_claimed_at - make_interval(secs => p_window_seconds)
        then v_claimed_at
      else submission_audio_upload_limits.window_started_at
    end,
    request_count = case
      when submission_audio_upload_limits.window_started_at
        <= v_claimed_at - make_interval(secs => p_window_seconds)
        then 1
      else submission_audio_upload_limits.request_count + 1
    end,
    updated_at = v_claimed_at
  returning request_count <= p_max_requests into allowed;

  return allowed;
end;
$$;

revoke all on function public.claim_submission_audio_upload(text, integer, integer)
  from public, anon, authenticated;

grant execute on function public.claim_submission_audio_upload(text, integer, integer)
  to service_role;
