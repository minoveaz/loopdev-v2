-- Platform Document Lifecycle: retention, contact association, promotion
-- and operational reconciliation. All rows are tenant-scoped and idempotent.

alter table public.document_intelligence_documents
  add column if not exists platform_file_id uuid references public.platform_files(id) on delete set null,
  add column if not exists associated_contact_id uuid,
  add column if not exists source_suite text not null default 'standalone',
  add column if not exists document_type text not null default 'unknown',
  add column if not exists checksum text,
  add column if not exists retention_days integer not null default 365,
  add column if not exists retention_class text not null default 'temporary';

alter table public.document_intelligence_documents
  drop constraint if exists document_intelligence_documents_status_check;
alter table public.document_intelligence_documents
  add constraint document_intelligence_documents_status_check
  check (status in ('temporary', 'uploaded', 'processing', 'review', 'approved',
                    'linked', 'rejected', 'failed', 'expired', 'archived', 'deleted'));

alter table public.document_intelligence_documents
  drop constraint if exists document_intelligence_documents_retention_days_check;
alter table public.document_intelligence_documents
  add constraint document_intelligence_documents_retention_days_check
  check (retention_days between 1 and 3650);

alter table public.document_intelligence_documents
  drop constraint if exists document_intelligence_documents_contact_scope_fkey;
alter table public.document_intelligence_documents
  add constraint document_intelligence_documents_contact_scope_fkey
  foreign key (associated_contact_id, organization_id)
  references public.crm_contacts(id, organization_id) on delete restrict;

create table if not exists public.document_intelligence_retention_policies (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_type text not null,
  retention_days integer not null default 365 check (retention_days between 1 and 3650),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, document_type)
);

create table if not exists public.document_intelligence_associations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_id uuid not null,
  extraction_id uuid not null,
  contact_id uuid not null,
  platform_file_id uuid references public.platform_files(id) on delete set null,
  idempotency_key text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (organization_id, idempotency_key),
  unique (organization_id, document_id),
  foreign key (document_id, organization_id)
    references public.document_intelligence_documents(id, organization_id) on delete cascade,
  foreign key (extraction_id, organization_id)
    references public.document_intelligence_extractions(id, organization_id) on delete restrict,
  foreign key (contact_id, organization_id)
    references public.crm_contacts(id, organization_id) on delete restrict
);

create table if not exists public.document_intelligence_lifecycle_operations (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  idempotency_key text not null,
  operation text not null,
  document_id uuid not null,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (organization_id, idempotency_key)
);

create index if not exists document_intelligence_documents_expiry_idx
  on public.document_intelligence_documents (organization_id, expires_at)
  where status not in ('deleted', 'archived');
create index if not exists document_intelligence_documents_contact_idx
  on public.document_intelligence_documents (organization_id, associated_contact_id);

alter table public.document_intelligence_retention_policies enable row level security;
alter table public.document_intelligence_associations enable row level security;
alter table public.document_intelligence_lifecycle_operations enable row level security;

drop policy if exists document_lifecycle_retention_select on public.document_intelligence_retention_policies;
create policy document_lifecycle_retention_select on public.document_intelligence_retention_policies
  for select to authenticated using (public.is_organization_member(organization_id));
drop policy if exists document_lifecycle_retention_write on public.document_intelligence_retention_policies;
create policy document_lifecycle_retention_write on public.document_intelligence_retention_policies
  for all to authenticated
  using (public.has_organization_role(organization_id, array['owner', 'admin']))
  with check (public.has_organization_role(organization_id, array['owner', 'admin']));

drop policy if exists document_lifecycle_association_select on public.document_intelligence_associations;
create policy document_lifecycle_association_select on public.document_intelligence_associations
  for select to authenticated using (public.is_organization_member(organization_id));
drop policy if exists document_lifecycle_association_write on public.document_intelligence_associations;
create policy document_lifecycle_association_write on public.document_intelligence_associations
  for all to authenticated
  using (public.has_organization_role(organization_id, array['owner', 'admin', 'agent']))
  with check (public.has_organization_role(organization_id, array['owner', 'admin', 'agent']));

create or replace function public.document_intelligence_cleanup_expired(p_now timestamptz default now())
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare affected integer;
begin
  update public.document_intelligence_documents
     set status = 'expired', updated_at = p_now
   where status not in ('deleted', 'archived')
     and associated_contact_id is null
     and expires_at is not null
     and expires_at <= p_now;
  get diagnostics affected = row_count;
  return affected;
end;
$$;

create or replace function public.document_intelligence_reconcile_promotions()
returns table(document_id uuid, organization_id uuid, reason text)
language sql
security definer
set search_path = public
as $$
  select d.id, d.organization_id,
    case when d.platform_file_id is null then 'missing_platform_file' else 'metadata_mismatch' end
  from public.document_intelligence_documents d
  left join public.platform_files f on f.id = d.platform_file_id
  where d.associated_contact_id is not null
    and (d.platform_file_id is null or f.id is null or f.organization_id <> d.organization_id);
$$;

grant select, insert, update, delete on
  public.document_intelligence_retention_policies,
  public.document_intelligence_associations,
  public.document_intelligence_lifecycle_operations to authenticated;
grant execute on function public.document_intelligence_cleanup_expired(timestamptz),
  public.document_intelligence_reconcile_promotions() to authenticated;
