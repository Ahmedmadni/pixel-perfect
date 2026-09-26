-- Phase 2: Maintenance engine
alter table public.vehicles add constraint vehicles_id_user_uidx unique (id, user_id);

create table public.maintenance_categories (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null, name_en text, icon text,
  sort_order int not null default 0, is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.maintenance_categories to authenticated;
grant all on public.maintenance_categories to service_role;
alter table public.maintenance_categories enable row level security;
create policy "mcat_select" on public.maintenance_categories for select to authenticated using (true);

create table public.maintenance_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.maintenance_categories(id) on delete set null,
  user_id uuid references auth.users(id) on delete cascade,
  name_ar text not null check (char_length(name_ar) between 1 and 80),
  name_en text, description text,
  default_interval_km int check (default_interval_km > 0),
  default_interval_months int check (default_interval_months > 0),
  is_recurring boolean not null default true,
  is_system boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((is_system and user_id is null) or (not is_system and user_id is not null))
);
create index maintenance_items_user_idx on public.maintenance_items(user_id);
grant select, insert, update, delete on public.maintenance_items to authenticated;
grant all on public.maintenance_items to service_role;
alter table public.maintenance_items enable row level security;
create policy "mitem_select" on public.maintenance_items for select to authenticated using (is_system or user_id = auth.uid());
create policy "mitem_insert" on public.maintenance_items for insert to authenticated with check (not is_system and user_id = auth.uid());
create policy "mitem_update" on public.maintenance_items for update to authenticated using (not is_system and user_id = auth.uid()) with check (not is_system and user_id = auth.uid());
create policy "mitem_delete" on public.maintenance_items for delete to authenticated using (not is_system and user_id = auth.uid());
create trigger maintenance_items_updated_at before update on public.maintenance_items for each row execute function public.update_updated_at_column();

create table public.vehicle_maintenance_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  vehicle_id uuid not null,
  maintenance_item_id uuid not null references public.maintenance_items(id) on delete cascade,
  interval_km int check (interval_km > 0),
  interval_months int check (interval_months > 0),
  last_service_date date,
  last_service_odometer int check (last_service_odometer >= 0),
  next_due_date date,
  next_due_odometer int,
  is_enabled boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (vehicle_id, user_id) references public.vehicles(id, user_id) on delete cascade,
  unique (vehicle_id, maintenance_item_id)
);
create index vms_user_idx on public.vehicle_maintenance_schedules(user_id);
grant select, insert, update, delete on public.vehicle_maintenance_schedules to authenticated;
grant all on public.vehicle_maintenance_schedules to service_role;
alter table public.vehicle_maintenance_schedules enable row level security;
create policy "vms_select_own" on public.vehicle_maintenance_schedules for select to authenticated using (user_id = auth.uid());
create policy "vms_insert_own" on public.vehicle_maintenance_schedules for insert to authenticated with check (user_id = auth.uid());
create policy "vms_update_own" on public.vehicle_maintenance_schedules for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "vms_delete_own" on public.vehicle_maintenance_schedules for delete to authenticated using (user_id = auth.uid());

create table public.maintenance_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  vehicle_id uuid not null,
  schedule_id uuid references public.vehicle_maintenance_schedules(id) on delete set null,
  maintenance_item_id uuid not null references public.maintenance_items(id) on delete restrict,
  service_date date not null,
  odometer int not null check (odometer >= 0),
  parts_cost numeric(12,2) not null default 0 check (parts_cost >= 0),
  labor_cost numeric(12,2) not null default 0 check (labor_cost >= 0),
  other_cost numeric(12,2) not null default 0 check (other_cost >= 0),
  total_cost numeric(12,2) generated always as (parts_cost + labor_cost + other_cost) stored,
  workshop_name text, technician_name text, notes text, invoice_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (vehicle_id, user_id) references public.vehicles(id, user_id) on delete cascade
);
create index mrec_vehicle_date_idx on public.maintenance_records(vehicle_id, service_date desc);
create index mrec_schedule_idx on public.maintenance_records(schedule_id);
create index mrec_user_idx on public.maintenance_records(user_id);
grant select, insert, update, delete on public.maintenance_records to authenticated;
grant all on public.maintenance_records to service_role;
alter table public.maintenance_records enable row level security;
create policy "mrec_select_own" on public.maintenance_records for select to authenticated using (user_id = auth.uid());
create policy "mrec_insert_own" on public.maintenance_records for insert to authenticated with check (user_id = auth.uid());
create policy "mrec_update_own" on public.maintenance_records for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "mrec_delete_own" on public.maintenance_records for delete to authenticated using (user_id = auth.uid());
create trigger maintenance_records_updated_at before update on public.maintenance_records for each row execute function public.update_updated_at_column();

-- next due = last + interval (mirrors src/features/maintenance/engine)
create or replace function public.compute_schedule_next_due() returns trigger language plpgsql set search_path = public as $$
begin
  new.next_due_odometer := case when new.interval_km is not null and new.last_service_odometer is not null
    then new.last_service_odometer + new.interval_km end;
  new.next_due_date := case when new.interval_months is not null and new.last_service_date is not null
    then (new.last_service_date + make_interval(months => new.interval_months))::date end;
  if tg_op = 'UPDATE' then new.updated_at := now(); end if;
  return new;
end $$;
create trigger vms_compute_next_due before insert or update on public.vehicle_maintenance_schedules
  for each row execute function public.compute_schedule_next_due();

