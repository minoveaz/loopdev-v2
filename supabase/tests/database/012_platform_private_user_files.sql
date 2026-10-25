begin;

select plan(19);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at)
values
  ('00000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'private-files-owner@example.test', '', now()),
  ('00000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'private-files-other@example.test', '', now());

insert into public.organizations (id, name, slug)
values ('00000000-0000-4000-8000-000000000003', 'Private Files Org', 'private-files-org');

insert into public.organization_memberships (organization_id, user_id, role)
values
  ('00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001', 'owner'),
  ('00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000002', 'viewer');

select is(
  (select is_nullable from information_schema.columns where table_schema = 'public' and table_name = 'platform_files' and column_name = 'organization_id'),
  'YES',
  'organization ownership remains optional for personal files'
);

select ok(
  (select count(*) = 3 from information_schema.columns
   where table_schema = 'public'
     and table_name in ('platform_files', 'platform_file_versions', 'platform_file_upload_sessions')
     and column_name = 'owner_user_id'),
  'all Files records support explicit user ownership'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.platform_files'::regclass)
  and (select relrowsecurity from pg_class where oid = 'public.platform_file_versions'::regclass)
  and (select relrowsecurity from pg_class where oid = 'public.platform_file_upload_sessions'::regclass),
  'personal file metadata, versions and upload sessions retain RLS'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
set local role authenticated;

select lives_ok($$
  insert into public.platform_file_upload_sessions (
    id, owner_user_id, file_name, mime_type, byte_size, storage_path, status, created_by
  ) values (
    '00000000-0000-4000-8000-000000000004',
    '00000000-0000-4000-8000-000000000001',
    'avatar.png',
    'image/png',
    8,
    'users/00000000-0000-4000-8000-000000000001/avatars/00000000-0000-4000-8000-000000000004',
    'pending',
    '00000000-0000-4000-8000-000000000001'
  )
$$, 'a user can create their own bounded avatar upload session');

select lives_ok($$
  insert into storage.objects (bucket_id, name, owner, owner_id, metadata, version)
  values (
    'platform-files',
    'users/00000000-0000-4000-8000-000000000001/avatars/00000000-0000-4000-8000-000000000004',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    '{"mimetype":"image/png"}'::jsonb,
    'private-avatar-user-1'
  )
$$, 'the matching authenticated owner can upload the pending avatar object');

select lives_ok($$
  insert into public.platform_files (
    id, owner_user_id, name, category, source, media_type, size,
    relation_type, relation_id, storage_path, uploaded_by
  ) values (
    '00000000-0000-4000-8000-000000000004',
    '00000000-0000-4000-8000-000000000001',
    'avatar.png',
    'other',
    'upload',
    'image/png',
    8,
    'profile_avatar',
    '00000000-0000-4000-8000-000000000001',
    'users/00000000-0000-4000-8000-000000000001/avatars/00000000-0000-4000-8000-000000000004',
    '00000000-0000-4000-8000-000000000001'
  )
$$, 'the authenticated owner can add matching personal file metadata');

select lives_ok($$
  insert into public.platform_file_versions (
    file_id, owner_user_id, version, file_name, mime_type, byte_size, storage_path, created_by
  ) values (
    '00000000-0000-4000-8000-000000000004',
    '00000000-0000-4000-8000-000000000001',
    1,
    'avatar.png',
    'image/png',
    8,
    'users/00000000-0000-4000-8000-000000000001/avatars/00000000-0000-4000-8000-000000000004',
    '00000000-0000-4000-8000-000000000001'
  )
$$, 'the owner can add a version for their personal file');

select is((select count(*)::integer from public.platform_files), 1, 'owner can read their personal metadata');

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);

select is((select count(*)::integer from public.platform_files), 0, 'another user cannot read personal metadata');
select is((select count(*)::integer from storage.objects where bucket_id = 'platform-files'), 0, 'another user cannot read the private avatar object');

select throws_ok($$
  insert into public.platform_files (
    id, owner_user_id, name, category, source, media_type, size, relation_type, relation_id, storage_path
  ) values (
    '00000000-0000-4000-8000-000000000005',
    '00000000-0000-4000-8000-000000000001',
    'cross-user.png',
    'other',
    'upload',
    'image/png',
    8,
    'profile_avatar',
    '00000000-0000-4000-8000-000000000001',
    'users/00000000-0000-4000-8000-000000000001/avatars/00000000-0000-4000-8000-000000000005'
  )
$$, 'new row violates row-level security policy for table "platform_files"', 'another user cannot create metadata owned by the first user');

select throws_ok($$
  insert into public.platform_file_versions (
    file_id, owner_user_id, version, file_name, mime_type, byte_size, storage_path, created_by
  ) values (
    '00000000-0000-4000-8000-000000000004',
    '00000000-0000-4000-8000-000000000002',
    2,
    'avatar.png',
    'image/png',
    8,
    'users/00000000-0000-4000-8000-000000000002/avatars/00000000-0000-4000-8000-000000000005',
    '00000000-0000-4000-8000-000000000002'
  )
$$, 'new row violates row-level security policy for table "platform_file_versions"', 'another user cannot attach a version to the first user''s file');

select throws_ok($$
  insert into storage.objects (bucket_id, name, owner, owner_id, metadata, version)
  values (
    'platform-files',
    'users/00000000-0000-4000-8000-000000000001/avatars/00000000-0000-4000-8000-000000000006',
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000002',
    '{"mimetype":"image/png"}'::jsonb,
    'private-avatar-cross-user'
  )
$$, 'new row violates row-level security policy for table "objects"', 'another user cannot upload into the first user''s storage path');

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);

select lives_ok($$
  insert into public.platform_files (
    id, organization_id, name, category, source, media_type, size, relation_type, relation_id, storage_path
  ) values (
    '00000000-0000-4000-8000-000000000007',
    '00000000-0000-4000-8000-000000000003',
    'organization.pdf',
    'other',
    'upload',
    'application/pdf',
    16,
    'contact',
    'contact-1',
    'organizations/00000000-0000-4000-8000-000000000003/00000000-0000-4000-8000-000000000007/organization.pdf'
  )
$$, 'organization members retain existing Files metadata access');

select lives_ok($$
  insert into storage.objects (bucket_id, name, owner, owner_id, metadata, version)
  values (
    'platform-files',
    'organizations/00000000-0000-4000-8000-000000000003/00000000-0000-4000-8000-000000000001/00000000-0000-4000-8000-000000000007/organization.pdf',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    '{"mimetype":"application/pdf"}'::jsonb,
    'private-avatar-org-continuity'
  )
$$, 'organization members retain existing Files storage access');

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);

