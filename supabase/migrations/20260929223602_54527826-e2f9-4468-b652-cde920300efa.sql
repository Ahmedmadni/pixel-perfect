create table public.car_symptoms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  description text,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.car_symptoms to authenticated;
grant all on public.car_symptoms to service_role;
alter table public.car_symptoms enable row level security;
create policy symptoms_own on public.car_symptoms for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger car_symptoms_updated_at before update on public.car_symptoms for each row execute function public.update_updated_at_column();

create table public.symptom_causes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  symptom_id uuid not null references public.car_symptoms(id) on delete cascade,
  cause text not null,
  maintenance_item_id uuid references public.maintenance_items(id) on delete set null,
  km_threshold integer check (km_threshold is null or km_threshold > 0),
  base_likelihood text not null default 'medium' check (base_likelihood in ('low','medium','high')),
  steps text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index symptom_causes_symptom_idx on public.symptom_causes(symptom_id);
grant select, insert, update, delete on public.symptom_causes to authenticated;
grant all on public.symptom_causes to service_role;
alter table public.symptom_causes enable row level security;
create policy causes_own on public.symptom_causes for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger symptom_causes_updated_at before update on public.symptom_causes for each row execute function public.update_updated_at_column();