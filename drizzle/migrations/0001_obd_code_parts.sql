CREATE TABLE public.obd_code_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  code text NOT NULL REFERENCES public.obd_fault_codes(code) ON DELETE CASCADE,
  part_id uuid NOT NULL REFERENCES public.parts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, code, part_id)
);
GRANT SELECT, INSERT, DELETE ON public.obd_code_parts TO authenticated;
GRANT ALL ON public.obd_code_parts TO service_role;
ALTER TABLE public.obd_code_parts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own obd code parts" ON public.obd_code_parts FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.parts p WHERE p.id = part_id AND p.user_id = auth.uid()));
CREATE INDEX obd_code_parts_user_code_idx ON public.obd_code_parts (user_id, code);