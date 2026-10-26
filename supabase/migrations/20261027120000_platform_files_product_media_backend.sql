alter table public.platform_file_upload_sessions
  add column if not exists purpose text not null default 'general',
  add column if not exists resource_entity_type text,
  add column if not exists resource_entity_id uuid,
  add column if not exists idempotency_key text,
  add column if not exists idempotency_fingerprint text;

alter table public.platform_file_upload_sessions
  add constraint platform_file_upload_sessions_purpose_check
    check (purpose in ('general', 'product_media')),
  add constraint platform_file_upload_sessions_product_media_scope_check
    check (
      purpose <> 'product_media'
      or (
        created_by is not null
        and owner_user_id is null
        and resource_entity_type = 'catalog_item'
        and resource_entity_id is not null
        and idempotency_key ~ '^[0-9a-f]{64}$'
        and idempotency_fingerprint is not null
        and mime_type in ('image/jpeg', 'image/png', 'image/webp')
        and byte_size between 1 and 26214400
      )
    );

create unique index if not exists platform_file_product_media_idempotency_idx
  on public.platform_file_upload_sessions (organization_id, idempotency_key)
  where purpose = 'product_media';

create table if not exists public.platform_file_renditions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  file_id uuid not null,
  rendition text not null check (rendition in ('large', 'thumbnail')),
  media_type text not null check (media_type = 'image/webp'),
  byte_size bigint not null check (byte_size between 1 and 26214400),
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  storage_path text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, file_id, rendition),
  foreign key (organization_id, file_id)
    references public.platform_files(organization_id, id)
    on delete cascade,
  check (
    (rendition = 'large' and greatest(width, height) <= 1600)
    or (rendition = 'thumbnail' and greatest(width, height) <= 400)
  )
);

alter table public.platform_file_renditions enable row level security;
grant select on public.platform_file_renditions to authenticated;
revoke insert, update, delete, truncate on public.platform_file_renditions from public, anon, authenticated;
grant select on public.platform_file_renditions to service_role;
grant select, insert on public.platform_files to service_role;
grant select, update on public.platform_file_upload_sessions to service_role;

drop policy if exists platform_file_renditions_read on public.platform_file_renditions;
create policy platform_file_renditions_read on public.platform_file_renditions
  for select to authenticated
  using (public.has_organization_permission(organization_id, 'catalog.read'));

create or replace function public.validate_erp_product_media_file_permission()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.relation_type = 'product_media_library' then
    if new.organization_id is null
       or new.relation_id <> new.organization_id::text
       or coalesce(auth.role(), '') <> 'service_role' then
      raise exception 'Product media files must be finalized through Platform Files'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.enforce_platform_product_media_session_owner()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (
    (tg_op <> 'DELETE' and new.purpose = 'product_media')
    or (tg_op <> 'INSERT' and old.purpose = 'product_media')
  ) and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Product media upload sessions must be managed through Platform Files'
      using errcode = '42501';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists platform_product_media_session_owner
  on public.platform_file_upload_sessions;
create trigger platform_product_media_session_owner
  before insert or update or delete on public.platform_file_upload_sessions
  for each row execute function public.enforce_platform_product_media_session_owner();

do $platform_product_media_storage_upload_policy$
begin
  if to_regclass('storage.objects') is not null then
    drop policy if exists platform_files_storage_insert on storage.objects;
    create policy platform_files_storage_insert
      on storage.objects for insert to authenticated
      with check (
        bucket_id = 'platform-files'
        and (
          (
            split_part(name, '/', 3) = 'product-media'
            and public.has_organization_permission(split_part(name, '/', 2)::uuid, 'catalog.write')
            and public.erp_product_writes_enabled(split_part(name, '/', 2)::uuid)
            and exists (
              select 1
              from public.platform_file_upload_sessions upload_session
              where upload_session.organization_id = split_part(name, '/', 2)::uuid
                and upload_session.storage_path = name
                and upload_session.purpose = 'product_media'
                and upload_session.status = 'pending'
                and upload_session.created_by = auth.uid()
            )
          )
          or (
            split_part(name, '/', 3) <> 'product-media'
            and (
              public.has_organization_role(
                public.platform_file_organization_id(name),
                array['owner', 'admin', 'agent']
              )
              or (
                public.platform_file_user_id(name) = auth.uid()
                and exists (
                  select 1
                  from public.platform_file_upload_sessions upload_session
                  where upload_session.owner_user_id = auth.uid()
                    and upload_session.storage_path = name
                    and upload_session.status = 'pending'
                    and upload_session.mime_type in ('image/jpeg', 'image/png', 'image/webp')
                    and upload_session.byte_size between 1 and 5242880
                )
              )
            )
          )
        )
      );

    drop policy if exists platform_files_storage_update on storage.objects;
    create policy platform_files_storage_update
      on storage.objects for update to authenticated
      using (
        bucket_id = 'platform-files'
        and split_part(name, '/', 3) <> 'product-media'
        and (
          public.has_organization_role(
            public.platform_file_organization_id(name),
            array['owner', 'admin', 'agent']
          )
          or public.platform_file_user_id(name) = auth.uid()
        )
      )
      with check (
        bucket_id = 'platform-files'
        and split_part(name, '/', 3) <> 'product-media'
        and (
          public.has_organization_role(
            public.platform_file_organization_id(name),
            array['owner', 'admin', 'agent']
          )
          or public.platform_file_user_id(name) = auth.uid()
        )
      );
  end if;
