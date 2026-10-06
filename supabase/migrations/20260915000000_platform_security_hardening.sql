-- Platform security hardening: active membership access and append-only audit evidence.

create table if not exists public.platform_audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type ~ '^[a-z][a-z0-9_.-]*$'),
  entity_type text not null check (entity_type ~ '^[a-z][a-z0-9_.-]*$'),
  entity_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists platform_audit_events_scope_idx
  on public.platform_audit_events (organization_id, occurred_at desc, id desc);

create or replace function public.is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = target_organization_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  );
$$;

create or replace function public.has_organization_role(
  target_organization_id uuid,
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = target_organization_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role = any(allowed_roles)
  );
$$;

create or replace function public.record_platform_audit_event(
  target_organization_id uuid,
  target_event_type text,
  target_entity_type text,
  target_entity_id text,
  target_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  audit_id uuid;
begin
  if auth.uid() is null or not public.is_organization_member(target_organization_id) then
    raise exception 'organization access denied' using errcode = 'insufficient_privilege';
  end if;

  insert into public.platform_audit_events (
    organization_id,
    actor_user_id,
    event_type,
    entity_type,
    entity_id,
    metadata
  ) values (
    target_organization_id,
    auth.uid(),
    target_event_type,
    target_entity_type,
    target_entity_id,
    coalesce(target_metadata, '{}'::jsonb)
  )
  returning id into audit_id;

  return audit_id;
end;
$$;

revoke all on function public.record_platform_audit_event(uuid, text, text, text, jsonb) from public;
grant execute on function public.record_platform_audit_event(uuid, text, text, text, jsonb) to authenticated;

create or replace function public.audit_membership_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_event_type text;
  target_organization_id uuid;
  target_entity_id text;
begin
  target_organization_id := coalesce(new.organization_id, old.organization_id);
  target_entity_id := coalesce(new.user_id, old.user_id)::text;
  target_event_type := case tg_op
    when 'INSERT' then 'membership.created'
    when 'UPDATE' then 'membership.updated'
    when 'DELETE' then 'membership.deleted'
  end;

  insert into public.platform_audit_events (
    organization_id,
    actor_user_id,
    event_type,
    entity_type,
    entity_id,
    metadata
  ) values (
    target_organization_id,
    auth.uid(),
    target_event_type,
    'organization_membership',
    target_entity_id,
    jsonb_build_object(
      'operation', tg_op,
      'role', coalesce(new.role, old.role),
      'status', coalesce(new.status, old.status)
    )
  );

  return coalesce(new, old);
end;
$$;

revoke all on function public.audit_membership_lifecycle() from public;

drop trigger if exists organization_memberships_audit_lifecycle on public.organization_memberships;
create trigger organization_memberships_audit_lifecycle
after insert or update or delete on public.organization_memberships
for each row execute function public.audit_membership_lifecycle();

revoke all on public.platform_audit_events from authenticated;
grant select on public.platform_audit_events to authenticated;

alter table public.platform_audit_events enable row level security;

create policy platform_audit_events_read
on public.platform_audit_events
for select
to authenticated
using (
  public.has_organization_permission(organization_id, 'organization.read')
  or public.is_platform_administrator()
);

create or replace function public.prevent_platform_audit_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'platform_audit_events is append-only' using errcode = 'restrict_violation';
end;
$$;

revoke all on function public.prevent_platform_audit_mutation() from public;

drop trigger if exists platform_audit_events_append_only on public.platform_audit_events;
create trigger platform_audit_events_append_only
before update or delete on public.platform_audit_events
for each row execute function public.prevent_platform_audit_mutation();