create or replace function public.rebuild_maintenance_schedule(_schedule_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if _schedule_id is null then return; end if;
  select service_date, odometer into r from public.maintenance_records
   where schedule_id = _schedule_id order by service_date desc, odometer desc, created_at desc limit 1;
  update public.vehicle_maintenance_schedules
     set last_service_date = r.service_date, last_service_odometer = r.odometer
   where id = _schedule_id;
end $$;

-- link record to (or create) the vehicle's schedule for that item
create or replace function public.maintenance_record_before() returns trigger
language plpgsql security definer set search_path = public as $$
declare _sid uuid; _item record;
begin
  select * into _item from public.maintenance_items where id = new.maintenance_item_id;
  if _item.id is null or not (_item.is_system or _item.user_id = new.user_id) then
    raise exception 'maintenance item not available' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' and new.maintenance_item_id = old.maintenance_item_id and new.vehicle_id = old.vehicle_id then
    return new;
  end if;
  select id into _sid from public.vehicle_maintenance_schedules
   where vehicle_id = new.vehicle_id and maintenance_item_id = new.maintenance_item_id;
  if _sid is null then
    insert into public.vehicle_maintenance_schedules (user_id, vehicle_id, maintenance_item_id, interval_km, interval_months)
    values (new.user_id, new.vehicle_id, new.maintenance_item_id, _item.default_interval_km, _item.default_interval_months)
    returning id into _sid;
  end if;
  new.schedule_id := _sid;
  return new;
end $$;
create trigger mrec_before before insert or update on public.maintenance_records
  for each row execute function public.maintenance_record_before();

create or replace function public.maintenance_record_after() returns trigger
language plpgsql security definer set search_path = public as $$
declare _cur int;
begin
  if tg_op in ('UPDATE','DELETE') then perform public.rebuild_maintenance_schedule(old.schedule_id); end if;
  if tg_op in ('INSERT','UPDATE') then
    if tg_op = 'INSERT' or new.schedule_id is distinct from old.schedule_id then
      perform public.rebuild_maintenance_schedule(new.schedule_id);
    end if;
    -- advance odometer only when greater (never decrease); avoid duplicate readings
    select current_odometer into _cur from public.vehicles where id = new.vehicle_id;
    if new.odometer > _cur and not exists (
      select 1 from public.odometer_readings
       where vehicle_id = new.vehicle_id and reading = new.odometer and reading_date = new.service_date) then
      insert into public.odometer_readings (user_id, vehicle_id, reading, reading_date, source, notes)
      values (new.user_id, new.vehicle_id, new.odometer, new.service_date, 'maintenance', null);
    end if;
  end if;
  return null;
end $$;
create trigger mrec_after after insert or update or delete on public.maintenance_records
  for each row execute function public.maintenance_record_after();

revoke execute on function public.rebuild_maintenance_schedule(uuid) from public, anon, authenticated;
revoke execute on function public.maintenance_record_before() from public, anon, authenticated;
revoke execute on function public.maintenance_record_after() from public, anon, authenticated;
revoke execute on function public.compute_schedule_next_due() from public, anon, authenticated;

-- Catalog seed (generic starting values, editable per vehicle)
insert into public.maintenance_categories (name_ar, name_en, icon, sort_order) values
 ('المحرك','Engine','engine',1),('ناقل الحركة','Transmission','cog',2),('الفرامل','Brakes','disc',3),
 ('الإطارات','Tires','circle',4),('التبريد','Cooling','thermometer',5),('الكهرباء','Electrical','battery',6),
 ('الوقود','Fuel','fuel',7),('التعليق','Suspension','spring',8),('التكييف','A/C','wind',9),
 ('الفحص العام','General inspection','clipboard',10),('أخرى','Other','more',11);

insert into public.maintenance_items (category_id, name_ar, name_en, default_interval_km, default_interval_months, is_system, sort_order)
select c.id, v.name_ar, v.name_en, v.km, v.months, true, v.ord
from (values
 ('المحرك','زيت المحرك','Engine oil',7000,6,1),
 ('المحرك','فلتر زيت المحرك','Oil filter',7000,6,2),
 ('المحرك','فلتر الهواء','Air filter',20000,12,3),
 ('التكييف','فلتر المكيف','Cabin filter',15000,12,4),
 ('الفرامل','فحص الفرامل','Brake inspection',10000,6,5),
 ('الفرامل','سائل الفرامل','Brake fluid',40000,24,6),
 ('التبريد','سائل التبريد','Coolant',40000,24,7),
 ('ناقل الحركة','زيت ناقل الحركة','Transmission fluid',60000,48,8),
 ('المحرك','شمعات الاحتراق','Spark plugs',40000,36,9),
 ('الإطارات','تدوير الإطارات','Tire rotation',10000,6,10),
 ('الإطارات','ميزان وترصيص','Alignment & balancing',20000,12,11),
 ('الكهرباء','البطارية','Battery',null,24,12),
 ('المحرك','سير المحرك','Drive belt',60000,48,13),
 ('الوقود','تنظيف البخاخات','Injector cleaning',40000,null,14),
 ('الوقود','فحص نظام EVAP','EVAP inspection',null,12,15)
) as v(cat, name_ar, name_en, km, months, ord)
join public.maintenance_categories c on c.name_ar = v.cat;

-- invoices storage policies (bucket: maintenance-documents, path {user_id}/...)
create policy "mdocs_select_own" on storage.objects for select to authenticated
  using (bucket_id = 'maintenance-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "mdocs_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'maintenance-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "mdocs_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'maintenance-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "mdocs_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'maintenance-documents' and (storage.foldername(name))[1] = auth.uid()::text);