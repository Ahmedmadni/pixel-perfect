-- Phase 2e: vehicle documents and reminders with automatic expiry reminder sync.

create table public.vehicle_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null,
  document_type text not null default 'other'
    check (document_type in ('registration','insurance','inspection','ownership','warranty','invoice','other')),
  title text not null,
  document_date date,
  expiry_date date,
  remind_days_before int not null default 30 check (remind_days_before >= 0 and remind_days_before <= 3650),
  issuer text,
  reference_number text,
  file_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (vehicle_id, user_id) references public.vehicles(id, user_id) on delete cascade
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null,
  title text not null,
  reminder_type text not null default 'custom'
    check (reminder_type in ('registration','insurance','inspection','maintenance','document','custom')),
  due_date date,
  due_odometer int check (due_odometer >= 0),
  recurring_months int check (recurring_months > 0),
  recurring_km int check (recurring_km > 0),
  status text not null default 'active'
    check (status in ('active','completed','dismissed')),
  document_id uuid unique references public.vehicle_documents(id) on delete cascade,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (vehicle_id, user_id) references public.vehicles(id, user_id) on delete cascade,
  check (due_date is not null or due_odometer is not null)
);

create index vehicle_documents_vehicle_idx on public.vehicle_documents(vehicle_id);
create index vehicle_documents_expiry_idx on public.vehicle_documents(user_id, expiry_date);
create index reminders_user_status_idx on public.reminders(user_id, status);
create index reminders_vehicle_due_idx on public.reminders(vehicle_id, due_date);
create index reminders_odometer_idx on public.reminders(vehicle_id, due_odometer);

create trigger vehicle_documents_updated_at
  before update on public.vehicle_documents
  for each row execute function public.update_updated_at_column();
create trigger reminders_updated_at
  before update on public.reminders
  for each row execute function public.update_updated_at_column();

create or replace function public.advance_recurring_reminder() returns trigger
language plpgsql set search_path = public as $
begin
  if old.document_id is null
     and old.status <> 'completed'
     and new.status = 'completed'
     and (old.recurring_months is not null or old.recurring_km is not null) then

    if old.recurring_months is not null and old.due_date is not null then
      new.due_date := (old.due_date + make_interval(months => old.recurring_months))::date;
    end if;

    if old.recurring_km is not null and old.due_odometer is not null then
      new.due_odometer := old.due_odometer + old.recurring_km;
    end if;

    new.status := 'active';
  end if;
  return new;
end $;

create trigger reminders_advance_recurring
  before update of status on public.reminders
  for each row execute function public.advance_recurring_reminder();

revoke execute on function public.advance_recurring_reminder() from public, anon;
grant execute on function public.advance_recurring_reminder() to authenticated;


alter table public.vehicle_documents enable row level security;
alter table public.reminders enable row level security;

grant select, insert, update, delete on public.vehicle_documents to authenticated;
grant select, insert, update, delete on public.reminders to authenticated;

create policy "vehicle_documents_own" on public.vehicle_documents for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "reminders_select_own" on public.reminders for select to authenticated
  using (user_id = auth.uid());

create policy "reminders_insert_manual" on public.reminders for insert to authenticated
  with check (user_id = auth.uid() and document_id is null);

create policy "reminders_update_manual" on public.reminders for update to authenticated
  using (user_id = auth.uid() and document_id is null)
  with check (user_id = auth.uid() and document_id is null);

create policy "reminders_delete_manual" on public.reminders for delete to authenticated
  using (user_id = auth.uid() and document_id is null);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vehicle-documents',
  'vehicle-documents',
  false,
  15728640,
  array['image/jpeg','image/png','image/webp','application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "vehicle_docs_select_own" on storage.objects for select to authenticated
  using (bucket_id = 'vehicle-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "vehicle_docs_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'vehicle-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "vehicle_docs_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'vehicle-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "vehicle_docs_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'vehicle-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.validate_reminder_document_link() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.document_id is not null and not exists (
    select 1 from public.vehicle_documents d
     where d.id = new.document_id
       and d.user_id = new.user_id
       and d.vehicle_id = new.vehicle_id
  ) then
    raise exception 'INVALID_REMINDER_DOCUMENT_LINK';
  end if;
  return new;
end $$;

create trigger reminder_validate_document
  before insert or update of document_id, user_id, vehicle_id
  on public.reminders
  for each row execute function public.validate_reminder_document_link();

revoke execute on function public.validate_reminder_document_link() from public, anon;
grant execute on function public.validate_reminder_document_link() to authenticated;

create or replace function public.sync_document_reminder() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  _type text;
  _due date;
begin
  if tg_op = 'DELETE' then
    delete from public.reminders where document_id = old.id;
    return null;
  end if;

  if new.expiry_date is null then
    delete from public.reminders where document_id = new.id;
    return null;
  end if;

  _type := case new.document_type
    when 'registration' then 'registration'
    when 'insurance' then 'insurance'
    when 'inspection' then 'inspection'
    else 'document'
  end;

  _due := new.expiry_date - new.remind_days_before;

  insert into public.reminders (
    user_id, vehicle_id, title, reminder_type, due_date, status, document_id, notes
  )
  values (
    new.user_id,
    new.vehicle_id,
    'تجديد ' || new.title,
    _type,
    _due,
    'active',
    new.id,
    'انتهاء المستند: ' || new.expiry_date::text
  )
  on conflict (document_id) do update set
    user_id = excluded.user_id,
    vehicle_id = excluded.vehicle_id,
    title = excluded.title,
    reminder_type = excluded.reminder_type,
    due_date = excluded.due_date,
    status = 'active',
    notes = excluded.notes;

  return null;
end $$;

create trigger document_reminder_sync
  after insert or update or delete on public.vehicle_documents
  for each row execute function public.sync_document_reminder();

revoke execute on function public.sync_document_reminder() from public, anon, authenticated;
