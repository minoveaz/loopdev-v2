-- Referential cleanup of composite foreign keys can null organization_id while
-- removing a related row. That is not an organization reassignment.

create or replace function public.prevent_document_intelligence_organization_change()
returns trigger
language plpgsql
as $$
begin
  if new.organization_id is not null
    and new.organization_id is distinct from old.organization_id then
    raise exception 'document_intelligence organization_id is immutable';
  end if;

  return new;
end;
$$;
