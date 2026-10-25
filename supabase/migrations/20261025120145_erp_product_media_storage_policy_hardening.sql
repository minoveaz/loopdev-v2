do $product_media_storage_policy_hardening$
begin
  if to_regclass('storage.objects') is not null then
    drop policy if exists platform_files_storage_select on storage.objects;
    create policy platform_files_storage_select
      on storage.objects for select to authenticated
      using (
        bucket_id = 'platform-files'
        and (
          (
            split_part(name, '/', 3) = 'product-media'
            and public.has_organization_permission(split_part(name, '/', 2)::uuid, 'catalog.read')
          )
          or (
            split_part(name, '/', 3) <> 'product-media'
            and (
              public.is_organization_member(public.platform_file_organization_id(name))
              or public.platform_file_user_id(name) = auth.uid()
            )
          )
        )
      );

    drop policy if exists platform_files_storage_insert on storage.objects;
    create policy platform_files_storage_insert
      on storage.objects for insert to authenticated
      with check (
        bucket_id = 'platform-files'
        and (
          (
            split_part(name, '/', 3) = 'product-media'
            and public.has_organization_permission(split_part(name, '/', 2)::uuid, 'catalog.write')
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
        and (
          (
            split_part(name, '/', 3) = 'product-media'
            and public.has_organization_permission(split_part(name, '/', 2)::uuid, 'catalog.write')
          )
          or (
            split_part(name, '/', 3) <> 'product-media'
            and (
              public.has_organization_role(
                public.platform_file_organization_id(name),
                array['owner', 'admin', 'agent']
              )
              or public.platform_file_user_id(name) = auth.uid()
            )
          )
        )
      )
      with check (
        bucket_id = 'platform-files'
        and (
          (
            split_part(name, '/', 3) = 'product-media'
            and public.has_organization_permission(split_part(name, '/', 2)::uuid, 'catalog.write')
          )
          or (
            split_part(name, '/', 3) <> 'product-media'
            and (
              public.has_organization_role(
                public.platform_file_organization_id(name),
                array['owner', 'admin', 'agent']
              )
              or public.platform_file_user_id(name) = auth.uid()
            )
          )
        )
      );

    drop policy if exists platform_files_storage_delete on storage.objects;
    create policy platform_files_storage_delete
      on storage.objects for delete to authenticated
      using (
        bucket_id = 'platform-files'
        and (
          (
            split_part(name, '/', 3) = 'product-media'
            and public.has_organization_permission(split_part(name, '/', 2)::uuid, 'catalog.write')
          )
          or (
            split_part(name, '/', 3) <> 'product-media'
            and (
              public.has_organization_role(
                public.platform_file_organization_id(name),
                array['owner', 'admin', 'agent']
              )
              or public.platform_file_user_id(name) = auth.uid()
            )
          )
        )
      );
  end if;
end;
$product_media_storage_policy_hardening$;
