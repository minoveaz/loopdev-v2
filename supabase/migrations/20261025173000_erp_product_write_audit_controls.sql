create table if not exists public.erp_product_write_controls (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  organization_id uuid references public.organizations(id) on delete restrict,
  enabled boolean not null default false,
  security_gates_ready boolean not null default false,
  reason_code text not null default 'migration_default',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (scope in ('global', 'organization')),
  check (
    (scope = 'global' and organization_id is null)
    or (scope = 'organization' and organization_id is not null)
  ),
  check (reason_code ~ '^[a-z][a-z0-9_.-]{0,63}$')
);

create unique index if not exists erp_product_write_controls_global_idx
  on public.erp_product_write_controls (scope)
  where scope = 'global';
create unique index if not exists erp_product_write_controls_organization_idx
  on public.erp_product_write_controls (organization_id)
  where scope = 'organization';

insert into public.erp_product_write_controls (scope, enabled, security_gates_ready, reason_code)
values ('global', false, false, 'migration_default')
on conflict (scope) where scope = 'global' do nothing;

alter table public.erp_product_write_controls enable row level security;
revoke all on public.erp_product_write_controls from public, anon, authenticated, service_role;

create or replace function public.erp_product_writes_enabled(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce((
    select controls.enabled and controls.security_gates_ready
    from public.erp_product_write_controls controls
    where controls.scope = 'global'
      and controls.organization_id is null
  ), false)
  and coalesce((
    select controls.enabled
    from public.erp_product_write_controls controls
    where controls.scope = 'organization'
      and controls.organization_id = target_organization_id
  ), false);
$$;

revoke all on function public.erp_product_writes_enabled(uuid) from public, anon;
grant execute on function public.erp_product_writes_enabled(uuid) to authenticated, service_role;

create or replace function public.set_erp_product_write_control(
  target_scope text,
  target_organization_id uuid,
  target_enabled boolean,
  target_reason_code text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  security_ready boolean;
begin
  if auth.uid() is null or not public.has_platform_role('owner') then
    raise exception 'Only a Platform owner can change Products write controls'
      using errcode = '42501';
  end if;

  if target_reason_code is null
     or target_reason_code !~ '^[a-z][a-z0-9_.-]{0,63}$' then
    raise exception 'A valid reason code is required for Products write-control changes'
      using errcode = '22023';
  end if;

  if target_scope = 'global' and target_organization_id is null then
    select controls.security_gates_ready
      into security_ready
    from public.erp_product_write_controls controls
    where controls.scope = 'global'
      and controls.organization_id is null;

    if target_enabled and not coalesce(security_ready, false) then
      raise exception 'Products security gates are not ready'
        using errcode = '55000';
    end if;

    insert into public.erp_product_write_controls (
      scope, organization_id, enabled, reason_code, updated_at
    ) values (
      'global', null, target_enabled, target_reason_code, now()
    )
    on conflict (scope) where scope = 'global'
    do update set
      enabled = excluded.enabled,
      reason_code = excluded.reason_code,
      updated_at = excluded.updated_at;
  elsif target_scope = 'organization' and target_organization_id is not null then
    select controls.security_gates_ready
      into security_ready
    from public.erp_product_write_controls controls
    where controls.scope = 'global'
      and controls.organization_id is null;

    if target_enabled and not coalesce(security_ready, false) then
      raise exception 'Products security gates are not ready'
        using errcode = '55000';
    end if;

    insert into public.erp_product_write_controls (
      scope, organization_id, enabled, reason_code, updated_at
    ) values (
      'organization', target_organization_id, target_enabled, target_reason_code, now()
    )
    on conflict (organization_id) where scope = 'organization'
    do update set
      enabled = excluded.enabled,
      reason_code = excluded.reason_code,
      updated_at = excluded.updated_at;
  else
    raise exception 'Invalid Products write-control scope'
      using errcode = '22023';
  end if;
end;
$$;

revoke all on function public.set_erp_product_write_control(text, uuid, boolean, text)
  from public, anon;
grant execute on function public.set_erp_product_write_control(text, uuid, boolean, text)
  to authenticated;

create or replace function public.audit_erp_product_write_control()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_organization_id uuid;
  affected_organizations integer := 0;
begin
  if tg_op = 'UPDATE'
     and old.enabled is not distinct from new.enabled
     and old.reason_code is not distinct from new.reason_code then
    return new;
  end if;

  if new.scope = 'global' then
    insert into public.platform_audit_events (
      organization_id, actor_user_id, event_type, entity_type, entity_id, metadata
    )
    select
      organization.id,
      auth.uid(),
      'erp.write_control.changed',
      'erp_product_write_control',
      'global',
      jsonb_build_object(
        'scope', 'global',
        'enabled', new.enabled,
        'reason_code', new.reason_code,
        'changed_fields', array['enabled', 'reason_code']
      )
    from public.organizations organization;
    get diagnostics affected_organizations = row_count;
  else
    target_organization_id := new.organization_id;
    insert into public.platform_audit_events (
      organization_id, actor_user_id, event_type, entity_type, entity_id, metadata
    ) values (
      target_organization_id,
      auth.uid(),
      'erp.write_control.changed',
      'erp_product_write_control',
      target_organization_id::text,
      jsonb_build_object(
        'scope', 'organization',
        'enabled', new.enabled,
        'reason_code', new.reason_code,
        'changed_fields', array['enabled', 'reason_code']
      )
    );
    affected_organizations := 1;
  end if;

  if affected_organizations = 0 then
    raise exception 'Products write-control change could not be audited'
      using errcode = '55000';
  end if;

  return new;
end;
$$;

revoke all on function public.audit_erp_product_write_control() from public;

drop trigger if exists erp_product_write_controls_audit
  on public.erp_product_write_controls;
create trigger erp_product_write_controls_audit
after insert or update of enabled, reason_code
on public.erp_product_write_controls
for each row execute function public.audit_erp_product_write_control();

create or replace function public.enforce_erp_product_write_control()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_organization_id uuid;
begin
  if tg_op = 'DELETE' then
    target_organization_id := old.organization_id;
  else
    target_organization_id := new.organization_id;
  end if;

  if tg_op = 'UPDATE'
     and old.organization_id is distinct from new.organization_id then
    raise exception 'Products organization ownership cannot be changed'
      using errcode = '42501';
  end if;

  if target_organization_id is null
     or not public.erp_product_writes_enabled(target_organization_id) then
    raise exception 'ERP Products writes are disabled by safety control'
      using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_erp_product_write_control() from public;

create or replace function public.audit_erp_product_mutation()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  before_row jsonb := '{}'::jsonb;
  after_row jsonb := '{}'::jsonb;
  event_row jsonb;
  target_organization_id uuid;
  target_entity_id text;
  changed_fields text[];
  headers jsonb;
  correlation_id text;
  reason_code text;
begin
  if tg_op <> 'INSERT' then
    before_row := to_jsonb(old);
  end if;
  if tg_op <> 'DELETE' then
    after_row := to_jsonb(new);
  end if;

  event_row := case when tg_op = 'DELETE' then before_row else after_row end;
  target_organization_id := (event_row ->> 'organization_id')::uuid;
  target_entity_id := event_row ->> 'id';

  if tg_op = 'INSERT' then
    select coalesce(array_agg(field.key order by field.key), '{}')
      into changed_fields
    from jsonb_object_keys(after_row) as field(key);
  elsif tg_op = 'DELETE' then
    select coalesce(array_agg(field.key order by field.key), '{}')
      into changed_fields
    from jsonb_object_keys(before_row) as field(key);
  else
    select coalesce(array_agg(after_field.key order by after_field.key), '{}')
      into changed_fields
    from jsonb_each(after_row) as after_field(key, value)
    where before_row -> after_field.key is distinct from after_field.value;
  end if;

  headers := coalesce(nullif(current_setting('request.headers', true), '')::jsonb, '{}'::jsonb);
  correlation_id := headers ->> 'x-correlation-id';
  reason_code := headers ->> 'x-reason-code';

  if correlation_id is not null
     and correlation_id !~ '^[A-Za-z0-9._:-]{1,128}$' then
    raise exception 'Invalid audit correlation ID'
      using errcode = '22023';
  end if;
  if reason_code is not null
     and reason_code !~ '^[a-z][a-z0-9_.-]{0,63}$' then
    raise exception 'Invalid audit reason code'
      using errcode = '22023';
  end if;

  perform public.record_platform_audit_event(
    target_organization_id,
    'erp.' || regexp_replace(tg_table_name, '^erp_', '') || '.' || lower(tg_op),
    tg_table_name,
    target_entity_id,
    jsonb_build_object(
      'operation', lower(tg_op),
      'changed_fields', changed_fields,
      'version', coalesce(after_row ->> 'updated_at', before_row ->> 'updated_at'),
      'correlation_id', correlation_id,
      'reason_code', reason_code
    )
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.audit_erp_product_mutation() from public;

do $erp_product_audit_triggers$
declare
  table_name text;
begin
  foreach table_name in array array[
    'erp_catalogs',
    'erp_catalog_items',
    'erp_catalog_offers',
    'erp_catalog_variants',
    'erp_price_books',
    'erp_price_entries',
    'erp_product_references',
    'erp_product_cost_references',
    'erp_product_media_assets',
    'erp_product_media_assignments'
  ] loop
    execute format(
      'drop trigger if exists erp_product_write_control_guard on public.%I',
      table_name
    );
    execute format(
      'create trigger erp_product_write_control_guard before insert or update or delete on public.%I for each row execute function public.enforce_erp_product_write_control()',
      table_name
    );
    execute format(
      'drop trigger if exists erp_product_mutation_audit on public.%I',
      table_name
    );
    execute format(
      'create trigger erp_product_mutation_audit after insert or update or delete on public.%I for each row execute function public.audit_erp_product_mutation()',
      table_name
    );
  end loop;
end;
$erp_product_audit_triggers$;
