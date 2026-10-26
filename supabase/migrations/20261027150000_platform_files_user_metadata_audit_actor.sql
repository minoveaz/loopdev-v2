create or replace function public.audit_erp_product_media_storage_mutation()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  event_row jsonb;
  target_organization_id uuid;
  session_organization_id uuid;
  target_entity_id text;
  changed_fields text[];
  actor_id text;
  upload_id_text text;
begin
  if tg_op = 'DELETE' then
    return old;
  end if;

  if new.bucket_id <> 'platform-files'
     or split_part(new.name, '/', 3) <> 'product-media' then
    return new;
  end if;

  target_organization_id := public.platform_file_organization_id(new.name);
  if coalesce(auth.role(), '') = 'service_role' and auth.uid() is null then
    upload_id_text := split_part(new.name, '/', 4);
    if upload_id_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      select session.created_by::text, session.organization_id
        into actor_id, session_organization_id
      from public.platform_file_upload_sessions session
      where session.id = upload_id_text::uuid
        and session.purpose = 'product_media';

      if found then
        if session_organization_id is distinct from target_organization_id then
          actor_id := null;
        end if;
      else
        actor_id := new.user_metadata ->> 'loopdev_actor_user_id';
      end if;
    else
      actor_id := new.user_metadata ->> 'loopdev_actor_user_id';
    end if;

    if actor_id is null
       or actor_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      raise exception 'Product media audit actor is required'
        using errcode = '42501';
    end if;
    perform set_config('request.jwt.claim.sub', actor_id, true);
  end if;

  event_row := to_jsonb(new);
  target_entity_id := new.id::text;

  if tg_op = 'INSERT' then
    changed_fields := array['object'];
  else
    select coalesce(array_agg(after_field.key order by after_field.key), '{}')
      into changed_fields
    from jsonb_each(event_row) as after_field(key, value)
    where to_jsonb(old) -> after_field.key is distinct from after_field.value;
  end if;

  perform public.record_platform_audit_event(
    target_organization_id,
    'erp.product_media.storage.' || lower(tg_op),
    'platform_file_object',
    target_entity_id,
    jsonb_build_object(
      'operation', lower(tg_op),
      'changed_fields', changed_fields,
      'version', event_row ->> 'updated_at',
      'correlation_id', null,
      'reason_code', null
    )
  );

  return new;
end;
$$;
