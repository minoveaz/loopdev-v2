insert into public.permissions (key, description, scope)
values
  ('supplier.read', 'View organization suppliers and supplier offers', 'organization'),
  ('supplier.manage', 'Create and manage organization suppliers and supplier offers', 'organization')
on conflict (key) do nothing;

insert into public.role_permissions (role, permission_key)
select role, permission_key
from (
  values
    ('owner', 'supplier.read'), ('admin', 'supplier.read'),
    ('agent', 'supplier.read'), ('viewer', 'supplier.read'),
    ('owner', 'supplier.manage'), ('admin', 'supplier.manage'),
    ('agent', 'supplier.manage')
) as grants(role, permission_key)
on conflict (role, permission_key) do nothing;

create table if not exists public.erp_suppliers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  kind text not null,
  legal_name text not null,
  country_code text not null,
  status text not null default 'active',
  version integer not null default 1,
  created_by uuid not null default auth.uid(),
  updated_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  check (kind in ('organization', 'individual')),
  check (status in ('active', 'on_hold', 'inactive')),
  check (length(trim(legal_name)) > 0),
  check (country_code ~ '^[A-Z]{2}$'),
  check (version > 0)
);

create table if not exists public.erp_supplier_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  supplier_id uuid not null,
  supplier_item_code text,
  name text not null,
  product_id uuid,
  variant_id uuid,
  purchase_unit text not null,
  units_per_stock_unit numeric(14, 6) not null,
  unit_price numeric(14, 2),
  currency text not null default 'EUR',
  minimum_quantity numeric(14, 3),
  lead_time_days integer,
  status text not null default 'draft',
  version integer not null default 1,
  created_by uuid not null default auth.uid(),
  updated_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (organization_id, supplier_id)
    references public.erp_suppliers(organization_id, id) on delete restrict
    deferrable initially deferred,
  foreign key (organization_id, product_id)
    references public.erp_catalog_items(organization_id, id) on delete restrict,
  foreign key (organization_id, variant_id)
    references public.erp_catalog_variants(organization_id, id) on delete restrict,
  check (length(trim(name)) > 0),
  check ((product_id is null) or (variant_id is null)),
  check (length(trim(purchase_unit)) > 0),
  check (units_per_stock_unit > 0),
  check (unit_price is null or unit_price >= 0),
  check (currency ~ '^[A-Z]{3}$'),
  check (minimum_quantity is null or minimum_quantity > 0),
  check (lead_time_days is null or lead_time_days >= 0),
  check (status in ('draft', 'active', 'inactive')),
  check (version > 0)
);

create unique index if not exists erp_supplier_items_code_unique
  on public.erp_supplier_items(organization_id, supplier_id, lower(trim(supplier_item_code)))
  where supplier_item_code is not null and length(trim(supplier_item_code)) > 0;

create table if not exists public.erp_supplier_audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  supplier_id uuid not null,
  record_type text not null,
  record_id uuid not null,
  action text not null,
  actor_id uuid not null default auth.uid(),
  changed_fields jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  foreign key (organization_id, supplier_id)
    references public.erp_suppliers(organization_id, id) on delete restrict
    deferrable initially deferred,
  check (record_type in ('supplier', 'supplier_item')),
  check (action in ('created', 'updated'))
);

create index if not exists erp_suppliers_org_status_name_idx
  on public.erp_suppliers(organization_id, status, legal_name);

create index if not exists erp_supplier_items_org_supplier_idx
  on public.erp_supplier_items(organization_id, supplier_id, status);

create index if not exists erp_supplier_audit_events_supplier_time_idx
  on public.erp_supplier_audit_events(organization_id, supplier_id, occurred_at desc);

create or replace function public.validate_erp_supplier_item_link()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  linked_organization_id uuid;
begin
  if new.product_id is not null then
    select organization_id into linked_organization_id
    from public.erp_catalog_items where id = new.product_id;
  elsif new.variant_id is not null then
    select organization_id into linked_organization_id
    from public.erp_catalog_variants where id = new.variant_id;
  end if;

  if linked_organization_id is not null and linked_organization_id <> new.organization_id then
    raise exception 'Supplier item links must stay within the same organization'
      using errcode = '23514';
  end if;

  new.updated_by := auth.uid();
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.audit_erp_supplier_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  supplier_record_id uuid;
  changes jsonb;
