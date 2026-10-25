create unique index if not exists erp_catalogs_org_id_idx
  on public.erp_catalogs (organization_id, id);
create unique index if not exists erp_catalog_offers_org_id_idx
  on public.erp_catalog_offers (organization_id, id);
create unique index if not exists erp_catalog_offers_org_item_id_idx
  on public.erp_catalog_offers (organization_id, catalog_item_id, id);
create unique index if not exists erp_price_books_org_id_idx
  on public.erp_price_books (organization_id, id);
create unique index if not exists erp_price_entries_org_id_idx
  on public.erp_price_entries (organization_id, id);

do $erp_product_scoped_foreign_keys$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'erp_catalog_items_same_org_catalog_fkey'
  ) then
    alter table public.erp_catalog_items
      add constraint erp_catalog_items_same_org_catalog_fkey
      foreign key (organization_id, catalog_id)
      references public.erp_catalogs (organization_id, id)
      on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'erp_catalog_offers_same_org_item_fkey'
  ) then
    alter table public.erp_catalog_offers
      add constraint erp_catalog_offers_same_org_item_fkey
      foreign key (organization_id, catalog_item_id)
      references public.erp_catalog_items (organization_id, id)
      on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'erp_catalog_variants_same_org_item_fkey'
  ) then
    alter table public.erp_catalog_variants
      add constraint erp_catalog_variants_same_org_item_fkey
      foreign key (organization_id, catalog_item_id)
      references public.erp_catalog_items (organization_id, id)
      on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'erp_price_entries_same_org_book_fkey'
  ) then
    alter table public.erp_price_entries
      add constraint erp_price_entries_same_org_book_fkey
      foreign key (organization_id, price_book_id)
      references public.erp_price_books (organization_id, id)
      on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'erp_price_entries_same_org_item_fkey'
  ) then
    alter table public.erp_price_entries
      add constraint erp_price_entries_same_org_item_fkey
      foreign key (organization_id, catalog_item_id)
      references public.erp_catalog_items (organization_id, id)
      on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'erp_price_entries_same_org_offer_fkey'
  ) then
    alter table public.erp_price_entries
      add constraint erp_price_entries_same_org_offer_fkey
      foreign key (organization_id, offer_id)
      references public.erp_catalog_offers (organization_id, id)
      on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'erp_price_entries_offer_item_fkey'
  ) then
    alter table public.erp_price_entries
      add constraint erp_price_entries_offer_item_fkey
      foreign key (organization_id, catalog_item_id, offer_id)
      references public.erp_catalog_offers (organization_id, catalog_item_id, id)
      on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'erp_price_entries_same_org_variant_fkey'
  ) then
    alter table public.erp_price_entries
      add constraint erp_price_entries_same_org_variant_fkey
      foreign key (organization_id, variant_id)
      references public.erp_catalog_variants (organization_id, id)
      on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'erp_price_entries_variant_item_fkey'
  ) then
    alter table public.erp_price_entries
      add constraint erp_price_entries_variant_item_fkey
      foreign key (organization_id, catalog_item_id, variant_id)
      references public.erp_catalog_variants (organization_id, catalog_item_id, id)
      on delete restrict;
  end if;
end;
$erp_product_scoped_foreign_keys$;

insert into public.permissions (key, description, scope)
values
  ('catalog.write', 'Create and update organization products and references', 'organization'),
  ('catalog.cost.read', 'Read organization purchase costs', 'organization'),
  ('catalog.cost.manage', 'Create and update organization purchase costs', 'organization')
on conflict (key) do nothing;

insert into public.role_permissions (role, permission_key)
values
  ('owner', 'catalog.write'),
  ('admin', 'catalog.write'),
  ('agent', 'catalog.write'),
  ('owner', 'catalog.cost.read'),
  ('owner', 'catalog.cost.manage'),
  ('admin', 'catalog.cost.read'),
  ('admin', 'catalog.cost.manage')
on conflict (role, permission_key) do nothing;

