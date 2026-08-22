alter table public.approval_queue add column if not exists metadata jsonb not null default '{}'::jsonb;
