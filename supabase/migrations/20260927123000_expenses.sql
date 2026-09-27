-- Phase 2b: unified vehicle expenses with automatic maintenance cost sync.

create table public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z_]+$'),
  name_ar text not null,
  name_en text,
  icon text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

grant select on public.expense_categories to authenticated;
grant all on public.expense_categories to service_role;
alter table public.expense_categories enable row level security;
create policy "expense_categories_select" on public.expense_categories
  for select to authenticated using (true);

insert into public.expense_categories (code, name_ar, name_en, icon, sort_order) values
  ('fuel', 'وقود', 'Fuel', 'fuel', 1),
  ('maintenance', 'صيانة', 'Maintenance', 'wrench', 2),
  ('repairs', 'إصلاحات', 'Repairs', 'hammer', 3),
  ('insurance', 'تأمين', 'Insurance', 'shield', 4),
  ('registration', 'رسوم وتجديد', 'Registration & fees', 'file-text', 5),
  ('inspection', 'فحص دوري', 'Inspection', 'clipboard-check', 6),
  ('tires', 'إطارات', 'Tires', 'circle', 7),
  ('washing', 'غسيل وعناية', 'Washing & care', 'sparkles', 8),
  ('parking', 'مواقف', 'Parking', 'square-parking', 9),
  ('tolls', 'طرق ورسوم مرور', 'Tolls', 'badge-dollar-sign', 10),
  ('accessories', 'إكسسوارات', 'Accessories', 'package', 11),
  ('other', 'أخرى', 'Other', 'ellipsis', 99)
on conflict (code) do update set
  name_ar = excluded.name_ar,
  name_en = excluded.name_en,
  icon = excluded.icon,
  sort_order = excluded.sort_order,
  is_active = true;

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  vehicle_id uuid not null,
  category_id uuid not null references public.expense_categories(id) on delete restrict,
  expense_date date not null,
  amount numeric(12,2) not null check (amount >= 0),
  odometer int check (odometer >= 0),
  vendor_name text,
  description text,
  notes text,
  receipt_url text,
  source text not null default 'manual' check (source in ('manual', 'maintenance')),
  maintenance_record_id uuid unique references public.maintenance_records(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (vehicle_id, user_id) references public.vehicles(id, user_id) on delete cascade,
  check (
    (source = 'manual' and maintenance_record_id is null)
    or
    (source = 'maintenance' and maintenance_record_id is not null)
  )
);

create index expenses_user_date_idx on public.expenses(user_id, expense_date desc);
create index expenses_vehicle_date_idx on public.expenses(vehicle_id, expense_date desc);
create index expenses_category_idx on public.expenses(category_id);
create index expenses_source_idx on public.expenses(source);

grant select, insert, update, delete on public.expenses to authenticated;
grant all on public.expenses to service_role;
alter table public.expenses enable row level security;

create policy "expenses_select_own" on public.expenses
  for select to authenticated using (user_id = auth.uid());

create policy "expenses_insert_manual" on public.expenses
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and source = 'manual'
    and maintenance_record_id is null
    and amount > 0
  );

create policy "expenses_update_manual" on public.expenses
  for update to authenticated
  using (user_id = auth.uid() and source = 'manual')
  with check (
    user_id = auth.uid()
    and source = 'manual'
    and maintenance_record_id is null
    and amount > 0
  );

create policy "expenses_delete_manual" on public.expenses
  for delete to authenticated
  using (user_id = auth.uid() and source = 'manual');

create trigger expenses_updated_at
  before update on public.expenses
  for each row execute function public.update_updated_at_column();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'expense-documents',
  'expense-documents',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp','application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "expense_docs_select_own" on storage.objects for select to authenticated
  using (bucket_id = 'expense-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "expense_docs_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'expense-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "expense_docs_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'expense-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "expense_docs_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'expense-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.sync_maintenance_expense() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  _maintenance_category_id uuid;
  _item_name text;
  _amount numeric(12,2);
begin
  if tg_op = 'DELETE' then
    delete from public.expenses where maintenance_record_id = old.id;
    return null;
  end if;

  _amount := coalesce(new.parts_cost, 0) + coalesce(new.labor_cost, 0) + coalesce(new.other_cost, 0);

  if _amount <= 0 then
    delete from public.expenses where maintenance_record_id = new.id;
    return null;
  end if;

  select id into _maintenance_category_id
    from public.expense_categories
   where code = 'maintenance'
   limit 1;

  if _maintenance_category_id is null then
    raise exception 'maintenance expense category is missing';
  end if;

  select name_ar into _item_name
    from public.maintenance_items
   where id = new.maintenance_item_id;

  insert into public.expenses (
    user_id,
    vehicle_id,
    category_id,
    expense_date,
    amount,
    odometer,
    vendor_name,
    description,
    notes,
    receipt_url,
    source,
    maintenance_record_id
  )
  values (
    new.user_id,
    new.vehicle_id,
    _maintenance_category_id,
    new.service_date,
    _amount,
    new.odometer,
    new.workshop_name,
    coalesce(_item_name, 'صيانة'),
    new.notes,
    new.invoice_url,
    'maintenance',
    new.id
  )
  on conflict (maintenance_record_id) do update set
    user_id = excluded.user_id,
    vehicle_id = excluded.vehicle_id,
    category_id = excluded.category_id,
    expense_date = excluded.expense_date,
    amount = excluded.amount,
    odometer = excluded.odometer,
    vendor_name = excluded.vendor_name,
    description = excluded.description,
    notes = excluded.notes,
    receipt_url = excluded.receipt_url,
    source = 'maintenance';

  return null;
end $$;

drop trigger if exists maintenance_expense_sync on public.maintenance_records;
create trigger maintenance_expense_sync
  after insert or update or delete on public.maintenance_records
  for each row execute function public.sync_maintenance_expense();

revoke execute on function public.sync_maintenance_expense() from public, anon, authenticated;

-- Backfill existing paid maintenance records into the unified expense ledger.
insert into public.expenses (
  user_id,
  vehicle_id,
  category_id,
  expense_date,
  amount,
  odometer,
  vendor_name,
  description,
  notes,
  receipt_url,
  source,
  maintenance_record_id
)
select
  r.user_id,
  r.vehicle_id,
  c.id,
  r.service_date,
  r.parts_cost + r.labor_cost + r.other_cost,
  r.odometer,
  r.workshop_name,
  coalesce(i.name_ar, 'صيانة'),
  r.notes,
  r.invoice_url,
  'maintenance',
  r.id
from public.maintenance_records r
join public.expense_categories c on c.code = 'maintenance'
left join public.maintenance_items i on i.id = r.maintenance_item_id
where (r.parts_cost + r.labor_cost + r.other_cost) > 0
on conflict (maintenance_record_id) do update set
  expense_date = excluded.expense_date,
  amount = excluded.amount,
  odometer = excluded.odometer,
  vendor_name = excluded.vendor_name,
  description = excluded.description,
  notes = excluded.notes,
  receipt_url = excluded.receipt_url;