delete from public.role_permissions
where permission_key = 'catalog.write'
  and role = 'viewer';
delete from public.role_permissions
where permission_key in ('catalog.cost.read', 'catalog.cost.manage')
  and role in ('agent', 'viewer');

do $erp_product_operation_policies$
declare
  policy_spec record;
  existing_policy record;
begin
  for policy_spec in
    select *
    from (values
      ('erp_catalogs', 'catalog.read', 'catalog.write', false),
      ('erp_catalog_items', 'catalog.read', 'catalog.write', false),
      ('erp_catalog_offers', 'catalog.read', 'catalog.write', false),
      ('erp_catalog_variants', 'catalog.read', 'catalog.write', false),
      ('erp_price_books', 'catalog.read', 'catalog.write', false),
      ('erp_price_entries', 'catalog.read', 'catalog.write', false),
      ('erp_product_references', 'catalog.read', 'catalog.write', false),
      ('erp_product_cost_references', 'catalog.cost.read', 'catalog.cost.manage', false),
      ('erp_product_media_assets', 'catalog.read', 'catalog.write', false),
      ('erp_product_media_assignments', 'catalog.read', 'catalog.write', true)
    ) as policy_specs(table_name, read_permission, write_permission, allow_detach)
  loop
    execute format('alter table public.%I enable row level security', policy_spec.table_name);
    for existing_policy in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = policy_spec.table_name
    loop
      execute format(
        'drop policy %I on public.%I',
        existing_policy.policyname,
        policy_spec.table_name
      );
    end loop;

    execute format(
      'revoke delete, truncate on table public.%I from public, anon, authenticated, service_role',
      policy_spec.table_name
    );
    execute format(
      'grant select, insert, update on table public.%I to authenticated, service_role',
      policy_spec.table_name
    );
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.has_organization_permission(organization_id, %L))',
      policy_spec.table_name || '_select',
      policy_spec.table_name,
      policy_spec.read_permission
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.has_organization_permission(organization_id, %L))',
      policy_spec.table_name || '_insert',
      policy_spec.table_name,
      policy_spec.write_permission
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (public.has_organization_permission(organization_id, %L)) with check (public.has_organization_permission(organization_id, %L))',
      policy_spec.table_name || '_update',
      policy_spec.table_name,
      policy_spec.write_permission,
      policy_spec.write_permission
    );

    if policy_spec.allow_detach then
      execute format(
        'grant delete on table public.%I to authenticated, service_role',
        policy_spec.table_name
      );
      execute format(
        'create policy %I on public.%I for delete to authenticated using (public.has_organization_permission(organization_id, %L))',
        policy_spec.table_name || '_detach',
        policy_spec.table_name,
        policy_spec.write_permission
      );
    end if;
  end loop;
end;
$erp_product_operation_policies$;

drop policy if exists platform_files_member_select on public.platform_files;
create policy platform_files_member_select
on public.platform_files
for select to authenticated
using (
  (
    relation_type = 'product_media_library'
    and public.has_organization_permission(organization_id, 'catalog.read')
  )
  or (
    relation_type <> 'product_media_library'
    and public.is_organization_member(organization_id)
  )
);

drop policy if exists platform_files_member_insert on public.platform_files;
create policy platform_files_member_insert
on public.platform_files
for insert to authenticated
with check (
  (
    relation_type = 'product_media_library'
    and public.has_organization_permission(organization_id, 'catalog.write')
  )
  or (
    relation_type <> 'product_media_library'
    and public.is_organization_member(organization_id)
  )
);

drop policy if exists platform_files_member_update on public.platform_files;
create policy platform_files_member_update
on public.platform_files
for update to authenticated
using (
  (
    relation_type = 'product_media_library'
    and public.has_organization_permission(organization_id, 'catalog.write')
  )
  or (
    relation_type <> 'product_media_library'
    and public.is_organization_member(organization_id)
  )
)
with check (
  (
    relation_type = 'product_media_library'
    and public.has_organization_permission(organization_id, 'catalog.write')
  )
  or (
    relation_type <> 'product_media_library'
    and public.is_organization_member(organization_id)
  )
);

