create table if not exists public.platform_files (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  category text not null default 'other',
  source text not null default 'upload',
  media_type text not null,
  size bigint not null default 0 check (size >= 0),
  status text not null default 'active' check (status in ('active', 'archived', 'deleted')),
  relation_type text not null,
  relation_id text not null,
  relation_label text,
  storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.platform_files enable row level security;

drop policy if exists platform_files_member_select on public.platform_files;
create policy platform_files_member_select on public.platform_files for select to authenticated
  using (exists (select 1 from public.organization_memberships m where m.organization_id = platform_files.organization_id and m.user_id = auth.uid() and m.status = 'active'));

drop policy if exists platform_files_member_insert on public.platform_files;
create policy platform_files_member_insert on public.platform_files for insert to authenticated
  with check (exists (select 1 from public.organization_memberships m where m.organization_id = platform_files.organization_id and m.user_id = auth.uid() and m.status = 'active'));

drop policy if exists platform_files_member_update on public.platform_files;
create policy platform_files_member_update on public.platform_files for update to authenticated
  using (exists (select 1 from public.organization_memberships m where m.organization_id = platform_files.organization_id and m.user_id = auth.uid() and m.status = 'active'));
