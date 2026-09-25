-- Phase 1: profiles, vehicles, odometer_readings — PREPARED, NOT APPLIED.
create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, phone text,
  preferred_language text not null default 'ar',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data ->> 'full_name') on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  manufacturer text, model text,
  model_year int check (model_year between 1950 and 2100),
  trim text,
  vin text check (vin is null or vin ~ '^[A-HJ-NPR-Z0-9]{17}$'),
  plate_number text, engine text, transmission text, fuel_type text, color text,
  purchase_date date,
  purchase_odometer int check (purchase_odometer >= 0),
  purchase_price numeric(12,2) check (purchase_price >= 0),
  current_odometer int not null default 0 check (current_odometer >= 0),
  image_url text, notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index vehicles_user_id_idx on public.vehicles(user_id);
create unique index vehicles_user_vin_uidx on public.vehicles(user_id, vin) where vin is not null;
grant select, insert, update, delete on public.vehicles to authenticated;
grant all on public.vehicles to service_role;
alter table public.vehicles enable row level security;
create policy "vehicles_select_own" on public.vehicles for select to authenticated using (user_id = auth.uid());
create policy "vehicles_insert_own" on public.vehicles for insert to authenticated with check (user_id = auth.uid());
create policy "vehicles_update_own" on public.vehicles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "vehicles_delete_own" on public.vehicles for delete to authenticated using (user_id = auth.uid());
create trigger vehicles_updated_at before update on public.vehicles for each row execute function public.set_updated_at();

create table public.odometer_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  reading int not null check (reading >= 0),
  reading_date date not null default current_date,
  source text not null default 'manual',
  notes text,
  created_at timestamptz not null default now()
);
create index odometer_vehicle_date_idx on public.odometer_readings(vehicle_id, reading_date desc);
create index odometer_user_idx on public.odometer_readings(user_id);
grant select, insert, update, delete on public.odometer_readings to authenticated;
grant all on public.odometer_readings to service_role;
alter table public.odometer_readings enable row level security;
create policy "odometer_select_own" on public.odometer_readings for select to authenticated using (user_id = auth.uid());
create policy "odometer_insert_own" on public.odometer_readings for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.vehicles v where v.id = vehicle_id and v.user_id = auth.uid()));
create policy "odometer_update_own" on public.odometer_readings for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "odometer_delete_own" on public.odometer_readings for delete to authenticated using (user_id = auth.uid());

-- advance current_odometer only if greater (lower/equal = historical)
create or replace function public.apply_odometer_reading() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.vehicles set current_odometer = new.reading
   where id = new.vehicle_id and user_id = new.user_id and new.reading > current_odometer;
  return new;
end $$;
create trigger odometer_apply after insert on public.odometer_readings for each row execute function public.apply_odometer_reading();

create or replace function public.log_initial_odometer() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.current_odometer > 0 then
    insert into public.odometer_readings (user_id, vehicle_id, reading, source, notes)
    values (new.user_id, new.id, new.current_odometer, 'initial', 'قراءة عند إضافة السيارة');
  end if;
  return new;
end $$;
create trigger vehicles_initial_odometer after insert on public.vehicles for each row execute function public.log_initial_odometer();
