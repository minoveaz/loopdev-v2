-- Hardening for controlled production use of sensitive documents.

alter table public.document_intelligence_audit_events
  drop constraint if exists document_intelligence_audit_events_event_type_check;
alter table public.document_intelligence_audit_events
  add constraint document_intelligence_audit_events_event_type_check
  check (event_type in (
    'uploaded', 'processing_started', 'processing_completed', 'manual_edit',
    'approved', 'rejected', 'retry_requested', 'failure_recovered',
    'viewed', 'downloaded', 'associated', 'promoted', 'deleted'
  ));

create table if not exists public.document_intelligence_worker_runs (
  id uuid primary key default gen_random_uuid(),
  worker_name text not null check (worker_name = 'document-intelligence-worker'),
  status text not null check (status in ('completed', 'failed')),
  expired_documents integer not null default 0,
  promotion_issues integer not null default 0,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz not null default now()
);

alter table public.document_intelligence_worker_runs enable row level security;
revoke all on public.document_intelligence_worker_runs from anon, authenticated;

do $storage_hardening$
begin
  if to_regclass('storage.objects') is not null then
    execute $policy$
      drop policy if exists platform_files_storage_select on storage.objects;
      create policy platform_files_storage_select
      on storage.objects for select to authenticated
      using (
        bucket_id = 'platform-files'
        and exists (
          select 1
          from public.organizations organization
          where organization.id::text = split_part(name, '/', 2)
            and public.is_organization_member(organization.id)
        )
      );

      drop policy if exists platform_files_storage_insert on storage.objects;
      create policy platform_files_storage_insert
      on storage.objects for insert to authenticated
      with check (
        bucket_id = 'platform-files'
        and exists (
          select 1
          from public.organizations organization
          where organization.id::text = split_part(name, '/', 2)
            and public.has_organization_role(organization.id, array['owner', 'admin', 'agent'])
        )
      );

      drop policy if exists platform_files_storage_update on storage.objects;
      create policy platform_files_storage_update
      on storage.objects for update to authenticated
      using (
        bucket_id = 'platform-files'
        and exists (
          select 1
          from public.organizations organization
          where organization.id::text = split_part(name, '/', 2)
            and public.has_organization_role(organization.id, array['owner', 'admin', 'agent'])
        )
      )
      with check (
        bucket_id = 'platform-files'
        and exists (
          select 1
          from public.organizations organization
          where organization.id::text = split_part(name, '/', 2)
            and public.has_organization_role(organization.id, array['owner', 'admin', 'agent'])
        )
      );

      drop policy if exists platform_files_storage_delete on storage.objects;
      create policy platform_files_storage_delete
      on storage.objects for delete to authenticated
      using (
        bucket_id = 'platform-files'
        and exists (
          select 1
          from public.organizations organization
          where organization.id::text = split_part(name, '/', 2)
            and public.has_organization_role(organization.id, array['owner', 'admin', 'agent'])
        )
      );
    $policy$;
  end if;
end;
$storage_hardening$;
