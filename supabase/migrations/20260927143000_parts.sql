-- Phase 2c: parts catalog, suppliers, price history, fitments and installations.

insert into public.expense_categories (code, name_ar, name_en, icon, sort_order)
values ('parts', 'قطع غيار', 'Parts', 'package-search', 3)
on conflict (code) do update set
  name_ar = excluded.name_ar,
  name_en = excluded.name_en,
  icon = excluded.icon,
  sort_order = excluded.sort_order,
  is_active = true;

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  website text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.parts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name_ar text not null,
  name_en text,
  part_number text,
  oem_part_number text,
  manufacturer text,
  is_oem boolean not null default false,
  status text not null default 'researching'
    check (status in ('researching','found','purchased','installed','archived')),
  image_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.part_vehicle_fitments (
  part_id uuid not null,
  vehicle_id uuid not null,
  user_id uuid not null,
  notes text,
  created_at timestamptz not null default now(),
  primary key (part_id, vehicle_id),
  foreign key (part_id, user_id) references public.parts(id, user_id) on delete cascade,
  foreign key (vehicle_id, user_id) references public.vehicles(id, user_id) on delete cascade
);

create table public.part_prices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  part_id uuid not null,
  supplier_id uuid,
  price numeric(12,2) not null check (price > 0),
  observed_date date not null default current_date,
  purchase_url text,
  notes text,
  created_at timestamptz not null default now(),
  foreign key (part_id, user_id) references public.parts(id, user_id) on delete cascade,
  foreign key (supplier_id) references public.suppliers(id) on delete set null
);

create table public.part_installations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  part_id uuid not null,
  vehicle_id uuid not null,
  supplier_id uuid,
  maintenance_record_id uuid,
  install_date date not null default current_date,
  odometer int check (odometer >= 0),
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  other_cost numeric(12,2) not null default 0 check (other_cost >= 0),
  total_cost numeric(12,2) generated always as ((quantity * unit_price) + other_cost) stored,
  receipt_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (part_id, user_id) references public.parts(id, user_id) on delete cascade,
  foreign key (vehicle_id, user_id) references public.vehicles(id, user_id) on delete cascade,
  foreign key (supplier_id) references public.suppliers(id) on delete set null,
  foreign key (maintenance_record_id) references public.maintenance_records(id) on delete set null
);

create or replace function public.validate_owned_supplier_link() returns trigger
language plpgsql set search_path = public as $
begin
  if new.supplier_id is not null and not exists (
    select 1 from public.suppliers s
     where s.id = new.supplier_id and s.user_id = new.user_id
  ) then
    raise exception 'INVALID_SUPPLIER_LINK';
  end if;
  return new;
end $;

create trigger part_prices_validate_supplier
  before insert or update of supplier_id, user_id on public.part_prices
  for each row execute function public.validate_owned_supplier_link();

create trigger part_installations_validate_supplier
  before insert or update of supplier_id, user_id on public.part_installations
  for each row execute function public.validate_owned_supplier_link();

revoke execute on function public.validate_owned_supplier_link() from public, anon;
grant execute on function public.validate_owned_supplier_link() to authenticated;

create or replace function public.validate_part_installation_maintenance_link() returns trigger
language plpgsql set search_path = public as $
begin
  if new.maintenance_record_id is not null and not exists (
    select 1
      from public.maintenance_records r
     where r.id = new.maintenance_record_id
       and r.user_id = new.user_id
       and r.vehicle_id = new.vehicle_id
  ) then
    raise exception 'INVALID_PART_MAINTENANCE_LINK';
  end if;
  return new;
end $;

create trigger part_installation_validate_maintenance
  before insert or update of maintenance_record_id, user_id, vehicle_id
  on public.part_installations
  for each row execute function public.validate_part_installation_maintenance_link();

revoke execute on function public.validate_part_installation_maintenance_link() from public, anon;
grant execute on function public.validate_part_installation_maintenance_link() to authenticated;