end;
$platform_product_media_storage_upload_policy$;

create or replace function public.begin_platform_product_media_upload(
  target_organization_id uuid,
  target_actor_id uuid,
  target_product_id uuid,
  target_file_name text,
  target_mime_type text,
  target_byte_size bigint,
  target_checksum text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  upload_id uuid;
  file_extension text;
  upload_path text;
  request_fingerprint text;
  upload_session public.platform_file_upload_sessions%rowtype;
begin
  if target_organization_id is null
     or target_actor_id is null
     or target_product_id is null
     or target_file_name is null
     or length(btrim(target_file_name)) not between 1 and 255
     or target_file_name ~ '[[:cntrl:]]'
     or target_mime_type is null
     or target_mime_type not in ('image/jpeg', 'image/png', 'image/webp')
     or target_byte_size is null
     or target_byte_size not between 1 and 26214400
     or target_checksum is null
     or target_checksum !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid product media upload metadata'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.organization_memberships membership
    join public.role_permissions permission
      on permission.role = membership.role
     and permission.permission_key = 'catalog.write'
    where membership.organization_id = target_organization_id
      and membership.user_id = target_actor_id
      and membership.status = 'active'
  ) then
    raise exception 'Catalog write permission is required'
      using errcode = '42501';
  end if;

  if not public.erp_product_writes_enabled(target_organization_id) then
    raise exception 'ERP Products writes are disabled by safety control'
      using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.erp_catalog_items item
    where item.organization_id = target_organization_id
      and item.id = target_product_id
  ) then
    raise exception 'Product not found in this organization'
      using errcode = '42501';
  end if;

  file_extension := case target_mime_type
    when 'image/jpeg' then 'jpg'
    when 'image/png' then 'png'
    else 'webp'
  end;
  request_fingerprint := jsonb_build_object(
    'productId', target_product_id,
    'fileName', btrim(target_file_name),
    'mimeType', target_mime_type,
    'byteSize', target_byte_size,
    'checksum', target_checksum
  )::text;

  select *
    into upload_session
  from public.platform_file_upload_sessions session
  where session.organization_id = target_organization_id
    and session.purpose = 'product_media'
    and session.idempotency_key = target_checksum
  for update;

  if found then
    if upload_session.created_by <> target_actor_id
       or upload_session.idempotency_fingerprint <> request_fingerprint then
      raise exception 'Product media upload idempotency conflict'
        using errcode = '23505';
    end if;
    return jsonb_build_object(
      'uploadId', upload_session.id,
      'status', upload_session.status,
      'fileId', upload_session.file_id,
      'storagePath', upload_session.storage_path,
      'fileName', upload_session.file_name,
      'mimeType', upload_session.mime_type,
      'byteSize', upload_session.byte_size,
      'resourceEntityType', upload_session.resource_entity_type,
      'resourceEntityId', upload_session.resource_entity_id
    );
  end if;

  upload_id := gen_random_uuid();
  upload_path := format(
    'organizations/%s/product-media/%s/original.%s',
    target_organization_id,
    upload_id,
    file_extension
  );

  insert into public.platform_file_upload_sessions (
    id,
    organization_id,
    file_name,
    mime_type,
    byte_size,
    storage_path,
    status,
    created_by,
    purpose,
    resource_entity_type,
    resource_entity_id,
    idempotency_key,
    idempotency_fingerprint
  )
  values (
    upload_id,
    target_organization_id,
    btrim(target_file_name),
    target_mime_type,
    target_byte_size,
    upload_path,
    'pending',
    target_actor_id,
    'product_media',
    'catalog_item',
    target_product_id,
    target_checksum,
    request_fingerprint
  )
  on conflict (organization_id, idempotency_key) where purpose = 'product_media'
  do nothing;

  select *
    into upload_session
  from public.platform_file_upload_sessions session
  where session.organization_id = target_organization_id
    and session.purpose = 'product_media'
    and session.idempotency_key = target_checksum
  for update;

  if upload_session.created_by <> target_actor_id
     or upload_session.idempotency_fingerprint <> request_fingerprint then
    raise exception 'Product media upload idempotency conflict'
      using errcode = '23505';
  end if;

  return jsonb_build_object(
    'uploadId', upload_session.id,
    'status', upload_session.status,
    'fileId', upload_session.file_id,
    'storagePath', upload_session.storage_path,
    'fileName', upload_session.file_name,
    'mimeType', upload_session.mime_type,
    'byteSize', upload_session.byte_size,
    'resourceEntityType', upload_session.resource_entity_type,
    'resourceEntityId', upload_session.resource_entity_id
  );
end;
$$;

