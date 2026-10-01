-- Comprehensive diagnostic reporting: structured diagnostic tests and narrative fields.

alter table public.diagnostic_issues
  add column if not exists operating_conditions text,
  add column if not exists diagnostic_summary text,
  add column if not exists root_cause_explanation text,
  add column if not exists repair_actions text,
  add column if not exists verification_result text,
  add column if not exists prevention_notes text,
  add column if not exists safe_to_drive boolean;

create table if not exists public.diagnostic_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  issue_id uuid not null,
  sequence_no int not null default 1 check (sequence_no > 0),
  performed_date date not null default current_date,
  odometer int check (odometer >= 0),
  system_area text,
  test_name text not null,
  test_method text,
  expected_result text,
  actual_result text,
  result_status text not null default 'inconclusive'
    check (result_status in ('pass','fail','inconclusive')),
  conclusion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (issue_id, user_id)
    references public.diagnostic_issues(id, user_id) on delete cascade
);

create index if not exists diagnostic_tests_issue_sequence_idx
  on public.diagnostic_tests(issue_id, sequence_no, performed_date);

drop trigger if exists diagnostic_tests_updated_at on public.diagnostic_tests;
create trigger diagnostic_tests_updated_at
  before update on public.diagnostic_tests
  for each row execute function public.update_updated_at_column();

alter table public.diagnostic_tests enable row level security;

grant select, insert, update, delete on public.diagnostic_tests to authenticated;

drop policy if exists "diagnostic_tests_own" on public.diagnostic_tests;
create policy "diagnostic_tests_own" on public.diagnostic_tests
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
