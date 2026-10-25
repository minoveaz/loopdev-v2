create table if not exists public.erp_catalog_identifier_counters (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  last_internal_key bigint not null default 0 check (last_internal_key >= 0),
  last_sku bigint not null default 10000000000 check (last_sku >= 10000000000),
  updated_at timestamptz not null default now()
);

alter table public.erp_catalog_identifier_counters enable row level security;
revoke all on table public.erp_catalog_identifier_counters from public, anon, authenticated;

revoke all on function public.next_erp_catalog_item_key(uuid) from authenticated;
drop trigger if exists erp_catalog_items_numeric_key on public.erp_catalog_items;

do $$
begin
  if exists (
    select 1
    from (
      select key::numeric as identifier
      from public.erp_catalog_items
      where key ~ '^[0-9]+$'
      union all
      select key::numeric
      from public.erp_catalog_variants
      where key ~ '^[0-9]+$'
      union all
      select sku::numeric
      from public.erp_catalog_items
      where sku ~ '^[0-9]+$'
      union all
      select sku::numeric
      from public.erp_catalog_variants
      where sku ~ '^[0-9]+$'
    ) identifiers
    where identifier > 9223372036854775807
  ) then
    raise exception 'Existing numeric catalog identifiers exceed the supported 64-bit range.';
  end if;
end;
$$;

insert into public.erp_catalog_identifier_counters (organization_id, last_internal_key, last_sku)
select organization_id, max(internal_key), greatest(max(sku), 10000000000)
from (
  select organization_id,
    case when key ~ '^[0-9]+$' then key::bigint else 0 end as internal_key,
    case when sku ~ '^[0-9]+$' then sku::bigint else 10000000000 end as sku
  from public.erp_catalog_items
  union all
  select organization_id,
    case when key ~ '^[0-9]+$' then key::bigint else 0 end,
    case when sku ~ '^[0-9]+$' then sku::bigint else 10000000000 end
  from public.erp_catalog_variants
) identifiers
group by organization_id
on conflict (organization_id) do update
set last_internal_key = greatest(public.erp_catalog_identifier_counters.last_internal_key, excluded.last_internal_key),
    last_sku = greatest(public.erp_catalog_identifier_counters.last_sku, excluded.last_sku),
    updated_at = now();

create or replace function public.next_erp_catalog_internal_key(target_organization_id uuid)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  allocated_value bigint;
begin
  if auth.uid() is not null
    and not public.has_organization_permission(target_organization_id, 'catalog.write') then
    raise exception using errcode = '42501', message = 'Product management permission is required.';
  end if;

  insert into public.erp_catalog_identifier_counters (organization_id, last_internal_key, last_sku)
  values (target_organization_id, 1, 10000000000)
  on conflict (organization_id) do update
    set last_internal_key = public.erp_catalog_identifier_counters.last_internal_key + 1,
        updated_at = now()
  returning last_internal_key into allocated_value;

  return allocated_value::text;
end;
$$;

create or replace function public.next_erp_catalog_sku(target_organization_id uuid)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  allocated_value bigint;
begin
  if auth.uid() is not null
    and not public.has_organization_permission(target_organization_id, 'catalog.write') then
    raise exception using errcode = '42501', message = 'Product management permission is required.';
  end if;

  insert into public.erp_catalog_identifier_counters (organization_id, last_internal_key, last_sku)
  values (target_organization_id, 0, 10000000001)
  on conflict (organization_id) do update
    set last_sku = public.erp_catalog_identifier_counters.last_sku + 1,
        updated_at = now()
  returning last_sku into allocated_value;

  return allocated_value::text;
end;
$$;

revoke all on function public.next_erp_catalog_internal_key(uuid) from public, anon, authenticated;
revoke all on function public.next_erp_catalog_sku(uuid) from public, anon, authenticated;
grant execute on function public.next_erp_catalog_internal_key(uuid) to service_role;
grant execute on function public.next_erp_catalog_sku(uuid) to service_role;

create table if not exists public.erp_catalog_key_registry (
  organization_id uuid not null references public.organizations(id) on delete restrict,
  internal_key text not null check (internal_key ~ '^[0-9]+$'),
  entity_type text not null check (entity_type in ('product', 'variant')),
  entity_id uuid not null,
  primary key (organization_id, internal_key),
  unique (entity_type, entity_id)
);

alter table public.erp_catalog_key_registry enable row level security;
revoke all on table public.erp_catalog_key_registry from public, anon, authenticated;

do $$
declare
  record_row record;
  assigned_key text;
  assigned_sku text;
  next_metadata jsonb;
  has_variants boolean;
