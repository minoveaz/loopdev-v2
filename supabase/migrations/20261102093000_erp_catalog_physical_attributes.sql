alter table public.erp_catalog_items
  add column if not exists physical_attributes jsonb;

alter table public.erp_catalog_variants
  add column if not exists physical_attributes jsonb;

alter table public.erp_catalog_items
  drop constraint if exists erp_catalog_items_physical_attributes_valid;

alter table public.erp_catalog_items
  add constraint erp_catalog_items_physical_attributes_valid
  check (
    physical_attributes is null
    or (
      jsonb_typeof(physical_attributes) = 'object'
      and (physical_attributes - array['weightKg', 'lengthCm', 'widthCm', 'heightCm']) = '{}'::jsonb
      and case
        when not (physical_attributes ? 'weightKg') then true
        when jsonb_typeof(physical_attributes -> 'weightKg') <> 'number' then false
        else (physical_attributes ->> 'weightKg')::numeric >= 0
      end
      and case
        when not (physical_attributes ? 'lengthCm') then true
        when jsonb_typeof(physical_attributes -> 'lengthCm') <> 'number' then false
        else (physical_attributes ->> 'lengthCm')::numeric >= 0
      end
      and case
        when not (physical_attributes ? 'widthCm') then true
        when jsonb_typeof(physical_attributes -> 'widthCm') <> 'number' then false
        else (physical_attributes ->> 'widthCm')::numeric >= 0
      end
      and case
        when not (physical_attributes ? 'heightCm') then true
        when jsonb_typeof(physical_attributes -> 'heightCm') <> 'number' then false
        else (physical_attributes ->> 'heightCm')::numeric >= 0
      end
    )
  );

alter table public.erp_catalog_variants
  drop constraint if exists erp_catalog_variants_physical_attributes_valid;

alter table public.erp_catalog_variants
  add constraint erp_catalog_variants_physical_attributes_valid
  check (
    physical_attributes is null
    or (
      jsonb_typeof(physical_attributes) = 'object'
      and (physical_attributes - array['weightKg', 'lengthCm', 'widthCm', 'heightCm']) = '{}'::jsonb
      and case
        when not (physical_attributes ? 'weightKg') then true
        when jsonb_typeof(physical_attributes -> 'weightKg') <> 'number' then false
        else (physical_attributes ->> 'weightKg')::numeric >= 0
      end
      and case
        when not (physical_attributes ? 'lengthCm') then true
        when jsonb_typeof(physical_attributes -> 'lengthCm') <> 'number' then false
        else (physical_attributes ->> 'lengthCm')::numeric >= 0
      end
      and case
        when not (physical_attributes ? 'widthCm') then true
        when jsonb_typeof(physical_attributes -> 'widthCm') <> 'number' then false
        else (physical_attributes ->> 'widthCm')::numeric >= 0
      end
      and case
        when not (physical_attributes ? 'heightCm') then true
        when jsonb_typeof(physical_attributes -> 'heightCm') <> 'number' then false
        else (physical_attributes ->> 'heightCm')::numeric >= 0
      end
    )
  );

comment on column public.erp_catalog_items.physical_attributes is
  'Optional canonical metric physical measurements for a product-managed unit; no inheritance to SKUs.';

comment on column public.erp_catalog_variants.physical_attributes is
  'Optional canonical metric physical measurements for this SKU-managed unit; never inherited from the product.';
