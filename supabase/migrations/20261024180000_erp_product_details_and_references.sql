insert into public.permissions (key, description, scope)
values ('catalog.write', 'Create and update organization products and references', 'organization')
on conflict (key) do nothing;

insert into public.role_permissions (role, permission_key)
values
  ('owner', 'catalog.write'),
  ('admin', 'catalog.write'),
  ('agent', 'catalog.write')
on conflict (role, permission_key) do nothing;

create table if not exists public.erp_product_references (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  kind text not null,
  key text not null,
  name text not null,
  parent_id uuid,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  check (kind in ('category', 'brand', 'tag')),
  check (status in ('active', 'archived')),
  check (length(trim(key)) > 0),
  check (length(trim(name)) > 0),
  check (kind = 'category' or parent_id is null),
  foreign key (organization_id, parent_id)
    references public.erp_product_references(organization_id, id)
    on delete restrict
);

create unique index if not exists erp_product_references_org_kind_key_idx
  on public.erp_product_references(organization_id, kind, lower(key));
create index if not exists erp_product_references_org_kind_status_idx
  on public.erp_product_references(organization_id, kind, status);

create or replace function public.validate_erp_product_reference_parent()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.parent_id is not null and not exists (
    select 1
    from public.erp_product_references parent
    where parent.id = new.parent_id
      and parent.organization_id = new.organization_id
      and parent.kind = 'category'
      and parent.status = 'active'
  ) then
    raise exception 'Product category parent must be active and in the same organization';
  end if;
  return new;
end;
$$;

drop trigger if exists erp_product_references_validate_parent
  on public.erp_product_references;
create trigger erp_product_references_validate_parent
  before insert or update of organization_id, kind, parent_id, status
  on public.erp_product_references
  for each row execute function public.validate_erp_product_reference_parent();

create unique index if not exists erp_catalog_items_org_id_idx
  on public.erp_catalog_items(organization_id, id);
create unique index if not exists erp_catalog_variants_org_id_idx
  on public.erp_catalog_variants(organization_id, id);

create table if not exists public.erp_product_cost_references (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  catalog_item_id uuid not null,
  variant_id uuid,
  amount numeric(14, 2),
  currency text not null default 'EUR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (amount is null or amount >= 0),
  check (currency ~ '^[A-Z]{3}$'),
  foreign key (organization_id, catalog_item_id)
    references public.erp_catalog_items(organization_id, id)
    on delete restrict,
  foreign key (organization_id, variant_id)
    references public.erp_catalog_variants(organization_id, id)
    on delete restrict
);

create unique index if not exists erp_product_cost_references_item_idx
  on public.erp_product_cost_references(organization_id, catalog_item_id)
  where variant_id is null;
create unique index if not exists erp_product_cost_references_variant_idx
  on public.erp_product_cost_references(organization_id, catalog_item_id, variant_id)
  where variant_id is not null;

create or replace function public.validate_erp_product_cost_variant()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.variant_id is not null and not exists (
    select 1
    from public.erp_catalog_variants variant
    where variant.id = new.variant_id
      and variant.organization_id = new.organization_id
      and variant.catalog_item_id = new.catalog_item_id
  ) then
    raise exception 'Product cost SKU must belong to the specified product';
  end if;
  return new;
end;
$$;

drop trigger if exists erp_product_cost_references_validate_variant
  on public.erp_product_cost_references;
create trigger erp_product_cost_references_validate_variant
  before insert or update of organization_id, catalog_item_id, variant_id
  on public.erp_product_cost_references
  for each row execute function public.validate_erp_product_cost_variant();

alter table public.erp_product_references enable row level security;
alter table public.erp_product_cost_references enable row level security;

grant select, insert, update on public.erp_product_references to authenticated;
grant select, insert, update on public.erp_product_cost_references to authenticated;

drop policy if exists erp_product_references_read on public.erp_product_references;
create policy erp_product_references_read on public.erp_product_references
  for select to authenticated
  using (public.has_organization_permission(organization_id, 'catalog.read'));
drop policy if exists erp_product_references_manage on public.erp_product_references;
create policy erp_product_references_manage on public.erp_product_references
  for insert to authenticated
  with check (public.has_organization_permission(organization_id, 'catalog.write'));
drop policy if exists erp_product_references_update on public.erp_product_references;
create policy erp_product_references_update on public.erp_product_references
  for update to authenticated
  using (public.has_organization_permission(organization_id, 'catalog.write'))
  with check (public.has_organization_permission(organization_id, 'catalog.write'));

drop policy if exists erp_product_cost_references_read on public.erp_product_cost_references;
create policy erp_product_cost_references_read on public.erp_product_cost_references
  for select to authenticated
  using (public.has_organization_permission(organization_id, 'catalog.write'));
drop policy if exists erp_product_cost_references_insert on public.erp_product_cost_references;
create policy erp_product_cost_references_insert on public.erp_product_cost_references
  for insert to authenticated
  with check (public.has_organization_permission(organization_id, 'catalog.write'));
drop policy if exists erp_product_cost_references_update on public.erp_product_cost_references;
create policy erp_product_cost_references_update on public.erp_product_cost_references
  for update to authenticated
  using (public.has_organization_permission(organization_id, 'catalog.write'))
  with check (public.has_organization_permission(organization_id, 'catalog.write'));

revoke delete on public.erp_product_references from authenticated;
revoke delete on public.erp_product_cost_references from authenticated;
