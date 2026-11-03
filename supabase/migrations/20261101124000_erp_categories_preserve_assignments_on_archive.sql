create or replace function public.manage_erp_product_reference_lifecycle()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  base_key text;
  candidate_key text;
  key_suffix integer := 1;
  ancestor_id uuid;
  visited_ids uuid[] := '{}';
begin
  if tg_op = 'INSERT' then
    if new.kind = 'category' then
      base_key := trim(both '-' from regexp_replace(lower(trim(new.name)), '[^a-z0-9]+', '-', 'g'));
      if base_key = '' then
        base_key := 'category';
      end if;
      candidate_key := base_key;
      while exists (
        select 1
          from public.erp_product_references reference
         where reference.organization_id = new.organization_id
           and reference.kind = new.kind
           and lower(reference.key) = lower(candidate_key)
      ) loop
        key_suffix := key_suffix + 1;
        candidate_key := base_key || '-' || key_suffix::text;
      end loop;
      new.key := candidate_key;
    end if;
    if new.kind = 'category' and new.parent_id is not null and not exists (
      select 1
        from public.erp_product_references parent
       where parent.id = new.parent_id
         and parent.organization_id = new.organization_id
         and parent.kind = 'category'
         and parent.status = 'active'
    ) then
      raise exception 'Product category parent must be active and in the same organization'
        using errcode = '23503';
    end if;
    new.version := 1;
  else
    if new.id is distinct from old.id
       or new.organization_id is distinct from old.organization_id
       or new.kind is distinct from old.kind
       or new.key is distinct from old.key then
      raise exception 'Product reference identity and key are immutable'
        using errcode = '42501';
    end if;

    if new.kind = 'category' and new.parent_id is not null then
      select parent.id
        into ancestor_id
        from public.erp_product_references parent
       where parent.id = new.parent_id
         and parent.organization_id = new.organization_id
         and parent.kind = 'category'
         and parent.status = 'active';
      if not found then
        raise exception 'Product category parent must be active and in the same organization'
          using errcode = '23503';
      end if;

      while ancestor_id is not null loop
        if ancestor_id = new.id or ancestor_id = any(visited_ids) then
          raise exception 'Product category hierarchy cannot contain a cycle'
            using errcode = '23514';
        end if;
        visited_ids := array_append(visited_ids, ancestor_id);
        select parent.parent_id
          into ancestor_id
          from public.erp_product_references parent
         where parent.id = ancestor_id
           and parent.organization_id = new.organization_id;
      end loop;
    end if;

    if new.kind = 'category' and new.status = 'archived' and old.status <> 'archived'
       and exists (
         select 1
           from public.erp_product_references child
          where child.organization_id = old.organization_id
            and child.kind = 'category'
            and child.parent_id = old.id
            and child.status = 'active'
       ) then
      raise exception 'Move active child categories before archiving this category'
        using errcode = '23514';
    end if;

    if new.name is distinct from old.name
       or new.parent_id is distinct from old.parent_id
       or new.status is distinct from old.status then
      new.version := old.version + 1;
      new.updated_at := now();
    else
      new.version := old.version;
      new.updated_at := old.updated_at;
    end if;
  end if;
  return new;
end;
$$;
