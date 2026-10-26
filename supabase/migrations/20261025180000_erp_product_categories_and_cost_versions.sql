alter table public.erp_product_references
  add column if not exists version bigint not null default 1;

alter table public.erp_product_cost_references
  add column if not exists version bigint not null default 1;

alter table public.erp_product_references
  add constraint erp_product_references_version_check check (version > 0);

alter table public.erp_product_cost_references
  add constraint erp_product_cost_references_version_check check (version > 0);

create or replace function public.manage_erp_product_reference_lifecycle()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  base_key text;
  candidate_key text;
  key_suffix integer := 1;
  ancestor_id uuid;
  visited_ids uuid[] := '{}';
begin
  if tg_op = 'INSERT' then
    if new.kind = 'category' then
      base_key := trim(both '-' from regexp_replace(lower(trim(new.name)), '[^a-z0-9]+', '-', 'g'));
      if base_key = '' then
        base_key := 'category';
      end if;
      candidate_key := base_key;
      while exists (
        select 1
          from public.erp_product_references reference
         where reference.organization_id = new.organization_id
           and reference.kind = new.kind
           and lower(reference.key) = lower(candidate_key)
      ) loop
        key_suffix := key_suffix + 1;
        candidate_key := base_key || '-' || key_suffix::text;
      end loop;
      new.key := candidate_key;
    end if;
    if new.kind = 'category' and new.parent_id is not null and not exists (
      select 1
        from public.erp_product_references parent
       where parent.id = new.parent_id
         and parent.organization_id = new.organization_id
         and parent.kind = 'category'
         and parent.status = 'active'
    ) then
      raise exception 'Product category parent must be active and in the same organization'
        using errcode = '23503';
    end if;
    new.version := 1;
  else
    if new.id is distinct from old.id
       or new.organization_id is distinct from old.organization_id
       or new.kind is distinct from old.kind
       or new.key is distinct from old.key then
      raise exception 'Product reference identity and key are immutable'
        using errcode = '42501';
    end if;

    if new.kind = 'category' and new.parent_id is not null then
      select parent.id
        into ancestor_id
        from public.erp_product_references parent
       where parent.id = new.parent_id
         and parent.organization_id = new.organization_id
         and parent.kind = 'category'
         and parent.status = 'active';
      if not found then
        raise exception 'Product category parent must be active and in the same organization'
          using errcode = '23503';
      end if;

      while ancestor_id is not null loop
        if ancestor_id = new.id or ancestor_id = any(visited_ids) then
          raise exception 'Product category hierarchy cannot contain a cycle'
            using errcode = '23514';
        end if;
        visited_ids := array_append(visited_ids, ancestor_id);
        select parent.parent_id
          into ancestor_id
          from public.erp_product_references parent
         where parent.id = ancestor_id
           and parent.organization_id = new.organization_id;
      end loop;
    end if;

    if new.kind = 'category' and new.status = 'archived' and old.status <> 'archived' then
      if exists (
        select 1
          from public.erp_product_references child
         where child.organization_id = old.organization_id
           and child.kind = 'category'
           and child.parent_id = old.id
           and child.status = 'active'
      ) or exists (
        select 1
          from public.erp_catalog_items item
         where item.organization_id = old.organization_id
           and item.status = 'active'
           and item.category_key = old.key
      ) or exists (
        select 1
          from public.erp_catalog_variants variant
         where variant.organization_id = old.organization_id
           and variant.status = 'active'
           and variant.metadata ->> 'categoryKey' = old.key
      ) then
        raise exception 'Move active child categories and assignments before archiving this category'
          using errcode = '23514';
      end if;
    end if;

    if new.name is distinct from old.name
       or new.parent_id is distinct from old.parent_id
       or new.status is distinct from old.status then
      new.version := old.version + 1;
      new.updated_at := now();
    else
      new.version := old.version;
      new.updated_at := old.updated_at;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists erp_product_references_validate_parent
  on public.erp_product_references;
drop trigger if exists erp_product_reference_lifecycle
  on public.erp_product_references;
create trigger erp_product_reference_lifecycle
  before insert or update
  on public.erp_product_references
  for each row execute function public.manage_erp_product_reference_lifecycle();

