alter table public.crm_contacts
  add column if not exists secondary_email text,
  add column if not exists secondary_phone text,
  add column if not exists identity_status text not null default 'verified';

alter table public.crm_contacts
  drop constraint if exists crm_contacts_identity_status_check;

alter table public.crm_contacts
  add constraint crm_contacts_identity_status_check
  check (identity_status in ('verified', 'pending_identity_review'));