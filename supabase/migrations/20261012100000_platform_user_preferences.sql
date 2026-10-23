create table if not exists public.platform_user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  language text not null default 'en'
    check (language in ('en', 'es', 'fr', 'de', 'ar', 'he')),
  time_zone text not null default 'UTC',
  personal_notifications jsonb not null default
    '{"channels":{"inApp":true,"email":true,"push":true,"sound":false},"types":{"info":true,"success":true,"warning":true,"error":true}}'::jsonb,
  version bigint not null default 0 check (version >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_user_preferences_mutations (
  user_id uuid not null references auth.users(id) on delete cascade,
  mutation_id uuid not null,
  request jsonb not null,
  changed_fields text[] not null,
  resulting_version bigint not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, mutation_id)
);

alter table public.platform_user_preferences enable row level security;
alter table public.platform_user_preferences_mutations enable row level security;

revoke all on public.platform_user_preferences from anon, authenticated;
revoke all on public.platform_user_preferences_mutations from anon, authenticated;
grant select on public.platform_user_preferences to authenticated;
grant select on public.platform_user_preferences_mutations to authenticated;

drop policy if exists platform_user_preferences_read_own on public.platform_user_preferences;
create policy platform_user_preferences_read_own
on public.platform_user_preferences
for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists platform_user_preferences_mutations_read_own on public.platform_user_preferences_mutations;
create policy platform_user_preferences_mutations_read_own
on public.platform_user_preferences_mutations
for select to authenticated
using (user_id = (select auth.uid()));

create or replace function public.get_user_preferences()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  preference_row public.platform_user_preferences%rowtype;
begin
  if current_user_id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object(
      'code', 'UNAUTHENTICATED', 'message', 'Sign in to read account preferences.'
    ));
  end if;

  insert into public.platform_user_preferences (user_id)
  values (current_user_id)
  on conflict (user_id) do nothing;

  select * into preference_row
  from public.platform_user_preferences
  where user_id = current_user_id;

  return jsonb_build_object('success', true, 'preferences', jsonb_build_object(
    'userId', preference_row.user_id,
    'language', preference_row.language,
    'timeZone', preference_row.time_zone,
    'personalNotifications', preference_row.personal_notifications,
    'version', preference_row.version,
    'updatedAt', preference_row.updated_at
  ));
end;
$$;

