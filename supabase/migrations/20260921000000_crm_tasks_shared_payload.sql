-- Shared Tasks payload required by desktop and mobile task renderers.
-- Keeps existing task rows readable while moving checklist, mentions, reminders and tags to Supabase.

alter table public.crm_tasks
  add column if not exists workspace_id uuid,
  add column if not exists suite text not null default 'crm',
  add column if not exists relation_label text,
  add column if not exists template_id uuid,
  add column if not exists checklist jsonb not null default '[]'::jsonb,
  add column if not exists mentions jsonb not null default '[]'::jsonb,
  add column if not exists reminders jsonb not null default '[]'::jsonb,
  add column if not exists tags jsonb not null default '[]'::jsonb;

create index if not exists crm_tasks_suite_scope_idx
  on public.crm_tasks (organization_id, suite, updated_at desc, id);

create index if not exists crm_tasks_assignee_scope_idx
  on public.crm_tasks (organization_id, assigned_to_user_id, updated_at desc);
