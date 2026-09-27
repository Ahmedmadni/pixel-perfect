-- Phase 2d: vehicle diagnostics, OBD codes and issue timelines.

create table public.diagnostic_issues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null,
  title text not null,
  symptoms text,
  obd_codes text[] not null default '{}',
  severity text not null default 'medium'
    check (severity in ('low','medium','high','critical')),
  status text not null default 'open'
    check (status in ('open','monitoring','resolved','returned')),
  first_detected_date date not null default current_date,
  first_odometer int check (first_odometer >= 0),
  suspected_cause text,
  confirmed_cause text,
  resolution text,
  resolved_date date,
  resolved_odometer int check (resolved_odometer >= 0),
  maintenance_record_id uuid references public.maintenance_records(id) on delete set null,
  part_id uuid references public.parts(id) on delete set null,
  attachment_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (vehicle_id, user_id) references public.vehicles(id, user_id) on delete cascade,
  check (
    (status <> 'resolved')
    or
    (resolved_date is not null)
  )
);

create table public.diagnostic_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  issue_id uuid not null,
  event_date date not null default current_date,
  odometer int check (odometer >= 0),
  event_type text not null default 'note'
    check (event_type in ('observed','tested','repaired','returned','note')),
  details text not null,
  created_at timestamptz not null default now(),
  foreign key (issue_id, user_id) references public.diagnostic_issues(id, user_id) on delete cascade
);

create index diagnostic_issues_user_status_idx on public.diagnostic_issues(user_id, status);
create index diagnostic_issues_vehicle_date_idx on public.diagnostic_issues(vehicle_id, first_detected_date desc);
create index diagnostic_events_issue_date_idx on public.diagnostic_events(issue_id, event_date desc);

create trigger diagnostic_issues_updated_at
  before update on public.diagnostic_issues
  for each row execute function public.update_updated_at_column();

create or replace function public.validate_diagnostic_links() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.maintenance_record_id is not null and not exists (
    select 1 from public.maintenance_records r
     where r.id = new.maintenance_record_id
       and r.user_id = new.user_id
       and r.vehicle_id = new.vehicle_id
  ) then
    raise exception 'INVALID_DIAGNOSTIC_MAINTENANCE_LINK';
  end if;

  if new.part_id is not null and not exists (
    select 1
      from public.parts p
      join public.part_vehicle_fitments f
        on f.part_id = p.id and f.user_id = p.user_id
     where p.id = new.part_id
       and p.user_id = new.user_id
       and f.vehicle_id = new.vehicle_id
  ) then
    raise exception 'INVALID_DIAGNOSTIC_PART_LINK';
  end if;

  return new;
end $$;

create trigger diagnostic_validate_links
  before insert or update of maintenance_record_id, part_id, user_id, vehicle_id
  on public.diagnostic_issues
  for each row execute function public.validate_diagnostic_links();

revoke execute on function public.validate_diagnostic_links() from public, anon;
grant execute on function public.validate_diagnostic_links() to authenticated;

alter table public.diagnostic_issues enable row level security;
alter table public.diagnostic_events enable row level security;

grant select, insert, update, delete on public.diagnostic_issues to authenticated;
grant select, insert, update, delete on public.diagnostic_events to authenticated;

create policy "diagnostic_issues_own" on public.diagnostic_issues for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "diagnostic_events_own" on public.diagnostic_events for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'diagnostic-documents',
  'diagnostic-documents',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp','application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "diagnostic_docs_select_own" on storage.objects for select to authenticated
  using (bucket_id = 'diagnostic-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "diagnostic_docs_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'diagnostic-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "diagnostic_docs_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'diagnostic-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "diagnostic_docs_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'diagnostic-documents' and (storage.foldername(name))[1] = auth.uid()::text);
