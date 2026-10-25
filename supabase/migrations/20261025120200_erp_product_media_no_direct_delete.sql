do $product_media_no_direct_delete$
begin
  if to_regclass('storage.objects') is not null then
    drop policy if exists platform_files_storage_delete on storage.objects;
    create policy platform_files_storage_delete
      on storage.objects for delete to authenticated
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
      );
  end if;
end;
$product_media_no_direct_delete$;