revoke truncate on table public.platform_files from public, anon, authenticated, service_role;

create or replace function public.enforce_erp_product_write_control()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  old_row jsonb := '{}'::jsonb;
  new_row jsonb := '{}'::jsonb;
  target_organization_id uuid;
  old_is_product_media boolean := false;
  new_is_product_media boolean := false;
begin
  if tg_op <> 'INSERT' then
    old_row := to_jsonb(old);
    old_is_product_media :=
      tg_table_name = 'platform_files'
      and old_row ->> 'relation_type' = 'product_media_library';
  end if;
  if tg_op <> 'DELETE' then
    new_row := to_jsonb(new);
    new_is_product_media :=
      tg_table_name = 'platform_files'
      and new_row ->> 'relation_type' = 'product_media_library';
  end if;

  if tg_table_name = 'platform_files'
     and not old_is_product_media
     and not new_is_product_media then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_table_name = 'platform_files' and tg_op = 'DELETE' then
    raise exception 'Product media Files must be archived through Platform Files'
      using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then
    target_organization_id := (old_row ->> 'organization_id')::uuid;
  else
    target_organization_id := (new_row ->> 'organization_id')::uuid;
  end if;

  if tg_op = 'UPDATE' then
    if tg_table_name <> 'platform_files'
       and old_row ->> 'organization_id' is distinct from new_row ->> 'organization_id' then
      raise exception 'Products organization ownership cannot be changed'
        using errcode = '42501';
    end if;
    if tg_table_name = 'platform_files'
       and (
         old_is_product_media <> new_is_product_media
         or (
           old_is_product_media
           and (
             old_row ->> 'organization_id' is distinct from new_row ->> 'organization_id'
             or old_row ->> 'relation_id' is distinct from new_row ->> 'relation_id'
           )
         )
       ) then
      raise exception 'Product media File ownership cannot be changed'
        using errcode = '42501';
    end if;
  end if;

  if target_organization_id is null
     or not public.erp_product_writes_enabled(target_organization_id) then
    raise exception 'ERP Products writes are disabled by safety control'
      using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  if new_row ? 'updated_at' then
    new := jsonb_populate_record(new, jsonb_build_object('updated_at', statement_timestamp()));
  end if;
  return new;
end;
$$;

create or replace function public.audit_erp_product_mutation()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  before_row jsonb := '{}'::jsonb;
  after_row jsonb := '{}'::jsonb;
  event_row jsonb;
  target_organization_id uuid;
  target_entity_id text;
  changed_fields text[];
  headers jsonb;
  correlation_id text;
  reason_code text;
