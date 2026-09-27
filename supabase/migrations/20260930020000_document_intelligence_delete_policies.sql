-- Allow authorized organization operators to remove document lifecycle metadata
-- when a user explicitly deletes an extraction.

drop policy if exists document_intelligence_associations_operator_delete
  on public.document_intelligence_associations;
create policy document_intelligence_associations_operator_delete
on public.document_intelligence_associations
for delete
to authenticated
using (
  public.has_organization_role(organization_id, array['owner', 'admin', 'agent'])
);

drop policy if exists document_intelligence_lifecycle_operator_delete
  on public.document_intelligence_lifecycle_operations;
create policy document_intelligence_lifecycle_operator_delete
on public.document_intelligence_lifecycle_operations
for delete
to authenticated
using (
  public.has_organization_role(organization_id, array['owner', 'admin', 'agent'])
);

drop policy if exists platform_files_operator_delete
  on public.platform_files;
create policy platform_files_operator_delete
on public.platform_files
for delete
to authenticated
using (
  public.has_organization_role(organization_id, array['owner', 'admin', 'agent'])
);
