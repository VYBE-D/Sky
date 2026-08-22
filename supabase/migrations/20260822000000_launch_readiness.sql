create unique index if not exists facebook_pages_workspace_page_uq on public.facebook_pages(workspace_id, page_id);
create index if not exists opportunities_workspace_score_idx on public.opportunities(workspace_id, score desc);
create index if not exists opportunities_workspace_status_idx on public.opportunities(workspace_id, status);
create index if not exists tasks_workspace_due_idx on public.tasks(workspace_id, due_at);
create index if not exists notifications_workspace_unread_idx on public.notifications(workspace_id, read_at, created_at desc);
create index if not exists scheduled_posts_due_idx on public.scheduled_posts(workspace_id, status, scheduled_at);
create index if not exists automation_rules_enabled_idx on public.automation_rules(workspace_id, enabled);
