create table if not exists public.crm_quotes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  opportunity_id uuid not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  currency text not null default 'EUR',
  subtotal numeric(14,2) not null default 0 check (subtotal >= 0),
  total numeric(14,2) not null default 0 check (total >= 0),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (opportunity_id, organization_id) references public.crm_opportunities(id, organization_id) on delete cascade
);

create table if not exists public.crm_quote_lines (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.crm_quotes(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  catalog_item_id uuid,
  product_key text,
  label text not null,
  quantity numeric(12,2) not null check (quantity > 0),
  unit_amount numeric(14,2) not null check (unit_amount >= 0),
  total_amount numeric(14,2) generated always as (quantity * unit_amount) stored,
  currency text not null default 'EUR'
);

alter table public.crm_quotes enable row level security;
alter table public.crm_quote_lines enable row level security;

drop policy if exists crm_quotes_read on public.crm_quotes;
create policy crm_quotes_read on public.crm_quotes for select to authenticated using (public.has_organization_permission(organization_id, 'crm.read'));
drop policy if exists crm_quotes_write on public.crm_quotes;
create policy crm_quotes_write on public.crm_quotes for all to authenticated using (public.has_organization_permission(organization_id, 'crm.manage')) with check (public.has_organization_permission(organization_id, 'crm.manage'));
drop policy if exists crm_quote_lines_read on public.crm_quote_lines;
create policy crm_quote_lines_read on public.crm_quote_lines for select to authenticated using (public.has_organization_permission(organization_id, 'crm.read'));
drop policy if exists crm_quote_lines_write on public.crm_quote_lines;
create policy crm_quote_lines_write on public.crm_quote_lines for all to authenticated using (public.has_organization_permission(organization_id, 'crm.manage')) with check (public.has_organization_permission(organization_id, 'crm.manage'));