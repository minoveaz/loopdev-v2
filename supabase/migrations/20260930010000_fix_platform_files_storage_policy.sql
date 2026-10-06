-- Keep platform-files private while avoiding RLS recursion through
-- public.organizations inside storage.objects policies.

create or replace function public.platform_file_organization_id(object_name text)
returns uuid
language plpgsql
immutable
as $$
declare
  organization_text text;
begin
  if object_name !~ '^organizations/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/' then
    return null;
  end if;
  organization_text := split_part(object_name, '/', 2);
  return organization_text::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

do $storage_policy_fix$
begin
  if to_regclass('storage.objects') is not null then
    execute $policy$
      drop policy if exists platform_files_storage_select on storage.objects;
      create policy platform_files_storage_select
      on storage.objects for select to authenticated
      using (
        bucket_id = 'platform-files'
        and public.is_organization_member(public.platform_file_organization_id(name))
      );

      drop policy if exists platform_files_storage_insert on storage.objects;
      create policy platform_files_storage_insert
      on storage.objects for insert to authenticated
      with check (
        bucket_id = 'platform-files'
        and public.has_organization_role(
          public.platform_file_organization_id(name),
          array['owner', 'admin', 'agent']
        )
      );

      drop policy if exists platform_files_storage_update on storage.objects;
      create policy platform_files_storage_update
      on storage.objects for update to authenticated
      using (
        bucket_id = 'platform-files'
        and public.has_organization_role(
          public.platform_file_organization_id(name),
          array['owner', 'admin', 'agent']
        )
      )
      with check (
        bucket_id = 'platform-files'
        and public.has_organization_role(
          public.platform_file_organization_id(name),
          array['owner', 'admin', 'agent']
        )
      );

      drop policy if exists platform_files_storage_delete on storage.objects;
      create policy platform_files_storage_delete
      on storage.objects for delete to authenticated
      using (
        bucket_id = 'platform-files'
        and public.has_organization_role(
          public.platform_file_organization_id(name),
          array['owner', 'admin', 'agent']
        )
      );
    $policy$;
  end if;
end;
$storage_policy_fix$;
