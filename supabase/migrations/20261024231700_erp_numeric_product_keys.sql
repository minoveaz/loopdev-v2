create table if not exists public.erp_catalog_item_key_counters (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  last_value bigint not null default 0 check (last_value >= 0),
  updated_at timestamptz not null default now()
);

alter table public.erp_catalog_item_key_counters enable row level security;
revoke all on table public.erp_catalog_item_key_counters from anon, authenticated;

insert into public.erp_catalog_item_key_counters (organization_id, last_value)
select organization_id, max(key::bigint)
from public.erp_catalog_items
where key ~ '^[0-9]{1,18}$'
group by organization_id
on conflict (organization_id) do nothing;

create or replace function public.next_erp_catalog_item_key(target_organization_id uuid)
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

  insert into public.erp_catalog_item_key_counters (organization_id, last_value)
  select target_organization_id, coalesce(max(key::bigint), 0) + 1
  from public.erp_catalog_items
  where organization_id = target_organization_id
    and key ~ '^[0-9]{1,18}$'
  on conflict (organization_id)
  do update set
    last_value = greatest(public.erp_catalog_item_key_counters.last_value + 1, excluded.last_value),
    updated_at = now()
  returning last_value into allocated_value;

  return allocated_value::text;
end;
$$;

revoke all on function public.next_erp_catalog_item_key(uuid) from public, anon;
grant execute on function public.next_erp_catalog_item_key(uuid) to authenticated, service_role;

create or replace function public.assign_erp_catalog_item_key()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if tg_op = 'INSERT' then
    if new.metadata ->> 'itemKind' = 'product'
      or (
        new.metadata ->> 'itemKind' is distinct from 'service'
        and new.type <> 'service'
        and not exists (
          select 1
          from public.erp_catalogs catalog
          where catalog.id = new.catalog_id
            and catalog.organization_id = new.organization_id
            and catalog.kind = 'services'
        )
      ) then
      new.key := public.next_erp_catalog_item_key(new.organization_id);
    end if;
  elsif old.key ~ '^[0-9]+$' and new.key is distinct from old.key then
    raise exception using errcode = '23514', message = 'Product keys are immutable.';
  end if;

  return new;
end;
$$;

drop trigger if exists erp_catalog_items_numeric_key on public.erp_catalog_items;
create trigger erp_catalog_items_numeric_key
  before insert or update of key on public.erp_catalog_items
  for each row execute function public.assign_erp_catalog_item_key();
