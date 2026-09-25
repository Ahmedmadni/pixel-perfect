CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'ar',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  manufacturer TEXT,
  model TEXT,
  model_year INTEGER,
  trim TEXT,
  vin TEXT,
  plate_number TEXT,
  engine TEXT,
  transmission TEXT,
  fuel_type TEXT,
  color TEXT,
  purchase_date DATE,
  purchase_price NUMERIC(12,2),
  purchase_odometer INTEGER,
  current_odometer INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT vehicles_odometer_nonnegative CHECK (current_odometer >= 0),
  CONSTRAINT vehicles_purchase_odometer_nonnegative CHECK (purchase_odometer IS NULL OR purchase_odometer >= 0)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicles_select_own" ON public.vehicles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "vehicles_insert_own" ON public.vehicles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "vehicles_update_own" ON public.vehicles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "vehicles_delete_own" ON public.vehicles FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.odometer_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  reading INTEGER NOT NULL,
  reading_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT NOT NULL DEFAULT 'manual',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT odometer_reading_nonnegative CHECK (reading >= 0)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.odometer_readings TO authenticated;
GRANT ALL ON public.odometer_readings TO service_role;
ALTER TABLE public.odometer_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "odometer_select_own" ON public.odometer_readings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "odometer_insert_own" ON public.odometer_readings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "odometer_update_own" ON public.odometer_readings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "odometer_delete_own" ON public.odometer_readings FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.sync_vehicle_odometer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.vehicles
  SET current_odometer = NEW.reading, updated_at = now()
  WHERE id = NEW.vehicle_id AND NEW.reading > current_odometer;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_odometer_reading_insert
  AFTER INSERT ON public.odometer_readings
  FOR EACH ROW EXECUTE FUNCTION public.sync_vehicle_odometer();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();