create or replace function public.patch_user_preferences(
  expected_user_id uuid,
  expected_version bigint,
  p_mutation_id uuid,
  preference_patch jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  preference_row public.platform_user_preferences%rowtype;
  previous_result jsonb;
  previous_request jsonb;
  next_notifications jsonb;
  request_payload jsonb;
  v_changed_fields text[] := array[]::text[];
  field_name text;
  result_payload jsonb;
begin
  if current_user_id is null then
    return jsonb_build_object('success', false, 'error', jsonb_build_object(
      'code', 'UNAUTHENTICATED', 'message', 'Sign in to change account preferences.'
    ));
  end if;
  if expected_user_id is distinct from current_user_id then
    return jsonb_build_object('success', false, 'error', jsonb_build_object(
      'code', 'FORBIDDEN', 'message', 'Pending preferences belong to a different user.'
    ));
  end if;
  if p_mutation_id is null or expected_version is null or expected_version < 0
    or jsonb_typeof(preference_patch) <> 'object'
    or preference_patch = '{}'::jsonb
    or preference_patch - array['language', 'timeZone', 'personalNotifications'] <> '{}'::jsonb
  then
    return jsonb_build_object('success', false, 'error', jsonb_build_object(
      'code', 'PREFERENCES_VALIDATION_ERROR', 'message', 'The preference update contains unsupported fields.'
    ));
  end if;

  if preference_patch ? 'language' then
    if jsonb_typeof(preference_patch->'language') <> 'string'
      or preference_patch->>'language' not in ('en', 'es', 'fr', 'de', 'ar', 'he')
    then
      return jsonb_build_object('success', false, 'error', jsonb_build_object(
        'code', 'PREFERENCES_VALIDATION_ERROR', 'message', 'Choose a supported language.'
      ));
    end if;
    v_changed_fields := array_append(v_changed_fields, 'language');
  end if;

  if preference_patch ? 'timeZone' then
    if jsonb_typeof(preference_patch->'timeZone') <> 'string'
      or not exists (select 1 from pg_timezone_names where name = preference_patch->>'timeZone')
    then
      return jsonb_build_object('success', false, 'error', jsonb_build_object(
        'code', 'PREFERENCES_VALIDATION_ERROR', 'message', 'Choose a valid time zone.'
      ));
    end if;
    v_changed_fields := array_append(v_changed_fields, 'timeZone');
  end if;

  if preference_patch ? 'personalNotifications' then
    if jsonb_typeof(preference_patch->'personalNotifications') <> 'object'
      or preference_patch->'personalNotifications' = '{}'::jsonb
      or preference_patch->'personalNotifications' - array['channels', 'types'] <> '{}'::jsonb
    then
      return jsonb_build_object('success', false, 'error', jsonb_build_object(
        'code', 'PREFERENCES_VALIDATION_ERROR', 'message', 'The notification preference update is invalid.'
      ));
    end if;

    if preference_patch->'personalNotifications' ? 'channels' then
      if jsonb_typeof(preference_patch->'personalNotifications'->'channels') <> 'object'
        or preference_patch->'personalNotifications'->'channels' = '{}'::jsonb
      then
        return jsonb_build_object('success', false, 'error', jsonb_build_object(
          'code', 'PREFERENCES_VALIDATION_ERROR', 'message', 'Choose valid notification channels.'
        ));
      end if;
      for field_name in select jsonb_object_keys(preference_patch->'personalNotifications'->'channels') loop
        if field_name not in ('inApp', 'email', 'push', 'sound')
          or jsonb_typeof(preference_patch->'personalNotifications'->'channels'->field_name) <> 'boolean'
        then
          return jsonb_build_object('success', false, 'error', jsonb_build_object(
            'code', 'PREFERENCES_VALIDATION_ERROR', 'message', 'Choose valid notification channels.'
          ));
        end if;
        v_changed_fields := array_append(v_changed_fields, 'personalNotifications.channels.' || field_name);
      end loop;
    end if;

    if preference_patch->'personalNotifications' ? 'types' then
      if jsonb_typeof(preference_patch->'personalNotifications'->'types') <> 'object'
        or preference_patch->'personalNotifications'->'types' = '{}'::jsonb
      then
        return jsonb_build_object('success', false, 'error', jsonb_build_object(
          'code', 'PREFERENCES_VALIDATION_ERROR', 'message', 'Choose valid notification types.'
        ));
      end if;
      for field_name in select jsonb_object_keys(preference_patch->'personalNotifications'->'types') loop
        if field_name not in ('info', 'success', 'warning', 'error')
          or jsonb_typeof(preference_patch->'personalNotifications'->'types'->field_name) <> 'boolean'
        then
          return jsonb_build_object('success', false, 'error', jsonb_build_object(
            'code', 'PREFERENCES_VALIDATION_ERROR', 'message', 'Choose valid notification types.'
          ));
        end if;
        v_changed_fields := array_append(v_changed_fields, 'personalNotifications.types.' || field_name);
      end loop;
    end if;
  end if;

  request_payload := jsonb_build_object(
    'expectedVersion', expected_version,
    'patch', preference_patch
  );

  insert into public.platform_user_preferences (user_id)
  values (current_user_id)
  on conflict (user_id) do nothing;

  select * into preference_row
  from public.platform_user_preferences
  where user_id = current_user_id
  for update;

  select request, result into previous_request, previous_result
  from public.platform_user_preferences_mutations
  where user_id = current_user_id and mutation_id = p_mutation_id;

  if previous_result is not null then
    if previous_request <> request_payload then
      return jsonb_build_object('success', false, 'error', jsonb_build_object(
        'code', 'PREFERENCES_IDEMPOTENCY_CONFLICT', 'message', 'The mutation ID was already used for a different update.'
      ));
    end if;
    return previous_result;
  end if;

  if expected_version > preference_row.version
    or exists (
      select 1
      from public.platform_user_preferences_mutations mutation
      where mutation.user_id = current_user_id
        and mutation.resulting_version > expected_version
        and mutation.changed_fields && v_changed_fields
    )
  then
    return jsonb_build_object(
      'success', false,
      'state', 'conflict',
      'latest', jsonb_build_object(
        'userId', preference_row.user_id,
        'language', preference_row.language,
        'timeZone', preference_row.time_zone,
        'personalNotifications', preference_row.personal_notifications,
        'version', preference_row.version,
        'updatedAt', preference_row.updated_at
      ),
      'error', jsonb_build_object(
        'code', 'PREFERENCES_VERSION_CONFLICT',
        'message', 'This preference changed elsewhere. Review the latest value before retrying.'
      )
    );
  end if;

  next_notifications := preference_row.personal_notifications;
  if preference_patch ? 'personalNotifications' then
    if preference_patch->'personalNotifications' ? 'channels' then
      next_notifications := jsonb_set(
        next_notifications,
        '{channels}',
        next_notifications->'channels' || preference_patch->'personalNotifications'->'channels'
      );
    end if;
    if preference_patch->'personalNotifications' ? 'types' then
      next_notifications := jsonb_set(
        next_notifications,
        '{types}',
        next_notifications->'types' || preference_patch->'personalNotifications'->'types'
      );
    end if;
  end if;

  update public.platform_user_preferences
  set language = coalesce(preference_patch->>'language', language),
      time_zone = coalesce(preference_patch->>'timeZone', time_zone),
      personal_notifications = next_notifications,
      version = version + 1,
      updated_at = now()
  where user_id = current_user_id
  returning * into preference_row;

  result_payload := jsonb_build_object('success', true, 'preferences', jsonb_build_object(
    'userId', preference_row.user_id,
    'language', preference_row.language,
    'timeZone', preference_row.time_zone,
    'personalNotifications', preference_row.personal_notifications,
    'version', preference_row.version,
    'updatedAt', preference_row.updated_at
  ));

  insert into public.platform_user_preferences_mutations (
    user_id, mutation_id, request, changed_fields, resulting_version, result
  ) values (
    current_user_id, p_mutation_id, request_payload,
    v_changed_fields, preference_row.version, result_payload
  );

  return result_payload;
end;
$$;

revoke all on function public.get_user_preferences() from public, anon;
revoke all on function public.patch_user_preferences(uuid, bigint, uuid, jsonb) from public, anon;
grant execute on function public.get_user_preferences() to authenticated;
grant execute on function public.patch_user_preferences(uuid, bigint, uuid, jsonb) to authenticated;
