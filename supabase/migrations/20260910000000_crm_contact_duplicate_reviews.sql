alter table public.crm_contacts
  add column if not exists archived_at timestamptz;

create index if not exists crm_contacts_active_scope_idx
  on public.crm_contacts(organization_id, updated_at desc)
  where archived_at is null;

create table if not exists public.crm_contact_duplicate_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contact_id uuid not null references public.crm_contacts(id) on delete cascade,
  candidate_id uuid not null references public.crm_contacts(id) on delete cascade,
  confirmation text not null,
  dismissed_by uuid,
  dismissed_at timestamptz not null default now(),
  unique (organization_id, contact_id, candidate_id),
  check (contact_id <> candidate_id),
  check (confirmation = 'DISMISS_DUPLICATE_REVIEW')
);

alter table public.crm_contact_duplicate_reviews enable row level security;
grant select, insert on table public.crm_contact_duplicate_reviews to authenticated;
drop policy if exists crm_contact_duplicate_reviews_access on public.crm_contact_duplicate_reviews;
create policy crm_contact_duplicate_reviews_access on public.crm_contact_duplicate_reviews
  for all to authenticated
  using (public.has_organization_permission(organization_id, 'crm.read'))
  with check (public.has_organization_permission(organization_id, 'crm.manage'));