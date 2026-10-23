alter table public.platform_files
  alter column organization_id drop not null,
  add column if not exists owner_user_id uuid references auth.users(id) on delete restrict;

alter table public.platform_files
  add constraint platform_files_owner_scope_check
  check (
    (organization_id is not null and owner_user_id is null)
    or (organization_id is null and owner_user_id is not null)
  ),
  add constraint platform_files_storage_scope_check
  check (
    storage_path is null
    or (
      organization_id is not null
      and left(storage_path, length('organizations/' || organization_id::text || '/'))
        = 'organizations/' || organization_id::text || '/'
    )
    or (
      owner_user_id is not null
      and left(storage_path, length('users/' || owner_user_id::text || '/'))
        = 'users/' || owner_user_id::text || '/'
    )
  );

create index if not exists platform_files_owner_user_status_idx
  on public.platform_files (owner_user_id, status)
  where owner_user_id is not null;

alter table public.platform_file_versions
  alter column organization_id drop not null,
  add column if not exists owner_user_id uuid references auth.users(id) on delete restrict;

alter table public.platform_file_versions
  add constraint platform_file_versions_owner_scope_check
  check (
    (organization_id is not null and owner_user_id is null)
    or (organization_id is null and owner_user_id is not null)
  ),
  add constraint platform_file_versions_storage_scope_check
  check (
    storage_path is null
    or (
      organization_id is not null
      and left(storage_path, length('organizations/' || organization_id::text || '/'))
        = 'organizations/' || organization_id::text || '/'
    )
    or (
      owner_user_id is not null
      and left(storage_path, length('users/' || owner_user_id::text || '/'))
        = 'users/' || owner_user_id::text || '/'
    )
  );

alter table public.platform_file_upload_sessions
  alter column organization_id drop not null,
  add column if not exists owner_user_id uuid references auth.users(id) on delete restrict;

alter table public.platform_file_upload_sessions
  add constraint platform_file_upload_sessions_owner_scope_check
  check (
    (organization_id is not null and owner_user_id is null)
    or (organization_id is null and owner_user_id is not null)
  ),
  add constraint platform_file_upload_sessions_storage_scope_check
  check (
    storage_path is null
    or (
      organization_id is not null
      and left(storage_path, length('organizations/' || organization_id::text || '/'))
        = 'organizations/' || organization_id::text || '/'
    )
    or (
      owner_user_id is not null
      and left(storage_path, length('users/' || owner_user_id::text || '/'))
        = 'users/' || owner_user_id::text || '/'
    )
  ),
  add constraint platform_file_upload_sessions_avatar_size_check
  check (
    owner_user_id is null
    or (byte_size between 1 and 5242880 and mime_type in ('image/jpeg', 'image/png', 'image/webp'))
  );

create index if not exists platform_file_upload_sessions_owner_status_idx
  on public.platform_file_upload_sessions (owner_user_id, status, created_at)
  where owner_user_id is not null;

drop policy if exists platform_files_member_select on public.platform_files;
create policy platform_files_member_select on public.platform_files
  for select to authenticated
  using (
    (
      organization_id is not null
      and exists (
        select 1
        from public.organization_memberships m
        where m.organization_id = platform_files.organization_id
          and m.user_id = auth.uid()
          and m.status = 'active'
      )
    )
    or owner_user_id = auth.uid()
  );

drop policy if exists platform_files_member_insert on public.platform_files;
create policy platform_files_member_insert on public.platform_files
  for insert to authenticated
  with check (
    (
      organization_id is not null
      and owner_user_id is null
      and exists (
        select 1
        from public.organization_memberships m
        where m.organization_id = platform_files.organization_id
          and m.user_id = auth.uid()
          and m.status = 'active'
      )
    )
    or (
      organization_id is null
      and owner_user_id = auth.uid()
      and relation_type = 'profile_avatar'
      and relation_id = auth.uid()::text
    )
  );

drop policy if exists platform_files_member_update on public.platform_files;
create policy platform_files_member_update on public.platform_files
  for update to authenticated
  using (
    (
      organization_id is not null
      and exists (
        select 1
        from public.organization_memberships m
        where m.organization_id = platform_files.organization_id
          and m.user_id = auth.uid()
          and m.status = 'active'
      )
    )
    or owner_user_id = auth.uid()
  )
  with check (
    (
      organization_id is not null
      and owner_user_id is null
      and exists (
        select 1
        from public.organization_memberships m
        where m.organization_id = platform_files.organization_id
          and m.user_id = auth.uid()
          and m.status = 'active'
      )
    )
    or (
      organization_id is null
      and owner_user_id = auth.uid()
      and relation_type = 'profile_avatar'
      and relation_id = auth.uid()::text
    )
  );

drop policy if exists platform_files_operator_delete on public.platform_files;
create policy platform_files_operator_delete on public.platform_files
  for delete to authenticated
  using (
    (
      organization_id is not null
      and public.has_organization_role(organization_id, array['owner', 'admin', 'agent'])
    )
    or owner_user_id = auth.uid()
  );

drop policy if exists platform_file_versions_member_select on public.platform_file_versions;
create policy platform_file_versions_member_select on public.platform_file_versions
  for select to authenticated
  using (
    (
      organization_id is not null
      and exists (
        select 1
        from public.organization_memberships m
        where m.organization_id = platform_file_versions.organization_id
          and m.user_id = auth.uid()
          and m.status = 'active'
      )
    )
    or owner_user_id = auth.uid()
  );

