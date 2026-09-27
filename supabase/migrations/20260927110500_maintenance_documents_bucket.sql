-- Ensure the maintenance invoice bucket exists with the limits expected by the UI.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'maintenance-documents',
  'maintenance-documents',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp','application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