create or replace function public.validate_erp_catalog_item_category()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.category_key is not null
     and (tg_op = 'INSERT' or new.category_key is distinct from old.category_key or new.status = 'active' and old.status is distinct from 'active')
     and not exists (
       select 1
         from public.erp_product_references category
        where category.organization_id = new.organization_id
          and category.kind = 'category'
          and category.key = new.category_key
          and category.status = 'active'
     ) then
    raise exception 'Product category must be active and in the same organization'
      using errcode = '23503';
  end if;
  return new;
end;
$$;

drop trigger if exists erp_catalog_items_validate_category
  on public.erp_catalog_items;
create trigger erp_catalog_items_validate_category
  before insert or update of category_key, status
  on public.erp_catalog_items
  for each row execute function public.validate_erp_catalog_item_category();

create or replace function public.validate_erp_catalog_variant_category()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  category_key text;
begin
  category_key := new.metadata ->> 'categoryKey';
  if category_key is not null
     and (tg_op = 'INSERT' or category_key is distinct from old.metadata ->> 'categoryKey' or new.status = 'active' and old.status is distinct from 'active')
     and not exists (
       select 1
         from public.erp_product_references category
        where category.organization_id = new.organization_id
          and category.kind = 'category'
          and category.key = category_key
          and category.status = 'active'
     ) then
    raise exception 'SKU category must be active and in the same organization'
      using errcode = '23503';
  end if;
  return new;
end;
$$;

drop trigger if exists erp_catalog_variants_validate_category
  on public.erp_catalog_variants;
create trigger erp_catalog_variants_validate_category
  before insert or update of metadata, status
  on public.erp_catalog_variants
  for each row execute function public.validate_erp_catalog_variant_category();

create or replace function public.manage_erp_product_cost_version()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    new.version := 1;
  else
    if new.id is distinct from old.id
       or new.organization_id is distinct from old.organization_id
       or new.catalog_item_id is distinct from old.catalog_item_id
       or new.variant_id is distinct from old.variant_id then
      raise exception 'Product cost scope is immutable'
        using errcode = '42501';
    end if;
    if new.amount is distinct from old.amount or new.currency is distinct from old.currency then
      new.version := old.version + 1;
      new.updated_at := now();
    else
      new.version := old.version;
      new.updated_at := old.updated_at;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists erp_product_cost_references_version
  on public.erp_product_cost_references;
create trigger erp_product_cost_references_version
  before insert or update
  on public.erp_product_cost_references
  for each row execute function public.manage_erp_product_cost_version();

revoke execute on function public.manage_erp_product_reference_lifecycle()
  from public, anon, authenticated, service_role;
revoke execute on function public.validate_erp_catalog_item_category()
  from public, anon, authenticated, service_role;
revoke execute on function public.validate_erp_catalog_variant_category()
  from public, anon, authenticated, service_role;
revoke execute on function public.manage_erp_product_cost_version()
  from public, anon, authenticated, service_role;

create table if not exists public.erp_product_cost_mutations (
  organization_id uuid not null references public.organizations(id) on delete restrict,
  idempotency_key text not null check (idempotency_key ~ '^[A-Za-z0-9._:-]{8,128}$'),
  fingerprint text not null,
  result_snapshot jsonb,
  created_at timestamptz not null default now(),
  primary key (organization_id, idempotency_key)
);

alter table public.erp_product_cost_mutations enable row level security;
revoke all on public.erp_product_cost_mutations from public, anon, authenticated, service_role;

create or replace function public.save_erp_product_cost_reference(
  target_organization_id uuid,
  target_catalog_item_id uuid,
  target_variant_id uuid,
  target_amount numeric,
  target_currency text,
  target_expected_version bigint,
  target_idempotency_key text
)
returns public.erp_product_cost_references
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  operation_fingerprint text;
  prior_operation public.erp_product_cost_mutations%rowtype;
  current_cost public.erp_product_cost_references%rowtype;
  saved_cost public.erp_product_cost_references%rowtype;
