CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON public.vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_odometer_user_id ON public.odometer_readings(user_id);
CREATE INDEX IF NOT EXISTS idx_odometer_vehicle_date ON public.odometer_readings(vehicle_id, reading_date DESC);

-- keep only the most recent active vehicle per user before enforcing uniqueness
UPDATE public.vehicles v SET is_active = false
WHERE is_active AND EXISTS (
  SELECT 1 FROM public.vehicles o WHERE o.user_id = v.user_id AND o.is_active AND o.created_at > v.created_at
);
ALTER TABLE public.vehicles ALTER COLUMN is_active SET DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_vehicle_per_user ON public.vehicles(user_id) WHERE is_active;

CREATE OR REPLACE FUNCTION public.set_active_vehicle(_vehicle_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.vehicles WHERE id = _vehicle_id AND user_id = _uid) THEN
    RAISE EXCEPTION 'vehicle not found' USING ERRCODE = 'P0002';
  END IF;
  UPDATE public.vehicles SET is_active = false WHERE user_id = _uid AND is_active AND id <> _vehicle_id;
  UPDATE public.vehicles SET is_active = true WHERE id = _vehicle_id AND user_id = _uid;
END; $$;
REVOKE ALL ON FUNCTION public.set_active_vehicle(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_active_vehicle(uuid) TO authenticated;

-- first vehicle of a user becomes active automatically
CREATE OR REPLACE FUNCTION public.auto_activate_first_vehicle()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.vehicles WHERE user_id = NEW.user_id AND is_active) THEN
    NEW.is_active := true;
  ELSE
    NEW.is_active := false;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS vehicles_auto_activate ON public.vehicles;
CREATE TRIGGER vehicles_auto_activate BEFORE INSERT ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION public.auto_activate_first_vehicle();

CREATE POLICY "vehicle_images_select_own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'vehicle-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "vehicle_images_insert_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'vehicle-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "vehicle_images_update_own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'vehicle-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "vehicle_images_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'vehicle-images' AND (storage.foldername(name))[1] = auth.uid()::text);