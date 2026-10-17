-- Improve check_in function to be truly atomic and prevent race conditions
-- Add a partial unique index to ensure only one record per organizer can have a checked-in timestamp
CREATE UNIQUE INDEX IF NOT EXISTS attendees_checked_in_idx 
ON public.attendees (organizer_id, code) 
WHERE checked_in_at IS NOT NULL;

-- Drop old function
DROP FUNCTION IF EXISTS public.check_in(text);

-- Create improved atomic check_in function
CREATE OR REPLACE FUNCTION public.check_in(_code text)
RETURNS json LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE r public.attendees;
BEGIN
  -- Use SELECT FOR UPDATE to lock the row and prevent concurrent check-ins
  SELECT * INTO r FROM public.attendees 
  WHERE code = upper(trim(_code)) AND organizer_id = auth.uid()
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('status','invalid');
  END IF;
  
  IF r.checked_in_at IS NOT NULL THEN
    RETURN json_build_object('status','duplicate','name',r.name,'ticket_type',r.ticket_type,'at',r.checked_in_at);
  END IF;
  
  -- Update the row (we have a lock, so this is safe)
  UPDATE public.attendees SET checked_in_at = now()
  WHERE id = r.id
  RETURNING * INTO r;
  
  RETURN json_build_object('status','ok','name',r.name,'ticket_type',r.ticket_type,'at',r.checked_in_at);
END $$;

GRANT EXECUTE ON FUNCTION public.check_in(text) TO authenticated;
