-- Match the deployed authenticated table privileges; RLS remains the
-- row-level authorization boundary for every operation.
grant select, insert, update, delete on public.platform_files to authenticated;
grant select, insert, update, delete on public.platform_file_versions to authenticated;
grant select, insert, update, delete on public.platform_file_upload_sessions to authenticated;
