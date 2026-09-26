alter table public.platform_files
  add column if not exists current_version integer not null default 1,
  add column if not exists checksum text,
  add column if not exists uploaded_by uuid,
  add column if not exists deleted_at timestamptz;

create table if not exists public.platform_file_versions (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.platform_files(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  version integer not null check (version > 0),
  file_name text not null,
  mime_type text not null,
  byte_size bigint not null check (byte_size >= 0),
  checksum text,
  storage_path text,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (file_id, version),
  unique (id, organization_id)
);

create table if not exists public.platform_file_upload_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  file_id uuid references public.platform_files(id) on delete set null,
  file_name text not null,
  mime_type text not null,
  byte_size bigint not null check (byte_size >= 0),
  storage_path text,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'cancelled')),
  created_by uuid,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.platform_file_versions enable row level security;
alter table public.platform_file_upload_sessions enable row level security;

drop policy if exists platform_file_versions_member_select on public.platform_file_versions;
create policy platform_file_versions_member_select on public.platform_file_versions for select to authenticated
  using (exists (select 1 from public.organization_memberships m where m.organization_id = platform_file_versions.organization_id and m.user_id = auth.uid() and m.status = 'active'));

drop policy if exists platform_file_versions_member_insert on public.platform_file_versions;
create policy platform_file_versions_member_insert on public.platform_file_versions for insert to authenticated
  with check (exists (select 1 from public.organization_memberships m where m.organization_id = platform_file_versions.organization_id and m.user_id = auth.uid() and m.status = 'active'));

drop policy if exists platform_file_upload_sessions_member_select on public.platform_file_upload_sessions;
create policy platform_file_upload_sessions_member_select on public.platform_file_upload_sessions for select to authenticated
  using (exists (select 1 from public.organization_memberships m where m.organization_id = platform_file_upload_sessions.organization_id and m.user_id = auth.uid() and m.status = 'active'));

drop policy if exists platform_file_upload_sessions_member_insert on public.platform_file_upload_sessions;
create policy platform_file_upload_sessions_member_insert on public.platform_file_upload_sessions for insert to authenticated
  with check (exists (select 1 from public.organization_memberships m where m.organization_id = platform_file_upload_sessions.organization_id and m.user_id = auth.uid() and m.status = 'active'));

drop policy if exists platform_file_upload_sessions_member_update on public.platform_file_upload_sessions;
create policy platform_file_upload_sessions_member_update on public.platform_file_upload_sessions for update to authenticated
  using (exists (select 1 from public.organization_memberships m where m.organization_id = platform_file_upload_sessions.organization_id and m.user_id = auth.uid() and m.status = 'active'))
  with check (exists (select 1 from public.organization_memberships m where m.organization_id = platform_file_upload_sessions.organization_id and m.user_id = auth.uid() and m.status = 'active'));