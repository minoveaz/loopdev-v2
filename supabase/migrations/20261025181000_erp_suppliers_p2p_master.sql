insert into public.permissions (key, description, scope)
values ('supplier.verify', 'Verify organization supplier payee instructions', 'organization')
on conflict (key) do nothing;

insert into public.role_permissions (role, permission_key)
values ('owner', 'supplier.verify'), ('admin', 'supplier.verify')
on conflict (role, permission_key) do nothing;

alter table public.erp_supplier_audit_events
  drop constraint if exists erp_supplier_audit_events_record_type_check;
alter table public.erp_supplier_audit_events
  add constraint erp_supplier_audit_events_record_type_check
  check (record_type in (
    'supplier',
    'supplier_item',
    'supplier_contact',
    'supplier_address',
    'supplier_purchase_defaults',
    'supplier_payee_instruction'
  ));

create table if not exists public.erp_supplier_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  supplier_id uuid not null,
  name text not null,
  email text,
  phone text,
  role text not null,
  is_primary boolean not null default false,
  status text not null default 'active',
  version integer not null default 1,
  created_by uuid not null default auth.uid(),
  updated_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (organization_id, supplier_id)
    references public.erp_suppliers(organization_id, id) on delete restrict
    deferrable initially deferred,
  check (length(trim(name)) > 0),
  check (email is null or email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  check (role in ('purchasing', 'receiving', 'ap_invoices', 'remittance')),
  check (status in ('active', 'inactive')),
  check (version > 0)
);

create unique index if not exists erp_supplier_contacts_primary_role_unique
  on public.erp_supplier_contacts(organization_id, supplier_id, role)
  where is_primary and status = 'active';
create index if not exists erp_supplier_contacts_org_supplier_idx
  on public.erp_supplier_contacts(organization_id, supplier_id, status);

create table if not exists public.erp_supplier_addresses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  supplier_id uuid not null,
  label text not null,
  purpose text not null,
  address_lines text[] not null,
  locality text not null,
  region text,
  postal_code text,
  country_code text not null,
  is_primary boolean not null default false,
  status text not null default 'active',
  version integer not null default 1,
  created_by uuid not null default auth.uid(),
  updated_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, supplier_id, id),
  foreign key (organization_id, supplier_id)
    references public.erp_suppliers(organization_id, id) on delete restrict
    deferrable initially deferred,
  check (length(trim(label)) > 0),
  check (purpose in ('legal', 'billing', 'order', 'ship_from', 'remit_to', 'returns')),
  check (cardinality(address_lines) > 0),
  check (length(trim(array_to_string(address_lines, ''))) > 0),
  check (length(trim(locality)) > 0),
  check (country_code ~ '^[A-Z]{2}$'),
  check (status in ('active', 'inactive')),
  check (version > 0)
);

create unique index if not exists erp_supplier_addresses_primary_purpose_unique
  on public.erp_supplier_addresses(organization_id, supplier_id, purpose)
  where is_primary and status = 'active';
create index if not exists erp_supplier_addresses_org_supplier_idx
  on public.erp_supplier_addresses(organization_id, supplier_id, status);

create table if not exists public.erp_supplier_purchase_defaults (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  supplier_id uuid not null,
  currency text,
  payment_term_code text,
  delivery_term_code text,
  delivery_address_id uuid,
  finance_reference text,
  version integer not null default 1,
  created_by uuid not null default auth.uid(),
  updated_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, supplier_id),
  foreign key (organization_id, supplier_id)
    references public.erp_suppliers(organization_id, id) on delete restrict
    deferrable initially deferred,
  foreign key (organization_id, supplier_id, delivery_address_id)
    references public.erp_supplier_addresses(organization_id, supplier_id, id) on delete restrict,
  check (currency is null or currency ~ '^[A-Z]{3}$'),
  check (payment_term_code is null or length(payment_term_code) <= 60),
  check (delivery_term_code is null or length(delivery_term_code) <= 60),
  check (finance_reference is null or length(finance_reference) <= 120),
  check (version > 0)
);

