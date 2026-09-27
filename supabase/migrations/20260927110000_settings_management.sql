-- Settings management contracts. Mutations are exposed through permission-checked
-- security-definer functions so the browser never receives service-role access.

alter table public.organizations
  add column if not exists timezone text not null default 'UTC',
  add column if not exists locale text not null default 'en';

alter table public.organizations
  drop constraint if exists organizations_locale_check;

alter table public.organizations
  add constraint organizations_locale_check check (locale in ('en', 'es'));

alter table public.organization_memberships
  add column if not exists invited_at timestamptz,
  add column if not exists last_active_at timestamptz;

create or replace function public.list_organization_members(target_organization_id uuid)
returns table (
  user_id uuid,
  organization_id uuid,
  role text,
  status text,
  created_at timestamptz,
  invited_at timestamptz,
  last_active_at timestamptz,
  full_name text,
  email text
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select membership.user_id,
         membership.organization_id,
         membership.role,
         membership.status,
         membership.created_at,
         membership.invited_at,
         membership.last_active_at,
         coalesce(nullif(user_record.raw_user_meta_data ->> 'full_name', ''), nullif(user_record.raw_user_meta_data ->> 'name', '')),
         user_record.email
  from public.organization_memberships membership
  join auth.users user_record on user_record.id = membership.user_id
  where membership.organization_id = target_organization_id
    and public.has_organization_permission(target_organization_id, 'members.read');
$$;

create or replace function public.update_organization_settings(
  target_organization_id uuid,
  organization_name text,
  organization_slug text,
  organization_timezone text,
  organization_locale text
)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare updated public.organizations;
begin
  if not public.has_organization_permission(target_organization_id, 'organization.manage') then
    raise exception 'organization.manage permission required' using errcode = '42501';
  end if;
  update public.organizations
     set name = trim(organization_name),
         slug = lower(trim(organization_slug)),
         timezone = trim(organization_timezone),
         locale = organization_locale
   where id = target_organization_id
   returning * into updated;
  if updated.id is null then raise exception 'organization not found' using errcode = 'PGRST116'; end if;
  return updated;
end;
$$;

create or replace function public.update_organization_member(
  target_organization_id uuid,
  target_user_id uuid,
  next_role text default null,
  next_status text default null
)
returns table (
  user_id uuid,
  organization_id uuid,
  role text,
  status text,
  created_at timestamptz,
  invited_at timestamptz,
  last_active_at timestamptz,
  full_name text,
  email text
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.has_organization_permission(target_organization_id, 'members.manage') then
    raise exception 'members.manage permission required' using errcode = '42501';
  end if;
  if exists (
    select 1 from public.organization_memberships
    where organization_id = target_organization_id and user_id = target_user_id and role = 'owner'
  ) and (coalesce(next_role, 'owner') <> 'owner' or coalesce(next_status, 'active') <> 'active') then
    raise exception 'organization owner must remain active and owner' using errcode = '42501';
  end if;
  if next_role is not null and next_role not in ('owner', 'admin', 'agent', 'viewer') then
    raise exception 'invalid membership role' using errcode = '22023';
  end if;
  if next_status is not null and next_status not in ('pending', 'active', 'suspended', 'revoked') then
    raise exception 'invalid membership status' using errcode = '22023';
  end if;
  update public.organization_memberships
     set role = coalesce(next_role, role),
         status = coalesce(next_status, status),
         last_active_at = case when coalesce(next_status, status) = 'active' then now() else last_active_at end
   where organization_id = target_organization_id and user_id = target_user_id;
  if not found then raise exception 'member not found' using errcode = 'PGRST116'; end if;
  return query
    select member.*
      from public.list_organization_members(target_organization_id) as member
     where member.user_id = target_user_id;
end;
$$;

grant execute on function public.list_organization_members(uuid) to authenticated;
grant execute on function public.update_organization_settings(uuid, text, text, text, text) to authenticated;
grant execute on function public.update_organization_member(uuid, uuid, text, text) to authenticated;
