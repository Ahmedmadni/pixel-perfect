create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null, phone text, website text, address text, notes text,
  created_at timestamptz not null default now()
);
create table public.parts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name_ar text not null, name_en text, part_number text, oem_part_number text, manufacturer text,
  is_oem boolean not null default false,
  status text not null default 'researching' check (status in ('researching','found','purchased','installed','archived')),
  image_url text, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.part_vehicle_fitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  part_id uuid not null references public.parts(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  unique (part_id, vehicle_id)
);
create table public.part_prices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  part_id uuid not null references public.parts(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  price numeric not null check (price >= 0),
  observed_date date not null default current_date,
  purchase_url text, notes text,
  created_at timestamptz not null default now()
);
create table public.part_installations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  part_id uuid not null references public.parts(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  maintenance_record_id uuid references public.maintenance_records(id) on delete set null,
  install_date date not null default current_date,
  odometer integer check (odometer >= 0),
  quantity numeric not null default 1 check (quantity > 0),
  unit_price numeric not null default 0 check (unit_price >= 0),
  other_cost numeric not null default 0 check (other_cost >= 0),
  total_cost numeric generated always as (quantity * unit_price + other_cost) stored,
  receipt_url text, notes text,
  created_at timestamptz not null default now()
);
create table public.diagnostic_issues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  title text not null, symptoms text, operating_conditions text, diagnostic_summary text,
  obd_codes text[] not null default '{}',
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  status text not null default 'open' check (status in ('open','monitoring','resolved','returned')),
  first_detected_date date not null default current_date,
  first_odometer integer,
  suspected_cause text, confirmed_cause text, root_cause_explanation text, repair_actions text,
  verification_result text, prevention_notes text, safe_to_drive boolean, resolution text,
  resolved_date date, resolved_odometer integer,
  maintenance_record_id uuid references public.maintenance_records(id) on delete set null,
  part_id uuid references public.parts(id) on delete set null,
  attachment_url text, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.diagnostic_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  issue_id uuid not null references public.diagnostic_issues(id) on delete cascade,
  event_date date not null default current_date,
  odometer integer,
  event_type text not null default 'note' check (event_type in ('observed','tested','repaired','returned','note')),
  details text not null default '',
  created_at timestamptz not null default now()
);
create table public.diagnostic_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  issue_id uuid not null references public.diagnostic_issues(id) on delete cascade,
  sequence_no integer not null default 1,
  performed_date date not null default current_date,
  odometer integer, system_area text, test_name text not null, test_method text,
  expected_result text, actual_result text,
  result_status text not null default 'inconclusive' check (result_status in ('pass','fail','inconclusive')),
  conclusion text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

do $$ declare t text; begin
  foreach t in array array['suppliers','parts','part_vehicle_fitments','part_prices','part_installations','diagnostic_issues','diagnostic_events','diagnostic_tests'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t || '_own', t);
    execute format('create index on public.%I (user_id)', t);
  end loop;
end $$;

create trigger parts_updated_at before update on public.parts for each row execute function public.update_updated_at_column();
create trigger diagnostic_issues_updated_at before update on public.diagnostic_issues for each row execute function public.update_updated_at_column();
create trigger diagnostic_tests_updated_at before update on public.diagnostic_tests for each row execute function public.update_updated_at_column();

create policy "diag_part_docs_own" on storage.objects for all to authenticated
  using (bucket_id in ('diagnostic-documents','part-documents') and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id in ('diagnostic-documents','part-documents') and (storage.foldername(name))[1] = auth.uid()::text);