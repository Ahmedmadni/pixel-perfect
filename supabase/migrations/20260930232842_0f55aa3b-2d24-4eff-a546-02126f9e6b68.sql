CREATE TABLE public.obd_fault_codes (
  code text PRIMARY KEY,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN ('P','B','C','U')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.obd_fault_codes TO authenticated;
GRANT ALL ON public.obd_fault_codes TO service_role;

ALTER TABLE public.obd_fault_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "obd_codes_select_authenticated"
  ON public.obd_fault_codes FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX obd_fault_codes_category_idx ON public.obd_fault_codes(category);

CREATE TRIGGER obd_fault_codes_updated_at
  BEFORE UPDATE ON public.obd_fault_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();