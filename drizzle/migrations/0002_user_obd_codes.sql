CREATE TABLE public.user_obd_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  code text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_obd_codes TO authenticated;
GRANT ALL ON public.user_obd_codes TO service_role;
ALTER TABLE public.user_obd_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own user_obd_codes" ON public.user_obd_codes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER user_obd_codes_updated BEFORE UPDATE ON public.user_obd_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();