begin
  for record_row in
    select item.id, item.organization_id, item.key, item.sku, item.metadata, item.created_at,
      exists (
        select 1
        from public.erp_catalog_variants variant
        where variant.organization_id = item.organization_id
          and variant.catalog_item_id = item.id
      ) as has_variants
    from public.erp_catalog_items item
    order by item.organization_id, item.created_at, item.id
  loop
    assigned_key := record_row.key;
    if assigned_key !~ '^[0-9]+$' then
      assigned_key := public.next_erp_catalog_internal_key(record_row.organization_id);
    end if;

    begin
      insert into public.erp_catalog_key_registry (organization_id, internal_key, entity_type, entity_id)
      values (record_row.organization_id, assigned_key, 'product', record_row.id);
    exception when unique_violation then
      assigned_key := public.next_erp_catalog_internal_key(record_row.organization_id);
      insert into public.erp_catalog_key_registry (organization_id, internal_key, entity_type, entity_id)
      values (record_row.organization_id, assigned_key, 'product', record_row.id);
    end;

    has_variants := record_row.has_variants;
    assigned_sku := case
      when has_variants then ''
      when record_row.sku ~ '^[0-9]+$' then record_row.sku
      else public.next_erp_catalog_sku(record_row.organization_id)
    end;

    if assigned_key is distinct from record_row.key or assigned_sku is distinct from record_row.sku then
      next_metadata := coalesce(record_row.metadata, '{}'::jsonb);
      next_metadata := jsonb_set(
        next_metadata,
        '{loopdevIdentifierMigration}',
        coalesce(next_metadata -> 'loopdevIdentifierMigration', '{}'::jsonb)
          || jsonb_strip_nulls(jsonb_build_object(
            'migration', '20261025000000_erp_system_generated_identifiers',
            'previousKey', case when assigned_key is distinct from record_row.key then record_row.key end,
            'previousSku', case when assigned_sku is distinct from record_row.sku and record_row.sku <> '' then record_row.sku end
          )),
        true
      );
      update public.erp_catalog_items
      set key = assigned_key, sku = assigned_sku, metadata = next_metadata
      where id = record_row.id and organization_id = record_row.organization_id;
    end if;
  end loop;

  for record_row in
    select variant.id, variant.organization_id, variant.key, variant.sku, variant.metadata, variant.created_at
    from public.erp_catalog_variants variant
    order by variant.organization_id, variant.created_at, variant.id
  loop
    assigned_key := record_row.key;
    if assigned_key !~ '^[0-9]+$' then
      assigned_key := public.next_erp_catalog_internal_key(record_row.organization_id);
    end if;

    begin
      insert into public.erp_catalog_key_registry (organization_id, internal_key, entity_type, entity_id)
      values (record_row.organization_id, assigned_key, 'variant', record_row.id);
    exception when unique_violation then
      assigned_key := public.next_erp_catalog_internal_key(record_row.organization_id);
      insert into public.erp_catalog_key_registry (organization_id, internal_key, entity_type, entity_id)
      values (record_row.organization_id, assigned_key, 'variant', record_row.id);
    end;

    assigned_sku := case
      when record_row.sku ~ '^[0-9]+$' then record_row.sku
      else public.next_erp_catalog_sku(record_row.organization_id)
    end;

    if assigned_key is distinct from record_row.key or assigned_sku is distinct from record_row.sku then
      next_metadata := coalesce(record_row.metadata, '{}'::jsonb);
      next_metadata := jsonb_set(
        next_metadata,
        '{loopdevIdentifierMigration}',
        coalesce(next_metadata -> 'loopdevIdentifierMigration', '{}'::jsonb)
          || jsonb_strip_nulls(jsonb_build_object(
            'migration', '20261025000000_erp_system_generated_identifiers',
            'previousKey', case when assigned_key is distinct from record_row.key then record_row.key end,
            'previousSku', case when assigned_sku is distinct from record_row.sku and record_row.sku <> '' then record_row.sku end
          )),
        true
      );
      update public.erp_catalog_variants
      set key = assigned_key, sku = assigned_sku, metadata = next_metadata
      where id = record_row.id and organization_id = record_row.organization_id;
    end if;
  end loop;
end;
$$;

create or replace function public.sync_erp_catalog_key_registry()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_entity_type text := case when tg_table_name = 'erp_catalog_items' then 'product' else 'variant' end;
begin
  if tg_op = 'DELETE' then
    delete from public.erp_catalog_key_registry
    where organization_id = old.organization_id
      and entity_type = target_entity_type
      and entity_id = old.id;
    return old;
  end if;

  if tg_op = 'UPDATE' then
    delete from public.erp_catalog_key_registry
    where organization_id = old.organization_id
      and entity_type = target_entity_type
      and entity_id = old.id;
  end if;

  insert into public.erp_catalog_key_registry (organization_id, internal_key, entity_type, entity_id)
  values (new.organization_id, new.key, target_entity_type, new.id);
  return new;
end;
$$;

