-- Canonical cross-module Platform Timeline.

create table if not exists public.platform_timeline_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  workspace_id uuid,
  brand_id uuid,
  relation_type text,
  relation_id uuid,
  type text not null,
  actor_id uuid references auth.users(id) on delete set null,
  actor_type text not null default 'system' check (actor_type in ('user', 'system')),
  origin text not null default 'system',
  source_type text not null,
  source_id uuid not null,
  dedupe_key text not null,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  visibility text not null default 'organization' check (visibility in ('private', 'team', 'organization')),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists platform_timeline_events_dedupe_idx
  on public.platform_timeline_events (organization_id, dedupe_key);
create index if not exists platform_timeline_events_relation_idx
  on public.platform_timeline_events (organization_id, relation_type, relation_id, occurred_at desc, id desc);
create index if not exists platform_timeline_events_scope_idx
  on public.platform_timeline_events (organization_id, workspace_id, occurred_at desc, id desc);

alter table public.platform_timeline_events enable row level security;
grant select, insert on public.platform_timeline_events to authenticated;

create policy platform_timeline_events_read
on public.platform_timeline_events
for select to authenticated
using (public.has_organization_permission(organization_id, 'crm.read'));

create policy platform_timeline_events_append
on public.platform_timeline_events
for insert to authenticated
with check (public.has_organization_permission(organization_id, 'crm.manage'));

create or replace function public.prevent_platform_timeline_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'platform_timeline_events is append-only' using errcode = 'restrict_violation';
end;
$$;
revoke all on function public.prevent_platform_timeline_mutation() from public;

drop trigger if exists platform_timeline_events_append_only on public.platform_timeline_events;
create trigger platform_timeline_events_append_only
before update or delete on public.platform_timeline_events
for each row execute function public.prevent_platform_timeline_mutation();
