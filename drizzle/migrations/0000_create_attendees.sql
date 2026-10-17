CREATE TABLE public.attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  email text NOT NULL,
  ticket_type text NOT NULL DEFAULT 'General',
  code text NOT NULL UNIQUE DEFAULT upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
  checked_in_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendees TO authenticated;
GRANT ALL ON public.attendees TO service_role;
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.attendees FOR SELECT TO authenticated USING (organizer_id = auth.uid());
CREATE POLICY "own insert" ON public.attendees FOR INSERT TO authenticated WITH CHECK (organizer_id = auth.uid());
CREATE POLICY "own update" ON public.attendees FOR UPDATE TO authenticated USING (organizer_id = auth.uid());
CREATE POLICY "own delete" ON public.attendees FOR DELETE TO authenticated USING (organizer_id = auth.uid());

CREATE OR REPLACE FUNCTION public.check_in(_code text)
RETURNS json LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE r public.attendees;
BEGIN
  UPDATE public.attendees SET checked_in_at = now()
   WHERE code = upper(trim(_code)) AND checked_in_at IS NULL AND organizer_id = auth.uid()
   RETURNING * INTO r;
  IF FOUND THEN RETURN json_build_object('status','ok','name',r.name,'ticket_type',r.ticket_type,'at',r.checked_in_at); END IF;
  SELECT * INTO r FROM public.attendees WHERE code = upper(trim(_code)) AND organizer_id = auth.uid();
  IF FOUND THEN RETURN json_build_object('status','duplicate','name',r.name,'ticket_type',r.ticket_type,'at',r.checked_in_at); END IF;
  RETURN json_build_object('status','invalid');
END $$;
GRANT EXECUTE ON FUNCTION public.check_in(text) TO authenticated;