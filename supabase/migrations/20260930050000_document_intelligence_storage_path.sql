-- Keep the temporary object path on the document aggregate so a review can
-- be reopened even if extraction JSON is edited or normalized later.

do $storage_setup$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'document-intelligence-temp',
      'document-intelligence-temp',
      false,
      10485760,
      array['image/jpeg', 'image/png', 'application/pdf']::text[]
    )
    on conflict (id) do update set
      name = excluded.name,
      public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
  end if;
end
$storage_setup$;

alter table public.document_intelligence_documents
  add column if not exists temporary_storage_path text;
