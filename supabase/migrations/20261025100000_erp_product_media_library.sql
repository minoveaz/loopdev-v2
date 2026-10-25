create unique index if not exists platform_files_organization_id_id_idx
  on public.platform_files(organization_id, id);

create unique index if not exists erp_catalog_variants_org_item_id_idx
  on public.erp_catalog_variants(organization_id, catalog_item_id, id);

create table if not exists public.erp_product_media_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  file_id uuid not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, file_id),
  check (cardinality(tags) <= 20),
  foreign key (organization_id, file_id)
    references public.platform_files(organization_id, id)
    on delete cascade
);

create table if not exists public.erp_product_media_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  asset_id uuid not null,
  catalog_item_id uuid not null,
  variant_id uuid,
  alt_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(alt_text) <= 512),
  foreign key (organization_id, asset_id)
    references public.erp_product_media_assets(organization_id, id)
    on delete cascade,
  foreign key (organization_id, catalog_item_id)
    references public.erp_catalog_items(organization_id, id)
    on delete cascade,
  foreign key (organization_id, catalog_item_id, variant_id)
    references public.erp_catalog_variants(organization_id, catalog_item_id, id)
    on delete cascade
);

create or replace function public.validate_erp_product_media_asset()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  file_media_type text;
  file_relation_type text;
  file_storage_path text;
begin
  select media_type, relation_type, storage_path
    into file_media_type, file_relation_type, file_storage_path
  from public.platform_files
  where organization_id = new.organization_id
    and id = new.file_id
    and status = 'active';

  if not found
     or file_media_type not in ('image/jpeg', 'image/png', 'image/webp')
     or file_relation_type <> 'product_media_library'
     or file_storage_path is null then
    raise exception 'Product media assets must reference an active organization image file';
  end if;
  return new;
end;
$$;

drop trigger if exists erp_product_media_assets_validate_file
  on public.erp_product_media_assets;
create trigger erp_product_media_assets_validate_file
  before insert or update of organization_id, file_id
  on public.erp_product_media_assets
  for each row execute function public.validate_erp_product_media_asset();

create unique index if not exists erp_product_media_assignments_product_idx
  on public.erp_product_media_assignments(organization_id, asset_id, catalog_item_id)
  where variant_id is null;
create unique index if not exists erp_product_media_assignments_variant_idx
  on public.erp_product_media_assignments(organization_id, asset_id, catalog_item_id, variant_id)
  where variant_id is not null;
create index if not exists erp_product_media_assignments_item_idx
  on public.erp_product_media_assignments(organization_id, catalog_item_id, variant_id);

alter table public.erp_product_media_assets enable row level security;
alter table public.erp_product_media_assignments enable row level security;

grant select, insert, update, delete on public.erp_product_media_assets to authenticated;
grant select, insert, update, delete on public.erp_product_media_assignments to authenticated;

drop policy if exists erp_product_media_assets_read on public.erp_product_media_assets;
create policy erp_product_media_assets_read on public.erp_product_media_assets
  for select to authenticated
  using (public.has_organization_permission(organization_id, 'catalog.read'));
drop policy if exists erp_product_media_assets_write on public.erp_product_media_assets;
create policy erp_product_media_assets_write on public.erp_product_media_assets
  for all to authenticated
  using (public.has_organization_permission(organization_id, 'catalog.write'))
  with check (public.has_organization_permission(organization_id, 'catalog.write'));

drop policy if exists erp_product_media_assignments_read on public.erp_product_media_assignments;
create policy erp_product_media_assignments_read on public.erp_product_media_assignments
  for select to authenticated
  using (public.has_organization_permission(organization_id, 'catalog.read'));
drop policy if exists erp_product_media_assignments_write on public.erp_product_media_assignments;
create policy erp_product_media_assignments_write on public.erp_product_media_assignments
  for all to authenticated
  using (public.has_organization_permission(organization_id, 'catalog.write'))
  with check (public.has_organization_permission(organization_id, 'catalog.write'));

create or replace function public.validate_erp_product_media_file_permission()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.relation_type = 'product_media_library' then
    if new.organization_id is null
       or new.relation_id <> new.organization_id::text
       or not public.has_organization_permission(new.organization_id, 'catalog.write') then
      raise exception 'Catalog write permission is required to manage product media';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists platform_files_product_media_permission
  on public.platform_files;
create trigger platform_files_product_media_permission
  before insert or update of organization_id, relation_type, relation_id
  on public.platform_files
  for each row execute function public.validate_erp_product_media_file_permission();

do $product_media_storage_policies$
begin
  if to_regclass('storage.objects') is not null then
    drop policy if exists platform_files_storage_select on storage.objects;
    create policy platform_files_storage_select
      on storage.objects for select to authenticated
      using (
        bucket_id = 'platform-files'
        and split_part(name, '/', 2)::uuid in (
          select organization_id from public.organization_memberships
          where user_id = auth.uid() and status = 'active'
        )
        and (
          split_part(name, '/', 3) <> 'product-media'
          or public.has_organization_permission(split_part(name, '/', 2)::uuid, 'catalog.read')
        )
      );

    drop policy if exists platform_files_storage_insert on storage.objects;
    create policy platform_files_storage_insert
      on storage.objects for insert to authenticated
      with check (
        bucket_id = 'platform-files'
        and split_part(name, '/', 2)::uuid in (
          select organization_id from public.organization_memberships
          where user_id = auth.uid() and status = 'active'
        )
        and (
          split_part(name, '/', 3) <> 'product-media'
          or public.has_organization_permission(split_part(name, '/', 2)::uuid, 'catalog.write')
        )
      );

    drop policy if exists platform_files_storage_update on storage.objects;
    create policy platform_files_storage_update
      on storage.objects for update to authenticated
      using (
        bucket_id = 'platform-files'
        and split_part(name, '/', 2)::uuid in (
          select organization_id from public.organization_memberships
          where user_id = auth.uid() and status = 'active'
        )
        and (
          split_part(name, '/', 3) <> 'product-media'
          or public.has_organization_permission(split_part(name, '/', 2)::uuid, 'catalog.write')
        )
      )
      with check (
        bucket_id = 'platform-files'
        and split_part(name, '/', 2)::uuid in (
          select organization_id from public.organization_memberships
          where user_id = auth.uid() and status = 'active'
        )
        and (
          split_part(name, '/', 3) <> 'product-media'
          or public.has_organization_permission(split_part(name, '/', 2)::uuid, 'catalog.write')
        )
      );

    drop policy if exists platform_files_storage_delete on storage.objects;
    create policy platform_files_storage_delete
      on storage.objects for delete to authenticated
      using (
        bucket_id = 'platform-files'
        and split_part(name, '/', 2)::uuid in (
          select organization_id from public.organization_memberships
          where user_id = auth.uid() and status = 'active'
        )
        and (
          split_part(name, '/', 3) <> 'product-media'
          or public.has_organization_permission(split_part(name, '/', 2)::uuid, 'catalog.write')
        )
      );
  end if;
end;
$product_media_storage_policies$;