select throws_ok($$
  insert into storage.objects (bucket_id, name, owner, owner_id, metadata, version)
  values (
    'platform-files',
    'organizations/00000000-0000-4000-8000-000000000003/00000000-0000-4000-8000-000000000002/00000000-0000-4000-8000-000000000008/unauthorized.pdf',
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000002',
    '{"mimetype":"application/pdf"}'::jsonb,
    'private-files-viewer-insert'
  )
$$, 'new row violates row-level security policy for table "objects"', 'viewer cannot upload a legacy organization file');

with updated as (
  update storage.objects
  set metadata = '{"mimetype":"application/pdf","changed_by":"viewer"}'::jsonb
  where bucket_id = 'platform-files'
    and name = 'organizations/00000000-0000-4000-8000-000000000003/00000000-0000-4000-8000-000000000001/00000000-0000-4000-8000-000000000007/organization.pdf'
  returning 1
)
select is((select count(*)::integer from updated), 0, 'viewer cannot update a legacy organization file');

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'platform_files_storage_delete'
      and qual like '%<>%product-media%'
      and qual not like '%catalog.write%'
      and qual like '%has_organization_role%'
      and qual like '%platform_file_user_id%'
      and qual not like '%is_organization_member%'
  ),
  'authenticated delete policy excludes product media and preserves Platform Files role/user checks'
);

select is(
  (select count(*)::integer from public.platform_files where organization_id = '00000000-0000-4000-8000-000000000003'),
  1,
  'organization-scoped Files records remain readable after user ownership is added'
);

select * from finish();
rollback;
