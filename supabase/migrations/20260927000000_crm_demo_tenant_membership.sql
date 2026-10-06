-- Keep the documented demo account usable against the seeded CRM tenant.
-- This is idempotent and only links an existing auth user to an existing org.
do $$
declare
  demo_user_id uuid;
  demo_organization_id uuid;
begin
  select id into demo_user_id
  from auth.users
  where lower(email) = 'admin@loop.dev'
  limit 1;

  select id into demo_organization_id
  from public.organizations
  where slug = 'estar-protegidos'
  order by created_at
  limit 1;

  if demo_user_id is not null and demo_organization_id is not null then
    insert into public.organization_memberships (organization_id, user_id, role, status)
    values (demo_organization_id, demo_user_id, 'owner', 'active')
    on conflict (organization_id, user_id) do update
      set role = excluded.role,
          status = excluded.status;
  end if;
end $$;