create table if not exists public.erp_supplier_payment_instructions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  supplier_id uuid not null,
  beneficiary_name text not null,
  bank_country_code text not null,
  bank_name text,
  account_identifier text not null,
  currency text not null,
  status text not null default 'pending_review',
  rejection_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  verified_by uuid,
  verified_at timestamptz,
  version integer not null default 1,
  created_by uuid not null default auth.uid(),
  updated_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (organization_id, supplier_id)
    references public.erp_suppliers(organization_id, id) on delete restrict
    deferrable initially deferred,
  check (length(trim(beneficiary_name)) > 0),
  check (bank_country_code ~ '^[A-Z]{2}$'),
  check (length(trim(account_identifier)) > 0),
  check (currency ~ '^[A-Z]{3}$'),
  check (status in ('pending_review', 'verified', 'rejected', 'inactive')),
  check (version > 0),
  check ((status = 'verified') = (verified_by is not null and verified_at is not null))
);

create index if not exists erp_supplier_payment_instructions_org_supplier_idx
  on public.erp_supplier_payment_instructions(organization_id, supplier_id, status);

create or replace function public.audit_erp_supplier_p2p_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  changed_fields jsonb := '{}'::jsonb;
  current_row jsonb;
  previous_row jsonb;
  field_name text;
begin
  current_row := to_jsonb(new);
  if tg_op = 'INSERT' then
    new.version := 1;
    new.updated_by := auth.uid();
    new.updated_at := now();
    current_row := to_jsonb(new);
    for field_name in select jsonb_object_keys(current_row) loop
      if field_name not in ('id', 'organization_id', 'supplier_id', 'created_by', 'updated_by', 'created_at', 'updated_at', 'version') then
        changed_fields := changed_fields || jsonb_build_object(field_name, true);
      end if;
    end loop;
  else
    previous_row := to_jsonb(old);
    new.version := old.version + 1;
    new.updated_by := auth.uid();
    new.updated_at := now();
    current_row := to_jsonb(new);
    for field_name in select jsonb_object_keys(current_row) loop
      if field_name not in ('id', 'organization_id', 'supplier_id', 'created_by', 'updated_by', 'created_at', 'updated_at', 'version')
        and previous_row -> field_name is distinct from current_row -> field_name then
        changed_fields := changed_fields || jsonb_build_object(field_name, true);
      end if;
    end loop;
  end if;

  if tg_table_name = 'erp_supplier_payment_instructions' then
    if changed_fields ?| array['beneficiary_name', 'bank_country_code', 'bank_name', 'account_identifier', 'currency'] then
      changed_fields := (changed_fields - 'beneficiary_name' - 'bank_country_code' - 'bank_name' - 'account_identifier' - 'currency')
        || jsonb_build_object('sensitive_details', true);
    end if;
  end if;

  insert into public.erp_supplier_audit_events
    (organization_id, supplier_id, record_type, record_id, action, actor_id, changed_fields)
  values
    (new.organization_id, new.supplier_id, tg_argv[0], new.id,
      case when tg_op = 'INSERT' then 'created' else 'updated' end,
      auth.uid(), changed_fields);
  return new;
end;
$$;

create or replace function public.guard_erp_supplier_payee_review()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  sensitive_fields_changed boolean;
  review_fields_changed boolean;
