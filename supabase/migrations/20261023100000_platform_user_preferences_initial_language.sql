alter table public.platform_user_preferences
  add column if not exists language_initialized boolean not null default false;

update public.platform_user_preferences preferences
set language_initialized = true
where not preferences.language_initialized
  and (
    preferences.language <> 'en'
    or exists (
      select 1
      from public.platform_user_preferences_mutations mutation
      where mutation.user_id = preferences.user_id
        and 'language' = any(mutation.changed_fields)
    )
  );

create or replace function public.mark_platform_user_language_initialized()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if 'language' = any(new.changed_fields) then
    update public.platform_user_preferences
    set language_initialized = true
    where user_id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists platform_user_preferences_language_initialized
  on public.platform_user_preferences_mutations;
create trigger platform_user_preferences_language_initialized
after insert on public.platform_user_preferences_mutations
for each row execute function public.mark_platform_user_language_initialized();

create or replace function public.get_user_preferences(p_initial_language text)
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

  if p_initial_language is not null
    and p_initial_language not in ('en', 'es', 'fr', 'de', 'ar', 'he')
  then
    return jsonb_build_object('success', false, 'error', jsonb_build_object(
      'code', 'PREFERENCES_VALIDATION_ERROR', 'message', 'Choose a supported language.'
    ));
  end if;

  insert into public.platform_user_preferences as existing_preferences (
    user_id,
    language,
    language_initialized
  )
  values (
    current_user_id,
    coalesce(p_initial_language, 'en'),
    p_initial_language is not null
  )
  on conflict (user_id) do update
  set language = case
        when not existing_preferences.language_initialized
          and p_initial_language is not null
        then p_initial_language
        else existing_preferences.language
      end,
      language_initialized = existing_preferences.language_initialized
        or p_initial_language is not null;

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

create or replace function public.get_user_preferences()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.get_user_preferences(null::text);
$$;

revoke all on function public.get_user_preferences(text) from public, anon;
revoke all on function public.get_user_preferences() from public, anon;
revoke all on function public.mark_platform_user_language_initialized() from public, anon, authenticated;
grant execute on function public.get_user_preferences(text) to authenticated;
grant execute on function public.get_user_preferences() to authenticated;