create or replace function public.finalize_platform_product_media_upload(
  target_upload_id uuid,
  target_actor_id uuid,
  target_checksum text,
  target_large_size bigint,
  target_large_width integer,
  target_large_height integer,
  target_thumbnail_size bigint,
  target_thumbnail_width integer,
  target_thumbnail_height integer
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  upload_session public.platform_file_upload_sessions%rowtype;
  large_path text;
  thumbnail_path text;
begin
  select *
    into upload_session
  from public.platform_file_upload_sessions session
  where session.id = target_upload_id
    and session.purpose = 'product_media'
  for update;

  if not found
     or upload_session.created_by <> target_actor_id
     or target_checksum is null
     or upload_session.idempotency_key <> target_checksum then
    raise exception 'Product media upload was not found'
      using errcode = '42501';
  end if;

  if upload_session.status = 'completed' then
    return jsonb_build_object(
      'uploadId', upload_session.id,
      'status', upload_session.status,
      'fileId', upload_session.file_id,
      'fileName', upload_session.file_name,
      'mimeType', upload_session.mime_type,
      'byteSize', upload_session.byte_size
    );
  end if;

  if upload_session.status <> 'pending'
     or not public.erp_product_writes_enabled(upload_session.organization_id)
     or not exists (
       select 1
       from public.organization_memberships membership
       join public.role_permissions permission
         on permission.role = membership.role
        and permission.permission_key = 'catalog.write'
       where membership.organization_id = upload_session.organization_id
         and membership.user_id = target_actor_id
         and membership.status = 'active'
     ) then
    raise exception 'Product media upload cannot be finalized'
      using errcode = '42501';
  end if;

  if upload_session.resource_entity_type <> 'catalog_item'
     or not exists (
       select 1
       from public.erp_catalog_items item
       where item.organization_id = upload_session.organization_id
         and item.id = upload_session.resource_entity_id
     ) then
    raise exception 'Product not found in this organization'
      using errcode = '42501';
  end if;

  if target_large_size not between 1 and 26214400
     or target_thumbnail_size not between 1 and 26214400
     or target_large_width < 1
     or target_large_height < 1
     or greatest(target_large_width, target_large_height) > 1600
     or target_thumbnail_width < 1
     or target_thumbnail_height < 1
     or greatest(target_thumbnail_width, target_thumbnail_height) > 400 then
    raise exception 'Invalid product media renditions'
      using errcode = '22023';
  end if;

  large_path := format(
    'organizations/%s/product-media/%s/renditions/large.webp',
    upload_session.organization_id,
    upload_session.id
  );
  thumbnail_path := format(
    'organizations/%s/product-media/%s/renditions/thumbnail.webp',
    upload_session.organization_id,
    upload_session.id
  );

  insert into public.platform_files (
    id,
    organization_id,
    name,
    category,
    source,
    media_type,
    size,
    status,
    relation_type,
    relation_id,
    storage_path,
    checksum,
    uploaded_by,
    current_version
  )
  values (
    upload_session.id,
    upload_session.organization_id,
    upload_session.file_name,
    'other',
    'upload',
    upload_session.mime_type,
    upload_session.byte_size,
    'active',
    'product_media_library',
    upload_session.organization_id::text,
    upload_session.storage_path,
    target_checksum,
    target_actor_id,
    1
  );

  insert into public.platform_file_versions (
    file_id,
    organization_id,
    version,
    file_name,
    mime_type,
    byte_size,
    checksum,
    storage_path,
    created_by
  )
  values (
    upload_session.id,
    upload_session.organization_id,
    1,
    upload_session.file_name,
    upload_session.mime_type,
    upload_session.byte_size,
    target_checksum,
    upload_session.storage_path,
    target_actor_id
  );

  insert into public.platform_file_renditions (
    organization_id,
    file_id,
    rendition,
    media_type,
    byte_size,
    width,
    height,
    storage_path
  )
  values
    (
      upload_session.organization_id,
      upload_session.id,
      'large',
      'image/webp',
      target_large_size,
      target_large_width,
      target_large_height,
      large_path
    ),
    (
      upload_session.organization_id,
      upload_session.id,
      'thumbnail',
      'image/webp',
      target_thumbnail_size,
      target_thumbnail_width,
      target_thumbnail_height,
      thumbnail_path
    );

  update public.platform_file_upload_sessions
  set file_id = upload_session.id,
      status = 'completed',
      completed_at = statement_timestamp()
  where id = upload_session.id;

  return jsonb_build_object(
    'uploadId', upload_session.id,
    'status', 'completed',
    'fileId', upload_session.id,
    'fileName', upload_session.file_name,
    'mimeType', upload_session.mime_type,
    'byteSize', upload_session.byte_size
  );
end;
$$;

revoke all on function public.begin_platform_product_media_upload(uuid, uuid, uuid, text, text, bigint, text) from public, anon, authenticated;
grant execute on function public.begin_platform_product_media_upload(uuid, uuid, uuid, text, text, bigint, text) to service_role;
revoke all on function public.finalize_platform_product_media_upload(uuid, uuid, text, bigint, integer, integer, bigint, integer, integer) from public, anon, authenticated;
grant execute on function public.finalize_platform_product_media_upload(uuid, uuid, text, bigint, integer, integer, bigint, integer, integer) to service_role;