begin
  if tg_op = 'INSERT' then
    if new.status <> 'pending_review' or new.verified_by is not null or new.verified_at is not null then
      raise exception 'New payee instructions must be pending review' using errcode = '23514';
    end if;
    return new;
  end if;

  sensitive_fields_changed :=
    old.beneficiary_name is distinct from new.beneficiary_name
    or old.bank_country_code is distinct from new.bank_country_code
    or old.bank_name is distinct from new.bank_name
    or old.account_identifier is distinct from new.account_identifier
    or old.currency is distinct from new.currency;

  if sensitive_fields_changed then
    new.status := 'pending_review';
    new.rejection_reason := null;
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.verified_by := null;
    new.verified_at := null;
  end if;

  if new.status = 'inactive' then
    new.verified_by := null;
    new.verified_at := null;
  end if;

  review_fields_changed :=
    old.status is distinct from new.status
    or old.rejection_reason is distinct from new.rejection_reason
    or old.reviewed_by is distinct from new.reviewed_by
    or old.reviewed_at is distinct from new.reviewed_at
    or old.verified_by is distinct from new.verified_by
    or old.verified_at is distinct from new.verified_at;

  if review_fields_changed and not sensitive_fields_changed and new.status <> 'inactive' then
    if not public.has_organization_permission(old.organization_id, 'supplier.verify') then
      raise exception 'Only an organization owner or admin may review payee instructions' using errcode = '42501';
    end if;
    if auth.uid() = old.updated_by then
      raise exception 'The payee editor cannot review their own instruction' using errcode = '42501';
    end if;
    if new.status in ('verified', 'rejected') then
      new.reviewed_by := auth.uid();
      new.reviewed_at := now();
    end if;
    if new.status = 'verified' then
      new.verified_by := auth.uid();
      new.verified_at := now();
      new.rejection_reason := null;
    elsif new.status = 'rejected' then
      if length(trim(coalesce(new.rejection_reason, ''))) = 0 then
        raise exception 'A rejection reason is required' using errcode = '23514';
      end if;
      new.verified_by := null;
      new.verified_at := null;
    elsif new.status = 'pending_review' then
      new.verified_by := null;
      new.verified_at := null;
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.review_erp_supplier_payee_instruction(
  p_instruction_id uuid,
  p_organization_id uuid,
  p_expected_version integer,
  p_decision text,
  p_rejection_reason text
)
returns public.erp_supplier_payment_instructions
language plpgsql
security definer
set search_path = public
as $$
declare
  instruction public.erp_supplier_payment_instructions;
begin
  if p_decision not in ('verified', 'rejected') then
    raise exception 'Unsupported payee review decision' using errcode = '23514';
  end if;
  if p_decision = 'rejected' and length(trim(coalesce(p_rejection_reason, ''))) = 0 then
    raise exception 'A rejection reason is required' using errcode = '23514';
  end if;
  if not public.has_organization_permission(p_organization_id, 'supplier.verify') then
    raise exception 'Only an organization owner or admin may review payee instructions' using errcode = '42501';
  end if;

  select * into instruction
  from public.erp_supplier_payment_instructions
  where id = p_instruction_id and organization_id = p_organization_id
  for update;
  if not found then
    raise exception 'Payee instruction not found' using errcode = 'P0002';
  end if;
  if instruction.version <> p_expected_version then
    raise exception 'Payee instruction changed since it was loaded' using errcode = '40001';
  end if;
  if instruction.status <> 'pending_review' then
    raise exception 'Only pending payee instructions can be reviewed' using errcode = '23514';
  end if;
  if instruction.updated_by = auth.uid() then
    raise exception 'The payee editor cannot review their own instruction' using errcode = '42501';
  end if;

  update public.erp_supplier_payment_instructions
  set status = p_decision,
      rejection_reason = case when p_decision = 'rejected' then trim(p_rejection_reason) else null end,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      verified_by = case when p_decision = 'verified' then auth.uid() else null end,
      verified_at = case when p_decision = 'verified' then now() else null end
  where id = p_instruction_id
  returning * into instruction;
  return instruction;
end;
$$;