begin
  if tg_op <> 'INSERT' then
    before_row := to_jsonb(old);
  end if;
  if tg_op <> 'DELETE' then
    after_row := to_jsonb(new);
  end if;

  if tg_table_name = 'platform_files'
     and coalesce(after_row ->> 'relation_type', before_row ->> 'relation_type') <> 'product_media_library' then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  event_row := case when tg_op = 'DELETE' then before_row else after_row end;
  target_organization_id := (event_row ->> 'organization_id')::uuid;
  target_entity_id := event_row ->> 'id';

  if tg_op = 'INSERT' then
    select coalesce(array_agg(field.key order by field.key), '{}')
      into changed_fields
    from jsonb_object_keys(after_row) as field(key);
  elsif tg_op = 'DELETE' then
    select coalesce(array_agg(field.key order by field.key), '{}')
      into changed_fields
    from jsonb_object_keys(before_row) as field(key);
  else
    select coalesce(array_agg(after_field.key order by after_field.key), '{}')
      into changed_fields
    from jsonb_each(after_row) as after_field(key, value)
    where before_row -> after_field.key is distinct from after_field.value;
  end if;

  headers := coalesce(nullif(current_setting('request.headers', true), '')::jsonb, '{}'::jsonb);
  correlation_id := headers ->> 'x-correlation-id';
  reason_code := headers ->> 'x-reason-code';

  if correlation_id is not null
     and correlation_id !~ '^[A-Za-z0-9._:-]{1,128}$' then
    raise exception 'Invalid audit correlation ID'
      using errcode = '22023';
  end if;
  if reason_code is not null
     and reason_code !~ '^[a-z][a-z0-9_.-]{0,63}$' then
    raise exception 'Invalid audit reason code'
      using errcode = '22023';
  end if;

  perform public.record_platform_audit_event(
    target_organization_id,
    case
      when tg_table_name = 'platform_files' then 'erp.product_media.file.' || lower(tg_op)
      else 'erp.' || regexp_replace(tg_table_name, '^erp_', '') || '.' || lower(tg_op)
    end,
    case
      when tg_table_name = 'platform_files' then 'platform_file'
      else tg_table_name
    end,
    target_entity_id,
    jsonb_build_object(
      'operation', lower(tg_op),
      'changed_fields', changed_fields,
      'version', coalesce(after_row ->> 'updated_at', before_row ->> 'updated_at'),
      'correlation_id', correlation_id,
      'reason_code', reason_code
    )
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

do $erp_product_media_file_triggers$
begin
  execute 'drop trigger if exists erp_product_write_control_guard on public.platform_files';
  execute 'create trigger erp_product_write_control_guard before insert or update or delete on public.platform_files for each row execute function public.enforce_erp_product_write_control()';
  execute 'drop trigger if exists erp_product_mutation_audit on public.platform_files';
  execute 'create trigger erp_product_mutation_audit after insert or update or delete on public.platform_files for each row execute function public.audit_erp_product_mutation()';
end;
$erp_product_media_file_triggers$;

do $erp_product_media_storage_policies$
begin
  if to_regclass('storage.objects') is not null then
    drop policy if exists platform_files_storage_insert on storage.objects;
    create policy platform_files_storage_insert
      on storage.objects for insert to authenticated
      with check (
        bucket_id = 'platform-files'
        and (
          (
            split_part(name, '/', 3) = 'product-media'
            and public.has_organization_permission(split_part(name, '/', 2)::uuid, 'catalog.write')
            and public.erp_product_writes_enabled(split_part(name, '/', 2)::uuid)
          )
          or (
            split_part(name, '/', 3) <> 'product-media'
            and (
              public.has_organization_role(
                public.platform_file_organization_id(name),
                array['owner', 'admin', 'agent']
              )
              or (
                public.platform_file_user_id(name) = auth.uid()
                and exists (
                  select 1
                  from public.platform_file_upload_sessions upload_session
                  where upload_session.owner_user_id = auth.uid()
                    and upload_session.storage_path = name
                    and upload_session.status = 'pending'
                    and upload_session.mime_type in ('image/jpeg', 'image/png', 'image/webp')
                    and upload_session.byte_size between 1 and 5242880
                )
              )
            )
          )
        )
      );

    drop policy if exists platform_files_storage_update on storage.objects;
    create policy platform_files_storage_update
      on storage.objects for update to authenticated
      using (
        bucket_id = 'platform-files'
        and (
          (
            split_part(name, '/', 3) = 'product-media'
            and public.has_organization_permission(split_part(name, '/', 2)::uuid, 'catalog.write')
            and public.erp_product_writes_enabled(split_part(name, '/', 2)::uuid)
          )
          or (
            split_part(name, '/', 3) <> 'product-media'
            and (
              public.has_organization_role(
                public.platform_file_organization_id(name),
                array['owner', 'admin', 'agent']
              )
              or public.platform_file_user_id(name) = auth.uid()
            )
          )
        )
      )
      with check (
        bucket_id = 'platform-files'
        and (
          (
            split_part(name, '/', 3) = 'product-media'
            and public.has_organization_permission(split_part(name, '/', 2)::uuid, 'catalog.write')
            and public.erp_product_writes_enabled(split_part(name, '/', 2)::uuid)
          )
          or (
            split_part(name, '/', 3) <> 'product-media'
            and (
              public.has_organization_role(
                public.platform_file_organization_id(name),
                array['owner', 'admin', 'agent']
              )
              or public.platform_file_user_id(name) = auth.uid()
            )
          )
        )
      );

  end if;
end;
$erp_product_media_storage_policies$;

create or replace function public.enforce_erp_product_media_storage_control()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  old_is_product_media boolean := false;
  new_is_product_media boolean := false;
  old_organization_id uuid;
  new_organization_id uuid;
begin
  if tg_op <> 'INSERT' then
    old_is_product_media :=
      old.bucket_id = 'platform-files'
      and split_part(old.name, '/', 3) = 'product-media';
    if old_is_product_media then
      old_organization_id := public.platform_file_organization_id(old.name);
    end if;
  end if;
  if tg_op <> 'DELETE' then
    new_is_product_media :=
      new.bucket_id = 'platform-files'
      and split_part(new.name, '/', 3) = 'product-media';
    if new_is_product_media then
      new_organization_id := public.platform_file_organization_id(new.name);
    end if;
  end if;

  if tg_op = 'DELETE' and old_is_product_media then
    raise exception 'Product media Storage objects cannot be physically deleted'
      using errcode = '42501';
  end if;
  if tg_op = 'UPDATE'
     and (old_is_product_media or new_is_product_media)
     and (
       old.bucket_id is distinct from new.bucket_id
       or old.name is distinct from new.name
     ) then
    raise exception 'Product media Storage paths cannot be changed'
      using errcode = '42501';
  end if;
  if old_is_product_media
     and not public.erp_product_writes_enabled(old_organization_id) then
    raise exception 'ERP Products writes are disabled by safety control'
      using errcode = '42501';
  end if;
  if new_is_product_media
     and not public.erp_product_writes_enabled(new_organization_id) then
    raise exception 'ERP Products writes are disabled by safety control'
      using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function public.audit_erp_product_media_storage_mutation()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  event_row jsonb;
  target_organization_id uuid;
  target_entity_id text;
  changed_fields text[];
begin
  if tg_op = 'DELETE' then
    return old;
  end if;

  if new.bucket_id <> 'platform-files'
     or split_part(new.name, '/', 3) <> 'product-media' then
    return new;
  end if;

  event_row := to_jsonb(new);
  target_organization_id := public.platform_file_organization_id(new.name);
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

do $erp_product_media_storage_triggers$
begin
  if to_regclass('storage.objects') is not null then
    execute 'drop trigger if exists erp_product_media_write_control_guard on storage.objects';
    execute 'create trigger erp_product_media_write_control_guard before insert or update or delete on storage.objects for each row execute function public.enforce_erp_product_media_storage_control()';
    execute 'drop trigger if exists erp_product_media_mutation_audit on storage.objects';
    execute 'create trigger erp_product_media_mutation_audit after insert or update or delete on storage.objects for each row execute function public.audit_erp_product_media_storage_mutation()';
  end if;
end;
$erp_product_media_storage_triggers$;

revoke all on function public.enforce_erp_product_write_control() from public;
revoke all on function public.audit_erp_product_mutation() from public;
revoke all on function public.enforce_erp_product_media_storage_control() from public;
revoke all on function public.audit_erp_product_media_storage_mutation() from public;

do $erp_product_security_gate$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'erp_catalogs', 'erp_catalog_items', 'erp_catalog_offers',
        'erp_catalog_variants', 'erp_price_books', 'erp_price_entries',
        'erp_product_references', 'erp_product_cost_references',
        'erp_product_media_assets', 'erp_product_media_assignments'
      )
      and lower(cmd) = 'all'
  ) then
    raise exception 'Products security gate cannot open while FOR ALL policies exist';
  end if;

  update public.erp_product_write_controls
     set security_gates_ready = true,
         updated_at = now()
   where scope = 'global'
     and organization_id is null;

  if not found then
    raise exception 'Global Products write-control row is missing';
  end if;
end;
$erp_product_security_gate$;
