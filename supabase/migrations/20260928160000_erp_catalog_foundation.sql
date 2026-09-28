-- ERP catalog foundation.
-- The catalog is isolated from the legacy catalog_products model so the UI
-- contract can evolve without changing CRM consumers.

insert into public.permissions (key, description, scope)
values
  ('catalog.read', 'View organization catalogs and commercial records', 'organization'),
  ('catalog.manage', 'Manage organization catalogs and commercial records', 'organization')
on conflict (key) do nothing;

insert into public.role_permissions (role, permission_key)
select role, permission_key
from (
  values
    ('owner', 'catalog.read'), ('owner', 'catalog.manage'),
    ('admin', 'catalog.read'), ('admin', 'catalog.manage'),
    ('agent', 'catalog.read'), ('agent', 'catalog.manage'),
    ('viewer', 'catalog.read')
) as grants(role, permission_key)
on conflict (role, permission_key) do nothing;

create table if not exists public.erp_catalogs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  workspace_id uuid,
  key text not null,
  name text not null,
  description text,
  kind text not null,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, workspace_id, key),
  check (kind in ('products', 'services')),
  check (status in ('draft', 'active', 'archived')),
  check (length(trim(key)) > 0),
  check (length(trim(name)) > 0)
);

create table if not exists public.erp_catalog_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  workspace_id uuid,
  catalog_id uuid not null references public.erp_catalogs(id) on delete cascade,
  key text not null,
  sku text not null default '',
  type text not null,
  name text not null,
  description text,
  category_key text,
  status text not null default 'draft',
  visibility jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, catalog_id, key),
  check (type in ('physical_product', 'service', 'subscription', 'coverage', 'package', 'digital_product', 'fee')),
  check (status in ('draft', 'active', 'archived')),
  check (length(trim(key)) > 0),
  check (length(trim(name)) > 0)
);

create table if not exists public.erp_catalog_offers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  workspace_id uuid,
  catalog_item_id uuid not null references public.erp_catalog_items(id) on delete cascade,
  key text not null,
  name text not null,
  status text not null default 'draft',
  billing_model text not null default 'one_time',
  currency text not null default 'EUR',
  unit text not null default 'Unit',
  valid_from timestamptz,
  valid_to timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, catalog_item_id, key),
  check (status in ('draft', 'active', 'archived')),
  check (billing_model in ('one_time', 'recurring', 'usage')),
  check (currency ~ '^[A-Z]{3}$')
);

create table if not exists public.erp_catalog_variants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  workspace_id uuid,
  catalog_item_id uuid not null references public.erp_catalog_items(id) on delete cascade,
  key text not null,
  sku text not null default '',
  name text not null,
  status text not null default 'draft',
  attributes jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, catalog_item_id, key),
  check (status in ('draft', 'active', 'archived'))
);

create table if not exists public.erp_price_books (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  workspace_id uuid,
  key text not null,
  name text not null,
  currency text not null default 'EUR',
  status text not null default 'draft',
  valid_from timestamptz,
  valid_to timestamptz,
  visibility jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, workspace_id, key),
  check (status in ('draft', 'active', 'archived')),
  check (currency ~ '^[A-Z]{3}$')
);

create table if not exists public.erp_price_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  workspace_id uuid,
  price_book_id uuid not null references public.erp_price_books(id) on delete cascade,
  catalog_item_id uuid references public.erp_catalog_items(id) on delete cascade,
  offer_id uuid references public.erp_catalog_offers(id) on delete cascade,
  variant_id uuid references public.erp_catalog_variants(id) on delete cascade,
  amount numeric(14,2) not null,
  currency text not null default 'EUR',
  unit text not null default 'Unit',
  status text not null default 'draft',
  min_quantity integer,
  max_quantity integer,
  valid_from timestamptz,
  valid_to timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (amount >= 0),
  check (status in ('draft', 'active', 'archived')),
  check (currency ~ '^[A-Z]{3}$'),
  check (min_quantity is null or min_quantity > 0),
  check (max_quantity is null or max_quantity >= coalesce(min_quantity, 1))
);

create index if not exists erp_catalogs_scope_idx on public.erp_catalogs(organization_id, status);
create index if not exists erp_catalog_items_scope_idx on public.erp_catalog_items(organization_id, catalog_id, status);
create index if not exists erp_catalog_offers_scope_idx on public.erp_catalog_offers(organization_id, catalog_item_id, status);
create index if not exists erp_catalog_variants_scope_idx on public.erp_catalog_variants(organization_id, catalog_item_id, status);
create index if not exists erp_price_books_scope_idx on public.erp_price_books(organization_id, status);
create index if not exists erp_price_entries_scope_idx on public.erp_price_entries(organization_id, price_book_id, status);

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'erp_catalogs', 'erp_catalog_items', 'erp_catalog_offers',
    'erp_catalog_variants', 'erp_price_books', 'erp_price_entries'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', table_name);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.has_organization_permission(organization_id, ''catalog.read'')) with check (public.has_organization_permission(organization_id, ''catalog.manage''))',
      table_name || '_organization_access', table_name
    );
  end loop;
end $$;
