alter table public.erp_product_media_assignments
  add column position integer,
  add column version bigint;

with ranked_assignments as (
  select id,
         row_number() over (
           partition by organization_id, catalog_item_id, variant_id
           order by created_at, id
         ) - 1 as position
  from public.erp_product_media_assignments
)
update public.erp_product_media_assignments assignments
   set position = ranked_assignments.position,
       version = 1
  from ranked_assignments
 where assignments.id = ranked_assignments.id;

alter table public.erp_product_media_assignments
  alter column position set default 0,
  alter column position set not null,
  alter column version set default 1,
  alter column version set not null,
  add column gallery_variant_scope uuid generated always as (
    coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) stored,
  add constraint erp_product_media_assignment_version_check
    check (version > 0),
  add constraint erp_product_media_assignment_position_check
    check (position >= 0),
  add constraint erp_product_media_assignment_variant_scope_check
    check (
      variant_id is null
      or variant_id <> '00000000-0000-0000-0000-000000000000'::uuid
    ),
  add constraint erp_product_media_gallery_position_key
    unique (organization_id, catalog_item_id, gallery_variant_scope, position)
    deferrable initially immediate;

create or replace function public.manage_erp_product_media_assignment_gallery()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_organization_id uuid;
  target_catalog_item_id uuid;
  target_variant_id uuid;
begin
  if tg_op = 'DELETE' then
    target_organization_id := old.organization_id;
    target_catalog_item_id := old.catalog_item_id;
    target_variant_id := old.variant_id;
  else
    target_organization_id := new.organization_id;
    target_catalog_item_id := new.catalog_item_id;
    target_variant_id := new.variant_id;
  end if;

  perform 1
    from public.erp_catalog_items
   where organization_id = target_organization_id
     and id = target_catalog_item_id
   for update;

  if not found and tg_op <> 'DELETE' then
    raise exception 'Product media assignment target does not exist'
      using errcode = '23503';
  end if;

  if target_variant_id is not null then
    perform 1
      from public.erp_catalog_variants
     where organization_id = target_organization_id
       and catalog_item_id = target_catalog_item_id
       and id = target_variant_id
     for update;

    if not found and tg_op <> 'DELETE' then
      raise exception 'Product media assignment variant does not exist'
        using errcode = '23503';
    end if;
  end if;

  if tg_op = 'INSERT' then
    select coalesce(max(position) + 1, 0)
      into new.position
      from public.erp_product_media_assignments
     where organization_id = new.organization_id
       and catalog_item_id = new.catalog_item_id
       and variant_id is not distinct from new.variant_id;
    new.version := 1;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id
       or new.organization_id is distinct from old.organization_id
       or new.asset_id is distinct from old.asset_id
       or new.catalog_item_id is distinct from old.catalog_item_id
       or new.variant_id is distinct from old.variant_id then
      raise exception 'Product media assignment identity is immutable'
        using errcode = '42501';
    end if;

    if new.alt_text is distinct from old.alt_text
       or new.position is distinct from old.position then
      new.version := old.version + 1;
      new.updated_at := now();
    else
      new.version := old.version;
      new.updated_at := old.updated_at;
    end if;
    return new;
  end if;

  return old;
end;
$$;

revoke all on function public.manage_erp_product_media_assignment_gallery()
  from public, anon, authenticated, service_role;

drop trigger if exists erp_product_media_assignment_gallery
  on public.erp_product_media_assignments;
create trigger erp_product_media_assignment_gallery
  before insert or update or delete
  on public.erp_product_media_assignments
  for each row execute function public.manage_erp_product_media_assignment_gallery();

revoke update on public.erp_product_media_assignments
  from public, anon, authenticated, service_role;
grant update (alt_text) on public.erp_product_media_assignments
  to authenticated, service_role;

create or replace function public.reorder_erp_product_media_assignments(
  target_organization_id uuid,
  target_catalog_item_id uuid,
  target_variant_id uuid,
  assignment_ids uuid[],
  expected_versions bigint[]
)
returns table (
  assignment_id uuid,
  assignment_position integer,
  assignment_version bigint
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_assignment_count integer;
begin
  if auth.uid() is null
     or not public.has_organization_permission(target_organization_id, 'catalog.write') then
    raise exception 'Catalog write permission is required to reorder product media'
      using errcode = '42501';
  end if;

  if not public.erp_product_writes_enabled(target_organization_id) then
    raise exception 'ERP Products writes are disabled by safety control'
      using errcode = '42501';
  end if;

  perform 1
    from public.erp_catalog_items
   where organization_id = target_organization_id
     and id = target_catalog_item_id
   for update;
  if not found then
    raise exception 'Product media gallery not found'
      using errcode = '40001';
  end if;

  if target_variant_id is not null then
    perform 1
      from public.erp_catalog_variants
     where organization_id = target_organization_id
       and catalog_item_id = target_catalog_item_id
       and id = target_variant_id
     for update;
    if not found then
      raise exception 'Product media gallery not found'
        using errcode = '40001';
    end if;
  end if;

  if assignment_ids is null
     or expected_versions is null
     or cardinality(assignment_ids) <> cardinality(expected_versions)
     or exists (
       select 1
         from unnest(assignment_ids) requested(id)
        where requested.id is null
     )
     or exists (
       select 1
         from unnest(expected_versions) requested(version)
        where requested.version is null
     )
     or exists (
       select 1
         from unnest(assignment_ids) requested(id)
        group by requested.id
       having count(*) > 1
     ) then
    raise exception 'MEDIA_ORDER_CONFLICT'
      using errcode = '40001';
  end if;

  select count(*)::integer
    into current_assignment_count
    from public.erp_product_media_assignments assignments
   where assignments.organization_id = target_organization_id
     and assignments.catalog_item_id = target_catalog_item_id
     and assignments.variant_id is not distinct from target_variant_id;

  if current_assignment_count <> cardinality(assignment_ids)
     or exists (
       select 1
         from unnest(assignment_ids, expected_versions)
           requested(id, version)
         left join public.erp_product_media_assignments assignments
           on assignments.id = requested.id
          and assignments.organization_id = target_organization_id
          and assignments.catalog_item_id = target_catalog_item_id
          and assignments.variant_id is not distinct from target_variant_id
        where assignments.id is null
           or assignments.version <> requested.version
     ) then
    raise exception 'MEDIA_ORDER_CONFLICT'
      using errcode = '40001';
  end if;

  set constraints erp_product_media_gallery_position_key deferred;

  update public.erp_product_media_assignments assignments
     set position = requested.ordinality - 1
    from unnest(assignment_ids) with ordinality requested(id, ordinality)
   where assignments.id = requested.id
     and assignments.organization_id = target_organization_id
     and assignments.catalog_item_id = target_catalog_item_id
     and assignments.variant_id is not distinct from target_variant_id;

  return query
    select assignments.id, assignments.position, assignments.version
      from public.erp_product_media_assignments assignments
     where assignments.organization_id = target_organization_id
       and assignments.catalog_item_id = target_catalog_item_id
       and assignments.variant_id is not distinct from target_variant_id
     order by assignments.position;
end;
$$;

revoke all on function public.reorder_erp_product_media_assignments(uuid, uuid, uuid, uuid[], bigint[])
  from public, anon;
grant execute on function public.reorder_erp_product_media_assignments(uuid, uuid, uuid, uuid[], bigint[])
  to authenticated;