begin
  if auth.uid() is null
     or not public.has_organization_permission(target_organization_id, 'catalog.cost.manage') then
    raise exception 'Purchase cost management is not permitted'
      using errcode = '42501';
  end if;
  if not public.erp_product_writes_enabled(target_organization_id) then
    raise exception 'ERP_PRODUCT_WRITES_DISABLED'
      using errcode = '55000';
  end if;
  if target_expected_version is null or target_expected_version < 0
     or target_idempotency_key is null
     or target_idempotency_key !~ '^[A-Za-z0-9._:-]{8,128}$'
     or target_currency is null
     or target_currency !~ '^[A-Z]{3}$'
     or target_amount is not null and (
       target_amount < 0
       or target_amount <> round(target_amount, 2)
       or target_amount >= 1000000000000
     ) then
    raise exception 'Invalid purchase cost mutation'
      using errcode = '22023';
  end if;
  if not exists (
    select 1
      from public.erp_catalog_items item
     where item.id = target_catalog_item_id
       and item.organization_id = target_organization_id
  ) then
    raise exception 'Product cost scope is invalid'
      using errcode = '23503';
  end if;
  if target_variant_id is not null and not exists (
    select 1
      from public.erp_catalog_variants variant
     where variant.id = target_variant_id
       and variant.catalog_item_id = target_catalog_item_id
       and variant.organization_id = target_organization_id
  ) then
    raise exception 'Product cost SKU scope is invalid'
      using errcode = '23503';
  end if;

  operation_fingerprint := jsonb_build_array(
    target_catalog_item_id,
    target_variant_id,
    target_amount,
    target_currency,
    target_expected_version
  )::text;
  insert into public.erp_product_cost_mutations (
    organization_id, idempotency_key, fingerprint
  ) values (
    target_organization_id, target_idempotency_key, operation_fingerprint
  )
  on conflict (organization_id, idempotency_key) do nothing;

  if not found then
    select *
      into prior_operation
      from public.erp_product_cost_mutations mutation
     where mutation.organization_id = target_organization_id
       and mutation.idempotency_key = target_idempotency_key;
    if prior_operation.fingerprint <> operation_fingerprint then
      raise exception 'PRODUCT_COST_CONFLICT'
        using errcode = '40001';
    end if;
    if prior_operation.result_snapshot is null then
      raise exception 'Purchase cost operation result is unavailable'
        using errcode = '55000';
    end if;
    return jsonb_populate_record(null::public.erp_product_cost_references, prior_operation.result_snapshot);
  end if;

  if target_variant_id is null then
    select *
      into current_cost
      from public.erp_product_cost_references cost
     where cost.organization_id = target_organization_id
       and cost.catalog_item_id = target_catalog_item_id
       and cost.variant_id is null
     for update;
  else
    select *
      into current_cost
      from public.erp_product_cost_references cost
     where cost.organization_id = target_organization_id
       and cost.catalog_item_id = target_catalog_item_id
       and cost.variant_id = target_variant_id
     for update;
  end if;

  if coalesce(current_cost.version, 0) <> target_expected_version then
    raise exception 'PRODUCT_COST_CONFLICT'
      using errcode = '40001';
  end if;

  begin
    if current_cost.id is null then
      insert into public.erp_product_cost_references (
        organization_id, catalog_item_id, variant_id, amount, currency
      ) values (
        target_organization_id, target_catalog_item_id, target_variant_id, target_amount, target_currency
      )
      returning * into saved_cost;
    else
      update public.erp_product_cost_references
         set amount = target_amount,
             currency = target_currency
       where id = current_cost.id
         and organization_id = target_organization_id
         and version = target_expected_version
      returning * into saved_cost;
      if not found then
        raise exception 'PRODUCT_COST_CONFLICT'
          using errcode = '40001';
      end if;
    end if;
  exception when unique_violation then
    raise exception 'PRODUCT_COST_CONFLICT'
      using errcode = '40001';
  end;

  update public.erp_product_cost_mutations
     set result_snapshot = to_jsonb(saved_cost)
   where organization_id = target_organization_id
     and idempotency_key = target_idempotency_key;
  return saved_cost;
end;
$$;

revoke all on function public.save_erp_product_cost_reference(uuid, uuid, uuid, numeric, text, bigint, text)
  from public, anon;
grant execute on function public.save_erp_product_cost_reference(uuid, uuid, uuid, numeric, text, bigint, text)
  to authenticated;
