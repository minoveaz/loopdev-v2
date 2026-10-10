-- PostgreSQL stores the original policy's doubled backslash literally, so
-- valid UUID filenames with extensions do not match. A bracketed dot avoids
-- SQL-string escaping ambiguity.
drop policy if exists "document intelligence members can upload own objects" on storage.objects;
create policy "document intelligence members can upload own objects"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'document-intelligence-temp'
  and name ~ '^organizations/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](jpg|jpeg|png|pdf)$'
  and split_part(name, '/', 3)::uuid = auth.uid()
  and public.is_organization_member(split_part(name, '/', 2)::uuid)
);

drop policy if exists "document intelligence members can read own objects" on storage.objects;
create policy "document intelligence members can read own objects"
on storage.objects for select to authenticated
using (
  bucket_id = 'document-intelligence-temp'
  and name ~ '^organizations/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](jpg|jpeg|png|pdf)$'
  and split_part(name, '/', 3)::uuid = auth.uid()
  and public.is_organization_member(split_part(name, '/', 2)::uuid)
);

drop policy if exists "document intelligence members can delete own objects" on storage.objects;
create policy "document intelligence members can delete own objects"
on storage.objects for delete to authenticated
using (
  bucket_id = 'document-intelligence-temp'
  and name ~ '^organizations/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](jpg|jpeg|png|pdf)$'
  and split_part(name, '/', 3)::uuid = auth.uid()
  and public.is_organization_member(split_part(name, '/', 2)::uuid)
);
