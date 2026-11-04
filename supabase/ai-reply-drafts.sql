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