begin
  if tg_table_name = 'erp_suppliers' then
    supplier_record_id := new.id;
    if tg_op = 'INSERT' then
      changes := jsonb_build_object(
        'kind', new.kind, 'legal_name', new.legal_name,
        'country_code', new.country_code, 'status', new.status
      );
      insert into public.erp_supplier_audit_events
        (organization_id, supplier_id, record_type, record_id, action, actor_id, changed_fields)
      values
        (new.organization_id, supplier_record_id, 'supplier', new.id, 'created', auth.uid(), changes);
      return new;
    end if;
    new.version := old.version + 1;
    new.updated_by := auth.uid();
    new.updated_at := now();
    changes := jsonb_strip_nulls(jsonb_build_object(
      'kind', case when old.kind is distinct from new.kind then new.kind end,
      'legal_name', case when old.legal_name is distinct from new.legal_name then new.legal_name end,
      'country_code', case when old.country_code is distinct from new.country_code then new.country_code end,
      'status', case when old.status is distinct from new.status then new.status end
    ));
    insert into public.erp_supplier_audit_events
      (organization_id, supplier_id, record_type, record_id, action, actor_id, changed_fields)
    values
      (new.organization_id, supplier_record_id, 'supplier', new.id, 'updated', auth.uid(), changes);
    return new;
  end if;

  supplier_record_id := new.supplier_id;
  if tg_op = 'INSERT' then
    changes := jsonb_build_object(
      'supplier_item_code', new.supplier_item_code,
      'name', new.name,
      'product_id', new.product_id,
      'variant_id', new.variant_id,
      'purchase_unit', new.purchase_unit,
      'units_per_stock_unit', new.units_per_stock_unit,
      'unit_price', new.unit_price,
      'currency', new.currency,
      'minimum_quantity', new.minimum_quantity,
      'lead_time_days', new.lead_time_days,
      'status', new.status
    );
    insert into public.erp_supplier_audit_events
      (organization_id, supplier_id, record_type, record_id, action, actor_id, changed_fields)
    values
      (new.organization_id, supplier_record_id, 'supplier_item', new.id, 'created', auth.uid(), changes);
    return new;
  end if;
  new.version := old.version + 1;
  new.updated_by := auth.uid();
  new.updated_at := now();
  changes := '{}'::jsonb;
  if old.name is distinct from new.name then changes := changes || jsonb_build_object('name', jsonb_build_object('old', old.name, 'new', new.name)); end if;
  if old.supplier_item_code is distinct from new.supplier_item_code then changes := changes || jsonb_build_object('supplier_item_code', jsonb_build_object('old', old.supplier_item_code, 'new', new.supplier_item_code)); end if;
  if old.status is distinct from new.status then changes := changes || jsonb_build_object('status', jsonb_build_object('old', old.status, 'new', new.status)); end if;
  if old.product_id is distinct from new.product_id then changes := changes || jsonb_build_object('product_id', jsonb_build_object('old', old.product_id, 'new', new.product_id)); end if;
  if old.variant_id is distinct from new.variant_id then changes := changes || jsonb_build_object('variant_id', jsonb_build_object('old', old.variant_id, 'new', new.variant_id)); end if;
  if old.purchase_unit is distinct from new.purchase_unit then changes := changes || jsonb_build_object('purchase_unit', jsonb_build_object('old', old.purchase_unit, 'new', new.purchase_unit)); end if;
  if old.units_per_stock_unit is distinct from new.units_per_stock_unit then changes := changes || jsonb_build_object('units_per_stock_unit', jsonb_build_object('old', old.units_per_stock_unit, 'new', new.units_per_stock_unit)); end if;
  if old.unit_price is distinct from new.unit_price then changes := changes || jsonb_build_object('unit_price', jsonb_build_object('old', old.unit_price, 'new', new.unit_price)); end if;
  if old.currency is distinct from new.currency then changes := changes || jsonb_build_object('currency', jsonb_build_object('old', old.currency, 'new', new.currency)); end if;
  if old.minimum_quantity is distinct from new.minimum_quantity then changes := changes || jsonb_build_object('minimum_quantity', jsonb_build_object('old', old.minimum_quantity, 'new', new.minimum_quantity)); end if;
  if old.lead_time_days is distinct from new.lead_time_days then changes := changes || jsonb_build_object('lead_time_days', jsonb_build_object('old', old.lead_time_days, 'new', new.lead_time_days)); end if;
  insert into public.erp_supplier_audit_events
    (organization_id, supplier_id, record_type, record_id, action, actor_id, changed_fields)
  values
    (new.organization_id, supplier_record_id, 'supplier_item', new.id, 'updated', auth.uid(), changes);
  return new;
