create or replace function public.remove_organization_member(
  target_organization_id uuid,
  target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare target_role text;
begin
  if not public.has_organization_permission(target_organization_id, 'members.manage') then
    raise exception 'members.manage permission required' using errcode = '42501';
  end if;
  select role into target_role
    from public.organization_memberships
   where organization_id = target_organization_id and user_id = target_user_id;
  if target_role is null then raise exception 'member not found' using errcode = 'PGRST116'; end if;
  if target_role = 'owner' then
    raise exception 'organization owner cannot be removed' using errcode = '42501';
  end if;
  update public.organization_memberships
     set status = 'revoked'
   where organization_id = target_organization_id and user_id = target_user_id;
end;
$$;

grant execute on function public.remove_organization_member(uuid, uuid) to authenticated;
