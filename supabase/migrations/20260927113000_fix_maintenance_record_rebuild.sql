-- Rebuild maintenance schedules whenever an existing service record is edited.
-- The original trigger rebuilt the new schedule only when vehicle/item changed,
-- leaving next_due values stale when date or odometer changed in place.

create or replace function public.maintenance_record_after() returns trigger
language plpgsql security definer set search_path = public as $$
declare _cur int;
begin
  if tg_op = 'DELETE' then
    perform public.rebuild_maintenance_schedule(old.schedule_id);
    return null;
  end if;

  if tg_op = 'UPDATE' and old.schedule_id is distinct from new.schedule_id then
    perform public.rebuild_maintenance_schedule(old.schedule_id);
  end if;

  -- INSERT and every UPDATE must rebuild the target schedule because
  -- service_date/odometer edits can change which record is the latest.
  perform public.rebuild_maintenance_schedule(new.schedule_id);

  -- Advance odometer only when greater (never decrease); avoid duplicate readings.
  select current_odometer into _cur from public.vehicles where id = new.vehicle_id;
  if new.odometer > _cur and not exists (
    select 1
      from public.odometer_readings
     where vehicle_id = new.vehicle_id
       and reading = new.odometer
       and reading_date = new.service_date
  ) then
    insert into public.odometer_readings (user_id, vehicle_id, reading, reading_date, source, notes)
    values (new.user_id, new.vehicle_id, new.odometer, new.service_date, 'maintenance', null);
  end if;

  return null;
end $$;

revoke execute on function public.maintenance_record_after() from public, anon, authenticated;
