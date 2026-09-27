-- Deleting an extraction must not null the non-null organization_id on its
-- version row. Keep the tenant scope and only detach the extraction reference.

alter table public.document_intelligence_versions
  drop constraint if exists document_intelligence_versions_extraction_fkey;

alter table public.document_intelligence_versions
  add constraint document_intelligence_versions_extraction_fkey
  foreign key (extraction_id)
  references public.document_intelligence_extractions(id)
  on delete set null;

create or replace function public.prevent_document_intelligence_organization_change()
returns trigger
language plpgsql
as $$
begin
  if new.organization_id is distinct from old.organization_id then
    raise exception 'document_intelligence organization_id is immutable';
  end if;

  return new;
end;
$$;