create or replace function public.assign_erp_catalog_item_identifiers()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'INSERT' then
    new.id := gen_random_uuid();
    new.key := public.next_erp_catalog_internal_key(new.organization_id);
    new.sku := public.next_erp_catalog_sku(new.organization_id);
  else
    if new.id is distinct from old.id then
      raise exception using errcode = '23514', message = 'Product IDs are immutable.';
    end if;
    if new.key is distinct from old.key then
      raise exception using errcode = '23514', message = 'Product keys are immutable.';
    end if;
    if new.sku is distinct from old.sku
      and auth.uid() is not null
      and auth.role() <> 'service_role'
      and pg_trigger_depth() <= 1 then
      raise exception using errcode = '23514', message = 'Product SKUs are generated by LoopDev and immutable to users.';
    end if;
    if new.sku <> ''
      and exists (
        select 1 from public.erp_catalog_variants variant
        where variant.organization_id = new.organization_id
          and variant.catalog_item_id = new.id
      ) then
      raise exception using errcode = '23514', message = 'Variant-managed products cannot have a base SKU.';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.assign_erp_catalog_variant_identifiers()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'INSERT' then
    new.id := gen_random_uuid();
    new.key := public.next_erp_catalog_internal_key(new.organization_id);
    new.sku := public.next_erp_catalog_sku(new.organization_id);
  else
    if new.id is distinct from old.id then
      raise exception using errcode = '23514', message = 'Variant IDs are immutable.';
    end if;
    if new.key is distinct from old.key then
      raise exception using errcode = '23514', message = 'Variant keys are immutable.';
    end if;
    if new.sku is distinct from old.sku
      and auth.uid() is not null
      and auth.role() <> 'service_role'
      and pg_trigger_depth() <= 1 then
      raise exception using errcode = '23514', message = 'Variant SKUs are generated by LoopDev and immutable to users.';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.sync_erp_variant_parent_sku()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_catalog_item_id uuid := case when tg_op = 'DELETE' then old.catalog_item_id else new.catalog_item_id end;
  target_organization_id uuid := case when tg_op = 'DELETE' then old.organization_id else new.organization_id end;
begin
  if tg_op = 'INSERT' then
    update public.erp_catalog_items
    set sku = ''
    where id = target_catalog_item_id
      and organization_id = target_organization_id
      and sku <> '';
    return new;
  end if;

  if tg_op = 'DELETE' and not exists (
    select 1 from public.erp_catalog_variants variant
    where variant.catalog_item_id = target_catalog_item_id
      and variant.organization_id = target_organization_id
      and variant.id <> old.id
  ) then
    update public.erp_catalog_items
    set sku = public.next_erp_catalog_sku(target_organization_id)
    where id = target_catalog_item_id
      and organization_id = target_organization_id
      and sku = '';
  end if;
  return old;
end;
$$;

revoke all on function public.sync_erp_catalog_key_registry() from public, anon, authenticated;
revoke all on function public.assign_erp_catalog_item_identifiers() from public, anon, authenticated;
revoke all on function public.assign_erp_catalog_variant_identifiers() from public, anon, authenticated;
revoke all on function public.sync_erp_variant_parent_sku() from public, anon, authenticated;

drop trigger if exists erp_catalog_items_identifier_assignment on public.erp_catalog_items;
create trigger erp_catalog_items_identifier_assignment
  before insert or update of id, key, sku on public.erp_catalog_items
  for each row execute function public.assign_erp_catalog_item_identifiers();

drop trigger if exists erp_catalog_variants_identifier_assignment on public.erp_catalog_variants;
create trigger erp_catalog_variants_identifier_assignment
  before insert or update of id, key, sku on public.erp_catalog_variants
  for each row execute function public.assign_erp_catalog_variant_identifiers();

drop trigger if exists erp_catalog_items_key_registry on public.erp_catalog_items;
create trigger erp_catalog_items_key_registry
  after insert or update of organization_id, key or delete on public.erp_catalog_items
  for each row execute function public.sync_erp_catalog_key_registry();

drop trigger if exists erp_catalog_variants_key_registry on public.erp_catalog_variants;
create trigger erp_catalog_variants_key_registry
  after insert or update of organization_id, key or delete on public.erp_catalog_variants
  for each row execute function public.sync_erp_catalog_key_registry();

drop trigger if exists erp_catalog_variants_parent_sku on public.erp_catalog_variants;
create trigger erp_catalog_variants_parent_sku
  after insert or delete on public.erp_catalog_variants
  for each row execute function public.sync_erp_variant_parent_sku();

alter table public.erp_catalog_items
  drop constraint if exists erp_catalog_items_numeric_internal_key;
alter table public.erp_catalog_items
  add constraint erp_catalog_items_numeric_internal_key check (key ~ '^[0-9]+$') not valid;
alter table public.erp_catalog_items
  validate constraint erp_catalog_items_numeric_internal_key;

alter table public.erp_catalog_variants
  drop constraint if exists erp_catalog_variants_numeric_internal_key;
alter table public.erp_catalog_variants
  add constraint erp_catalog_variants_numeric_internal_key check (key ~ '^[0-9]+$') not valid;
alter table public.erp_catalog_variants
  validate constraint erp_catalog_variants_numeric_internal_key;