end;
$$;

create or replace function public.audit_erp_supplier_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'Supplier records cannot be hard deleted' using errcode = '23514';
end;
$$;

create or replace function public.validate_erp_supplier_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.organization_id <> old.organization_id then
    raise exception 'Supplier organization cannot change' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists erp_suppliers_audit on public.erp_suppliers;

create trigger erp_suppliers_audit
  before insert or update on public.erp_suppliers
  for each row execute function public.audit_erp_supplier_mutation();

drop trigger if exists erp_supplier_items_validate_link on public.erp_supplier_items;

create trigger erp_supplier_items_validate_link
  before insert or update on public.erp_supplier_items
  for each row execute function public.validate_erp_supplier_item_link();

drop trigger if exists erp_supplier_items_audit on public.erp_supplier_items;

create trigger erp_supplier_items_audit
  before insert or update on public.erp_supplier_items
  for each row execute function public.audit_erp_supplier_mutation();

drop trigger if exists erp_suppliers_no_delete on public.erp_suppliers;

create trigger erp_suppliers_no_delete
  before delete on public.erp_suppliers
  for each row execute function public.audit_erp_supplier_delete();

drop trigger if exists erp_supplier_items_no_delete on public.erp_supplier_items;

create trigger erp_supplier_items_no_delete
  before delete on public.erp_supplier_items
  for each row execute function public.audit_erp_supplier_delete();

drop trigger if exists erp_suppliers_immutable_org on public.erp_suppliers;

create trigger erp_suppliers_immutable_org
  before update of organization_id on public.erp_suppliers
  for each row execute function public.validate_erp_supplier_update();

alter table public.erp_suppliers enable row level security;

alter table public.erp_supplier_items enable row level security;

alter table public.erp_supplier_audit_events enable row level security;

grant select, insert, update on public.erp_suppliers to authenticated;

grant select, insert, update on public.erp_supplier_items to authenticated;

grant select on public.erp_supplier_audit_events to authenticated;

revoke delete on public.erp_suppliers from authenticated;

revoke delete on public.erp_supplier_items from authenticated;

revoke insert, update, delete on public.erp_supplier_audit_events from authenticated;

drop policy if exists erp_suppliers_read on public.erp_suppliers;

create policy erp_suppliers_read on public.erp_suppliers
  for select to authenticated
  using (public.has_organization_permission(organization_id, 'supplier.read'));

drop policy if exists erp_suppliers_manage on public.erp_suppliers;

create policy erp_suppliers_manage on public.erp_suppliers
  for insert to authenticated
  with check (public.has_organization_permission(organization_id, 'supplier.manage'));

drop policy if exists erp_suppliers_update on public.erp_suppliers;

create policy erp_suppliers_update on public.erp_suppliers
  for update to authenticated
  using (public.has_organization_permission(organization_id, 'supplier.manage'))
  with check (public.has_organization_permission(organization_id, 'supplier.manage'));

drop policy if exists erp_supplier_items_read on public.erp_supplier_items;

create policy erp_supplier_items_read on public.erp_supplier_items
  for select to authenticated
  using (public.has_organization_permission(organization_id, 'supplier.read'));

drop policy if exists erp_supplier_items_manage on public.erp_supplier_items;

create policy erp_supplier_items_manage on public.erp_supplier_items
  for insert to authenticated
  with check (public.has_organization_permission(organization_id, 'supplier.manage'));

drop policy if exists erp_supplier_items_update on public.erp_supplier_items;

create policy erp_supplier_items_update on public.erp_supplier_items
  for update to authenticated
  using (public.has_organization_permission(organization_id, 'supplier.manage'))
  with check (public.has_organization_permission(organization_id, 'supplier.manage'));

drop policy if exists erp_supplier_audit_events_read on public.erp_supplier_audit_events;

create policy erp_supplier_audit_events_read on public.erp_supplier_audit_events
  for select to authenticated
  using (public.has_organization_permission(organization_id, 'supplier.read'));

