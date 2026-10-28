begin;

drop policy if exists erp_product_cost_references_insert
  on public.erp_product_cost_references;
create policy erp_product_cost_references_insert
  on public.erp_product_cost_references
  for insert to authenticated
  with check (
    public.has_organization_permission(organization_id, 'catalog.cost.read')
    and public.has_organization_permission(organization_id, 'catalog.cost.manage')
  );

drop policy if exists erp_product_cost_references_update
  on public.erp_product_cost_references;
create policy erp_product_cost_references_update
  on public.erp_product_cost_references
  for update to authenticated
  using (
    public.has_organization_permission(organization_id, 'catalog.cost.read')
    and public.has_organization_permission(organization_id, 'catalog.cost.manage')
  )
  with check (
    public.has_organization_permission(organization_id, 'catalog.cost.read')
    and public.has_organization_permission(organization_id, 'catalog.cost.manage')
  );

alter function public.save_erp_product_cost_reference(
  uuid, uuid, uuid, numeric, text, bigint, text
) rename to save_erp_product_cost_reference_core;

revoke all on function public.save_erp_product_cost_reference_core(
  uuid, uuid, uuid, numeric, text, bigint, text
) from public, anon, authenticated, service_role;

create function public.save_erp_product_cost_reference(
  target_organization_id uuid,
  target_catalog_item_id uuid,
  target_variant_id uuid,
  target_amount numeric,
  target_currency text,
  target_expected_version bigint,
  target_idempotency_key text
)
returns public.erp_product_cost_references
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null
     or not public.has_organization_permission(target_organization_id, 'catalog.cost.read')
     or not public.has_organization_permission(target_organization_id, 'catalog.cost.manage') then
    raise exception 'Purchase cost read and management permissions are required'
      using errcode = '42501';
  end if;

  return public.save_erp_product_cost_reference_core(
    target_organization_id,
    target_catalog_item_id,
    target_variant_id,
    target_amount,
    target_currency,
    target_expected_version,
    target_idempotency_key
  );
end;
$$;

revoke all on function public.save_erp_product_cost_reference(
  uuid, uuid, uuid, numeric, text, bigint, text
) from public, anon;
grant execute on function public.save_erp_product_cost_reference(
  uuid, uuid, uuid, numeric, text, bigint, text
) to authenticated;

commit;
