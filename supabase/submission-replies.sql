alter table public.submissions
  add column if not exists replied_at timestamptz;

alter table public.submissions
  add column if not exists reply_subject text;

create index if not exists submissions_replied_at_idx
  on public.submissions (replied_at desc);