create or replace function public.can_review_erp_supplier_payee(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_organization_permission(p_organization_id, 'supplier.verify');
$$;

revoke all on function public.can_review_erp_supplier_payee(uuid) from public;
grant execute on function public.can_review_erp_supplier_payee(uuid) to authenticated;
revoke all on function public.review_erp_supplier_payee_instruction(uuid, uuid, integer, text, text) from public;
grant execute on function public.review_erp_supplier_payee_instruction(uuid, uuid, integer, text, text) to authenticated;

create or replace function public.validate_erp_supplier_p2p_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.organization_id <> old.organization_id or new.supplier_id <> old.supplier_id then
    raise exception 'Supplier setup ownership cannot change' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists erp_supplier_contacts_audit on public.erp_supplier_contacts;
create trigger erp_supplier_contacts_audit
  before insert or update on public.erp_supplier_contacts
  for each row execute function public.audit_erp_supplier_p2p_mutation('supplier_contact');
drop trigger if exists erp_supplier_addresses_audit on public.erp_supplier_addresses;
create trigger erp_supplier_addresses_audit
  before insert or update on public.erp_supplier_addresses
  for each row execute function public.audit_erp_supplier_p2p_mutation('supplier_address');
drop trigger if exists erp_supplier_purchase_defaults_audit on public.erp_supplier_purchase_defaults;
create trigger erp_supplier_purchase_defaults_audit
  before insert or update on public.erp_supplier_purchase_defaults
  for each row execute function public.audit_erp_supplier_p2p_mutation('supplier_purchase_defaults');
drop trigger if exists a_erp_supplier_payee_review_guard on public.erp_supplier_payment_instructions;
create trigger a_erp_supplier_payee_review_guard
  before insert or update on public.erp_supplier_payment_instructions
  for each row execute function public.guard_erp_supplier_payee_review();
drop trigger if exists z_erp_supplier_payee_audit on public.erp_supplier_payment_instructions;
create trigger z_erp_supplier_payee_audit
  before insert or update on public.erp_supplier_payment_instructions
  for each row execute function public.audit_erp_supplier_p2p_mutation('supplier_payee_instruction');

drop trigger if exists erp_supplier_contacts_immutable_owner on public.erp_supplier_contacts;
create trigger erp_supplier_contacts_immutable_owner
  before update of organization_id, supplier_id on public.erp_supplier_contacts
  for each row execute function public.validate_erp_supplier_p2p_update();
drop trigger if exists erp_supplier_addresses_immutable_owner on public.erp_supplier_addresses;
create trigger erp_supplier_addresses_immutable_owner
  before update of organization_id, supplier_id on public.erp_supplier_addresses
  for each row execute function public.validate_erp_supplier_p2p_update();
drop trigger if exists erp_supplier_purchase_defaults_immutable_owner on public.erp_supplier_purchase_defaults;
create trigger erp_supplier_purchase_defaults_immutable_owner
  before update of organization_id, supplier_id on public.erp_supplier_purchase_defaults
  for each row execute function public.validate_erp_supplier_p2p_update();
drop trigger if exists erp_supplier_payment_instructions_immutable_owner on public.erp_supplier_payment_instructions;
create trigger erp_supplier_payment_instructions_immutable_owner
  before update of organization_id, supplier_id on public.erp_supplier_payment_instructions
  for each row execute function public.validate_erp_supplier_p2p_update();

drop trigger if exists erp_supplier_contacts_no_delete on public.erp_supplier_contacts;
create trigger erp_supplier_contacts_no_delete before delete on public.erp_supplier_contacts
  for each row execute function public.audit_erp_supplier_delete();
drop trigger if exists erp_supplier_addresses_no_delete on public.erp_supplier_addresses;
create trigger erp_supplier_addresses_no_delete before delete on public.erp_supplier_addresses
  for each row execute function public.audit_erp_supplier_delete();
drop trigger if exists erp_supplier_purchase_defaults_no_delete on public.erp_supplier_purchase_defaults;
create trigger erp_supplier_purchase_defaults_no_delete before delete on public.erp_supplier_purchase_defaults
  for each row execute function public.audit_erp_supplier_delete();
drop trigger if exists erp_supplier_payment_instructions_no_delete on public.erp_supplier_payment_instructions;
create trigger erp_supplier_payment_instructions_no_delete before delete on public.erp_supplier_payment_instructions
  for each row execute function public.audit_erp_supplier_delete();

alter table public.erp_supplier_contacts enable row level security;
alter table public.erp_supplier_addresses enable row level security;
alter table public.erp_supplier_purchase_defaults enable row level security;
alter table public.erp_supplier_payment_instructions enable row level security;

grant select, insert, update on public.erp_supplier_contacts to authenticated;
grant select, insert, update on public.erp_supplier_addresses to authenticated;
grant select, insert, update on public.erp_supplier_purchase_defaults to authenticated;
grant select, insert, update on public.erp_supplier_payment_instructions to authenticated;
revoke delete on public.erp_supplier_contacts from authenticated;
revoke delete on public.erp_supplier_addresses from authenticated;
revoke delete on public.erp_supplier_purchase_defaults from authenticated;
revoke delete on public.erp_supplier_payment_instructions from authenticated;

drop policy if exists erp_supplier_contacts_read on public.erp_supplier_contacts;
create policy erp_supplier_contacts_read on public.erp_supplier_contacts
  for select to authenticated
  using (public.has_organization_permission(organization_id, 'supplier.read'));
drop policy if exists erp_supplier_contacts_manage on public.erp_supplier_contacts;
create policy erp_supplier_contacts_manage on public.erp_supplier_contacts
  for insert to authenticated
  with check (public.has_organization_permission(organization_id, 'supplier.manage'));
drop policy if exists erp_supplier_contacts_update on public.erp_supplier_contacts;
create policy erp_supplier_contacts_update on public.erp_supplier_contacts
  for update to authenticated
  using (public.has_organization_permission(organization_id, 'supplier.manage'))
  with check (public.has_organization_permission(organization_id, 'supplier.manage'));

drop policy if exists erp_supplier_addresses_read on public.erp_supplier_addresses;
create policy erp_supplier_addresses_read on public.erp_supplier_addresses
  for select to authenticated
  using (public.has_organization_permission(organization_id, 'supplier.read'));
drop policy if exists erp_supplier_addresses_manage on public.erp_supplier_addresses;
create policy erp_supplier_addresses_manage on public.erp_supplier_addresses
  for insert to authenticated
  with check (public.has_organization_permission(organization_id, 'supplier.manage'));
drop policy if exists erp_supplier_addresses_update on public.erp_supplier_addresses;
create policy erp_supplier_addresses_update on public.erp_supplier_addresses
  for update to authenticated
  using (public.has_organization_permission(organization_id, 'supplier.manage'))
  with check (public.has_organization_permission(organization_id, 'supplier.manage'));

drop policy if exists erp_supplier_purchase_defaults_read on public.erp_supplier_purchase_defaults;
create policy erp_supplier_purchase_defaults_read on public.erp_supplier_purchase_defaults
  for select to authenticated
  using (public.has_organization_permission(organization_id, 'supplier.read'));
drop policy if exists erp_supplier_purchase_defaults_manage on public.erp_supplier_purchase_defaults;
create policy erp_supplier_purchase_defaults_manage on public.erp_supplier_purchase_defaults
  for insert to authenticated
  with check (public.has_organization_permission(organization_id, 'supplier.manage'));
drop policy if exists erp_supplier_purchase_defaults_update on public.erp_supplier_purchase_defaults;
create policy erp_supplier_purchase_defaults_update on public.erp_supplier_purchase_defaults
  for update to authenticated
  using (public.has_organization_permission(organization_id, 'supplier.manage'))
  with check (public.has_organization_permission(organization_id, 'supplier.manage'));

drop policy if exists erp_supplier_payment_instructions_read on public.erp_supplier_payment_instructions;
create policy erp_supplier_payment_instructions_read on public.erp_supplier_payment_instructions
  for select to authenticated
  using (public.has_organization_permission(organization_id, 'supplier.read'));
drop policy if exists erp_supplier_payment_instructions_manage on public.erp_supplier_payment_instructions;
create policy erp_supplier_payment_instructions_manage on public.erp_supplier_payment_instructions
  for insert to authenticated
  with check (public.has_organization_permission(organization_id, 'supplier.manage'));
drop policy if exists erp_supplier_payment_instructions_update on public.erp_supplier_payment_instructions;
create policy erp_supplier_payment_instructions_update on public.erp_supplier_payment_instructions
  for update to authenticated
  using (public.has_organization_permission(organization_id, 'supplier.manage'))
  with check (public.has_organization_permission(organization_id, 'supplier.manage'));
