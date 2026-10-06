do $storage_setup$
begin
  if to_regclass('storage.buckets') is not null and to_regclass('storage.objects') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'platform-files',
      'platform-files',
      false,
      26214400,
      array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain']::text[]
    )
    on conflict (id) do update
    set public = excluded.public,
        file_size_limit = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;

    drop policy if exists platform_files_storage_select on storage.objects;
    create policy platform_files_storage_select
    on storage.objects for select to authenticated
    using (
      bucket_id = 'platform-files'
      and split_part(name, '/', 2)::uuid in (
        select organization_id
        from public.organization_memberships
        where user_id = auth.uid() and status = 'active'
      )
    );

    drop policy if exists platform_files_storage_insert on storage.objects;
    create policy platform_files_storage_insert
    on storage.objects for insert to authenticated
    with check (
      bucket_id = 'platform-files'
      and split_part(name, '/', 2)::uuid in (
        select organization_id
        from public.organization_memberships
        where user_id = auth.uid() and status = 'active'
      )
    );

    drop policy if exists platform_files_storage_update on storage.objects;
    create policy platform_files_storage_update
    on storage.objects for update to authenticated
    using (
      bucket_id = 'platform-files'
      and split_part(name, '/', 2)::uuid in (
        select organization_id
        from public.organization_memberships
        where user_id = auth.uid() and status = 'active'
      )
    )
    with check (
      bucket_id = 'platform-files'
      and split_part(name, '/', 2)::uuid in (
        select organization_id
        from public.organization_memberships
        where user_id = auth.uid() and status = 'active'
      )
    );

    drop policy if exists platform_files_storage_delete on storage.objects;
    create policy platform_files_storage_delete
    on storage.objects for delete to authenticated
    using (
      bucket_id = 'platform-files'
      and split_part(name, '/', 2)::uuid in (
        select organization_id
        from public.organization_memberships
        where user_id = auth.uid() and status = 'active'
      )
    );
  end if;
end;
$storage_setup$;