begin;

select plan(9);

select ok(
  exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'platform_audit_events'),
  'platform audit events table exists'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.platform_audit_events'::regclass),
  'platform audit events have RLS enabled'
);
select ok(
  not has_table_privilege('authenticated', 'public.platform_audit_events', 'insert'),
  'authenticated clients cannot insert platform audit events directly'
);
select ok(
  not has_table_privilege('authenticated', 'public.platform_audit_events', 'update'),
  'authenticated clients cannot update platform audit events'
);
select ok(
  not has_table_privilege('authenticated', 'public.platform_audit_events', 'delete'),
  'authenticated clients cannot delete platform audit events'
);
select ok(
  position('membership.status = ''active''' in pg_get_functiondef('public.is_organization_member(uuid)'::regprocedure)) > 0,
  'organization membership helper requires active status'
);
select ok(
  position('membership.status = ''active''' in pg_get_functiondef('public.has_organization_role(uuid,text[])'::regprocedure)) > 0,
  'organization role helper requires active status'
);
select ok(
  exists (select 1 from pg_proc where oid = 'public.record_platform_audit_event(uuid,text,text,text,jsonb)'::regprocedure),
  'platform audit RPC exists'
);
select ok(
  exists (
    select 1
    from pg_trigger
    where tgrelid = 'public.organization_memberships'::regclass
      and tgname = 'organization_memberships_audit_lifecycle'
  ),
  'membership lifecycle audit trigger exists'
);

select * from finish();
rollback;
