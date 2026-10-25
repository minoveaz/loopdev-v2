do $$
declare
  target_organization_id constant uuid := '80fce911-57c5-4a83-809f-78df6a3736f7';
  item_count integer;
  variant_count integer;
begin
  select count(*)
  into item_count
  from public.erp_catalog_items
  where organization_id = target_organization_id
    and id in (
      '945bc48f-6370-4f81-a64d-0924fb164a62',
      'be3af288-520b-4a05-b1e0-a3e6b8e5a456',
      '35a6cd92-2c2b-4a89-801e-e741b05f2730',
      'c63dc0b6-64e9-4302-baca-66aefa2bbf76',
      'e4ac3314-cebb-4cf9-921f-c191c08177ad'
    );

  if item_count = 0 then
    return;
  end if;

  if item_count <> 5 then
    raise exception 'Expected all five LoopDev Admin sample catalog items; found %.', item_count;
  end if;

  select count(*)
  into variant_count
  from public.erp_catalog_variants
  where organization_id = target_organization_id
    and catalog_item_id = '35a6cd92-2c2b-4a89-801e-e741b05f2730'
    and id in (
      '064acc29-26ed-4cbc-9b8d-182502164a78',
      '7ed3ec4b-b6ba-48a4-b2f6-faffab05de88',
      '783591b2-5b44-4793-b4d1-e1ca5fa8935b',
      '3ea274e6-c238-4186-af14-a9fe611b3757'
    );

  if variant_count <> 4 then
    raise exception 'Expected all four LoopDev Admin sample variants; found %.', variant_count;
  end if;

  update public.erp_catalog_items
  set key = case id
      when '945bc48f-6370-4f81-a64d-0924fb164a62' then '2'
      when 'be3af288-520b-4a05-b1e0-a3e6b8e5a456' then '3'
      when '35a6cd92-2c2b-4a89-801e-e741b05f2730' then '4'
      when 'c63dc0b6-64e9-4302-baca-66aefa2bbf76' then '5'
      when 'e4ac3314-cebb-4cf9-921f-c191c08177ad' then '1'
    end,
    sku = case id
      when '945bc48f-6370-4f81-a64d-0924fb164a62' then '10000000001'
      when 'be3af288-520b-4a05-b1e0-a3e6b8e5a456' then '10000000002'
      when '35a6cd92-2c2b-4a89-801e-e741b05f2730' then ''
      when 'c63dc0b6-64e9-4302-baca-66aefa2bbf76' then '10000000007'
      when 'e4ac3314-cebb-4cf9-921f-c191c08177ad' then '10000000008'
    end
  where organization_id = target_organization_id
    and id in (
      '945bc48f-6370-4f81-a64d-0924fb164a62',
      'be3af288-520b-4a05-b1e0-a3e6b8e5a456',
      '35a6cd92-2c2b-4a89-801e-e741b05f2730',
      'c63dc0b6-64e9-4302-baca-66aefa2bbf76',
      'e4ac3314-cebb-4cf9-921f-c191c08177ad'
    );

  update public.erp_catalog_variants
  set sku = case id
      when '064acc29-26ed-4cbc-9b8d-182502164a78' then '10000000003'
      when '7ed3ec4b-b6ba-48a4-b2f6-faffab05de88' then '10000000004'
      when '783591b2-5b44-4793-b4d1-e1ca5fa8935b' then '10000000005'
      when '3ea274e6-c238-4186-af14-a9fe611b3757' then '10000000006'
    end
  where organization_id = target_organization_id
    and catalog_item_id = '35a6cd92-2c2b-4a89-801e-e741b05f2730'
    and id in (
      '064acc29-26ed-4cbc-9b8d-182502164a78',
      '7ed3ec4b-b6ba-48a4-b2f6-faffab05de88',
      '783591b2-5b44-4793-b4d1-e1ca5fa8935b',
      '3ea274e6-c238-4186-af14-a9fe611b3757'
    );

  insert into public.erp_catalog_item_key_counters (organization_id, last_value)
  values (target_organization_id, 5)
  on conflict (organization_id) do update
    set last_value = greatest(public.erp_catalog_item_key_counters.last_value, excluded.last_value),
        updated_at = now();
end;
$$;
