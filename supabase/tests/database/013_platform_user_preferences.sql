begin;

select plan(18);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at)
values
  ('00000000-0000-4000-8000-000000000011', 'authenticated', 'authenticated', 'preferences-owner@example.test', '', now()),
  ('00000000-0000-4000-8000-000000000012', 'authenticated', 'authenticated', 'preferences-other@example.test', '', now());

select ok(
  (select relrowsecurity from pg_class where oid = 'public.platform_user_preferences'::regclass)
  and (select relrowsecurity from pg_class where oid = 'public.platform_user_preferences_mutations'::regclass),
  'preferences and mutation records retain RLS'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000011', true);
set local role authenticated;

select is(
  public.get_user_preferences()->>'success',
  'true',
  'authenticated user can read or initialize own preferences'
);

select is(
  (public.get_user_preferences()->'preferences'->>'userId'),
  '00000000-0000-4000-8000-000000000011',
  'preference identity is derived from the authenticated subject'
);

select is(
  (public.get_user_preferences('es')->'preferences'->>'language'),
  'es',
  'current app language initializes an untouched English default'
);

select is(
  (select language_initialized::text
   from public.platform_user_preferences
   where user_id = '00000000-0000-4000-8000-000000000011'),
  'true',
  'initial locale is recorded as initialized'
);

select is(
  (public.get_user_preferences('fr')->'preferences'->>'language'),
  'es',
  'later app locales do not override the initialized language'
);

select is(
  public.get_user_preferences('xx')->'error'->>'code',
  'PREFERENCES_VALIDATION_ERROR',
  'unsupported initial locales are rejected'
);

select is(
  (public.patch_user_preferences(
    '00000000-0000-4000-8000-000000000011',
    0,
    '00000000-0000-4000-8000-000000000101',
    '{"language":"es"}'::jsonb
  )->'preferences'->>'version'),
  '1',
  'owner can patch a preference with the expected version'
);

select is(
  (public.patch_user_preferences(
    '00000000-0000-4000-8000-000000000011',
    0,
    '00000000-0000-4000-8000-000000000101',
    '{"language":"es"}'::jsonb
  )->'preferences'->>'version'),
  '1',
  'same mutation ID and payload replay the original result'
);

select is(
  (public.patch_user_preferences(
    '00000000-0000-4000-8000-000000000011',
    0,
    '00000000-0000-4000-8000-000000000101',
    '{"language":"fr"}'::jsonb
  )->'error'->>'code'),
  'PREFERENCES_IDEMPOTENCY_CONFLICT',
  'same mutation ID cannot be reused with a different payload'
);

select is(
  (public.patch_user_preferences(
    '00000000-0000-4000-8000-000000000011',
    0,
    '00000000-0000-4000-8000-000000000102',
    '{"timeZone":"Europe/Madrid"}'::jsonb
  )->'preferences'->>'version'),
  '2',
  'stale version merges a change to a different field'
);

select is(
  (public.patch_user_preferences(
    '00000000-0000-4000-8000-000000000011',
    0,
    '00000000-0000-4000-8000-000000000103',
    '{"language":"de"}'::jsonb
  )->'error'->>'code'),
  'PREFERENCES_VERSION_CONFLICT',
  'stale update to the same field reports a conflict'
);

select is(
  (public.patch_user_preferences(
    '00000000-0000-4000-8000-000000000011',
    2,
    '00000000-0000-4000-8000-000000000104',
    '{"isAdmin":true}'::jsonb
  )->'error'->>'code'),
  'PREFERENCES_VALIDATION_ERROR',
  'unsupported fields are rejected'
);

select throws_ok($$
  insert into public.platform_user_preferences (user_id)
  values ('00000000-0000-4000-8000-000000000012')
$$, '42501', null, 'authenticated client cannot directly write another user preferences');

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000012', true);

select is(
  (select count(*)::integer from public.platform_user_preferences),
  0,
  'another user cannot read the owner preference row'
);

select is(
  public.get_user_preferences()->'preferences'->>'userId',
  '00000000-0000-4000-8000-000000000012',
  'another user initializes only their own preferences'
);

select is(
  (public.patch_user_preferences(
    '00000000-0000-4000-8000-000000000012',
    0,
    '00000000-0000-4000-8000-000000000105',
    '{"language":"en"}'::jsonb
  )->'preferences'->>'language'),
  'en',
  'an explicit language update is accepted'
);

select is(
  (public.get_user_preferences('es')->'preferences'->>'language'),
  'en',
  'an explicit English choice is not replaced by a later app locale'
);

select * from finish();
rollback;
