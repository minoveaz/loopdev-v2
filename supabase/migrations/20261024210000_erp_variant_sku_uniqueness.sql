do $$
begin
  if exists (
    with all_skus as (
      select organization_id, lower(btrim(sku)) as normalized_sku
      from public.erp_catalog_items
      where btrim(sku) <> ''
      union all
      select organization_id, lower(btrim(sku)) as normalized_sku
      from public.erp_catalog_variants
      where btrim(sku) <> ''
    )
    select 1
    from all_skus
    group by organization_id, normalized_sku
    having count(*) > 1
  ) then
    raise exception using
      errcode = '23505',
      message = 'Duplicate product or variant SKUs must be resolved before applying SKU uniqueness.';
  end if;
end;
$$;

create table if not exists public.erp_catalog_sku_registry (
  organization_id uuid not null references public.organizations(id) on delete restrict,
  normalized_sku text not null,
  entity_type text not null check (entity_type in ('product', 'variant')),
  entity_id uuid not null,
  primary key (organization_id, normalized_sku),
  unique (entity_type, entity_id)
);

alter table public.erp_catalog_sku_registry enable row level security;
revoke all on table public.erp_catalog_sku_registry from anon, authenticated;

insert into public.erp_catalog_sku_registry (organization_id, normalized_sku, entity_type, entity_id)
select organization_id, lower(btrim(sku)), entity_type, id
from (
  select organization_id, sku, 'product'::text as entity_type, id
  from public.erp_catalog_items
  union all
  select organization_id, sku, 'variant'::text as entity_type, id
  from public.erp_catalog_variants
) records
where btrim(sku) <> '';

create or replace function public.sync_erp_catalog_sku_registry()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_organization_id uuid;
  target_entity_id uuid;
  target_entity_type text := case when tg_table_name = 'erp_catalog_items' then 'product' else 'variant' end;
  normalized_sku text;
begin
  if tg_op = 'DELETE' then
    delete from public.erp_catalog_sku_registry
    where organization_id = old.organization_id
      and entity_type = target_entity_type
      and entity_id = old.id;
    return old;
  end if;

  if tg_op = 'UPDATE' then
    delete from public.erp_catalog_sku_registry
    where organization_id = old.organization_id
      and entity_type = target_entity_type
      and entity_id = old.id;
  end if;

  target_organization_id := new.organization_id;
  target_entity_id := new.id;
  normalized_sku := lower(btrim(new.sku));
  if normalized_sku <> '' then
    begin
      insert into public.erp_catalog_sku_registry (organization_id, normalized_sku, entity_type, entity_id)
      values (target_organization_id, normalized_sku, target_entity_type, target_entity_id);
    exception when unique_violation then
      raise exception using errcode = '23505', message = 'SKU already exists in this organization.';
    end;
  end if;
  return new;
end;
$$;

drop trigger if exists erp_catalog_items_sku_uniqueness on public.erp_catalog_items;
create trigger erp_catalog_items_sku_uniqueness
  before insert or update of organization_id, sku or delete on public.erp_catalog_items
  for each row execute function public.sync_erp_catalog_sku_registry();

drop trigger if exists erp_catalog_variants_sku_uniqueness on public.erp_catalog_variants;
create trigger erp_catalog_variants_sku_uniqueness
  before insert or update of organization_id, sku or delete on public.erp_catalog_variants
  for each row execute function public.sync_erp_catalog_sku_registry();