create index suppliers_user_idx on public.suppliers(user_id);
create index parts_user_status_idx on public.parts(user_id, status);
create index part_fitments_vehicle_idx on public.part_vehicle_fitments(vehicle_id);
create index part_prices_part_date_idx on public.part_prices(part_id, observed_date desc);
create index part_installations_vehicle_date_idx on public.part_installations(vehicle_id, install_date desc);
create index part_installations_part_idx on public.part_installations(part_id);
create index part_installations_maintenance_idx on public.part_installations(maintenance_record_id);

create trigger suppliers_updated_at
  before update on public.suppliers
  for each row execute function public.update_updated_at_column();
create trigger parts_updated_at
  before update on public.parts
  for each row execute function public.update_updated_at_column();
create trigger part_installations_updated_at
  before update on public.part_installations
  for each row execute function public.update_updated_at_column();

alter table public.suppliers enable row level security;
alter table public.parts enable row level security;
alter table public.part_vehicle_fitments enable row level security;
alter table public.part_prices enable row level security;
alter table public.part_installations enable row level security;

grant select, insert, update, delete on public.suppliers to authenticated;
grant select, insert, update, delete on public.parts to authenticated;
grant select, insert, update, delete on public.part_vehicle_fitments to authenticated;
grant select, insert, update, delete on public.part_prices to authenticated;
grant select, insert, update, delete on public.part_installations to authenticated;

create policy "suppliers_own" on public.suppliers for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "parts_own" on public.parts for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "part_fitments_own" on public.part_vehicle_fitments for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "part_prices_own" on public.part_prices for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "part_installations_own" on public.part_installations for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'part-documents',
  'part-documents',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp','application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "part_docs_select_own" on storage.objects for select to authenticated
  using (bucket_id = 'part-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "part_docs_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'part-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "part_docs_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'part-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "part_docs_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'part-documents' and (storage.foldername(name))[1] = auth.uid()::text);

alter table public.expenses
  add column part_installation_id uuid unique references public.part_installations(id) on delete cascade;

alter table public.expenses drop constraint if exists expenses_source_check;
alter table public.expenses drop constraint if exists expenses_check;

alter table public.expenses
  add constraint expenses_source_check
    check (source in ('manual','maintenance','part')),
  add constraint expenses_source_link_check
    check (
      (source = 'manual' and maintenance_record_id is null and part_installation_id is null)
      or
      (source = 'maintenance' and maintenance_record_id is not null and part_installation_id is null)
      or
      (source = 'part' and maintenance_record_id is null and part_installation_id is not null)
    );

create index expenses_part_installation_idx on public.expenses(part_installation_id);

create or replace function public.sync_part_installation_expense() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  _category_id uuid;
  _part_name text;
  _supplier_name text;
begin
  if tg_op = 'DELETE' then
    delete from public.expenses where part_installation_id = old.id;
    return null;
  end if;

  -- A part linked to a maintenance record is already included in the maintenance
  -- expense ledger. Never create a second expense row for it.
  if new.maintenance_record_id is not null or new.total_cost <= 0 then
    delete from public.expenses where part_installation_id = new.id;
    return null;
  end if;

  select id into _category_id
    from public.expense_categories
   where code = 'parts'
   limit 1;

  select name_ar into _part_name
    from public.parts
   where id = new.part_id and user_id = new.user_id;

  if new.supplier_id is not null then
    select name into _supplier_name
      from public.suppliers
     where id = new.supplier_id and user_id = new.user_id;
  end if;

  insert into public.expenses (
    user_id, vehicle_id, category_id, expense_date, amount, odometer,
    vendor_name, description, notes, receipt_url, source, part_installation_id
  )
  values (
    new.user_id, new.vehicle_id, _category_id, new.install_date, new.total_cost, new.odometer,
    _supplier_name, coalesce(_part_name, 'قطعة غيار'), new.notes, new.receipt_url, 'part', new.id
  )
  on conflict (part_installation_id) do update set
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
    source = 'part';

  return null;
end $$;

create trigger part_installation_expense_sync
  after insert or update or delete on public.part_installations
  for each row execute function public.sync_part_installation_expense();

revoke execute on function public.sync_part_installation_expense() from public, anon, authenticated;