drop policy if exists platform_file_versions_member_insert on public.platform_file_versions;
create policy platform_file_versions_member_insert on public.platform_file_versions
  for insert to authenticated
  with check (
    (
      organization_id is not null
      and owner_user_id is null
      and exists (
        select 1
        from public.organization_memberships m
        where m.organization_id = platform_file_versions.organization_id
          and m.user_id = auth.uid()
          and m.status = 'active'
      )
    )
    or (
      organization_id is null
      and owner_user_id = auth.uid()
      and exists (
        select 1
        from public.platform_files f
        where f.id = platform_file_versions.file_id
          and f.organization_id is null
          and f.owner_user_id = auth.uid()
      )
    )
  );

drop policy if exists platform_file_upload_sessions_member_select on public.platform_file_upload_sessions;
create policy platform_file_upload_sessions_member_select on public.platform_file_upload_sessions
  for select to authenticated
  using (
    (
      organization_id is not null
      and exists (
        select 1
        from public.organization_memberships m
        where m.organization_id = platform_file_upload_sessions.organization_id
          and m.user_id = auth.uid()
          and m.status = 'active'
      )
    )
    or owner_user_id = auth.uid()
  );

drop policy if exists platform_file_upload_sessions_member_insert on public.platform_file_upload_sessions;
create policy platform_file_upload_sessions_member_insert on public.platform_file_upload_sessions
  for insert to authenticated
  with check (
    (
      organization_id is not null
      and owner_user_id is null
      and exists (
        select 1
        from public.organization_memberships m
        where m.organization_id = platform_file_upload_sessions.organization_id
          and m.user_id = auth.uid()
          and m.status = 'active'
      )
    )
    or (
      organization_id is null
      and owner_user_id = auth.uid()
      and file_id is null
      and created_by = auth.uid()
      and mime_type in ('image/jpeg', 'image/png', 'image/webp')
      and byte_size between 1 and 5242880
    )
  );

drop policy if exists platform_file_upload_sessions_member_update on public.platform_file_upload_sessions;
create policy platform_file_upload_sessions_member_update on public.platform_file_upload_sessions
  for update to authenticated
  using (
    (
      organization_id is not null
      and exists (
        select 1
        from public.organization_memberships m
        where m.organization_id = platform_file_upload_sessions.organization_id
          and m.user_id = auth.uid()
          and m.status = 'active'
      )
    )
    or owner_user_id = auth.uid()
  )
  with check (
    (
      organization_id is not null
      and owner_user_id is null
      and exists (
        select 1
        from public.organization_memberships m
        where m.organization_id = platform_file_upload_sessions.organization_id
          and m.user_id = auth.uid()
          and m.status = 'active'
      )
    )
    or (
      organization_id is null
      and owner_user_id = auth.uid()
      and (
        file_id is null
        or exists (
          select 1
          from public.platform_files f
          where f.id = platform_file_upload_sessions.file_id
            and f.organization_id is null
            and f.owner_user_id = auth.uid()
        )
      )
      and created_by = auth.uid()
      and mime_type in ('image/jpeg', 'image/png', 'image/webp')
      and byte_size between 1 and 5242880
    )
  );

create or replace function public.platform_file_user_id(object_name text)
returns uuid
language plpgsql
immutable
as $$
declare
  user_text text;
begin
  if object_name !~ '^users/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/' then
    return null;
  end if;
  user_text := split_part(object_name, '/', 2);
  return user_text::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

do $storage_policy$
begin
  if to_regclass('storage.objects') is not null then
    execute 'drop policy if exists platform_files_storage_select on storage.objects';
    execute $policy$
      create policy platform_files_storage_select
      on storage.objects for select to authenticated
      using (
        bucket_id = 'platform-files'
        and (
          public.is_organization_member(public.platform_file_organization_id(name))
          or public.platform_file_user_id(name) = auth.uid()
        )
      );
    $policy$;
    execute 'drop policy if exists platform_files_storage_insert on storage.objects';
    execute $policy$
      create policy platform_files_storage_insert
      on storage.objects for insert to authenticated
      with check (
        bucket_id = 'platform-files'
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
      );
    $policy$;
    execute 'drop policy if exists platform_files_storage_update on storage.objects';
    execute $policy$
      create policy platform_files_storage_update
      on storage.objects for update to authenticated
      using (
        bucket_id = 'platform-files'
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
        and (
          public.has_organization_role(
            public.platform_file_organization_id(name),
            array['owner', 'admin', 'agent']
          )
          or public.platform_file_user_id(name) = auth.uid()
        )
      );
    $policy$;
    execute 'drop policy if exists platform_files_storage_delete on storage.objects';
    execute $policy$
      create policy platform_files_storage_delete
      on storage.objects for delete to authenticated
      using (
        bucket_id = 'platform-files'
        and (
          public.has_organization_role(
            public.platform_file_organization_id(name),
            array['owner', 'admin', 'agent']
          )
          or public.platform_file_user_id(name) = auth.uid()
        )
      );
    $policy$;
  end if;
end;
$storage_policy$;
