CREATE TABLE IF NOT EXISTS public.purchase_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name text NOT NULL,
  wilaya text NOT NULL,
  product_title text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.purchase_events TO anon;
GRANT SELECT, INSERT ON public.purchase_events TO authenticated;
GRANT ALL ON public.purchase_events TO service_role;

ALTER TABLE public.purchase_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Purchase events readable by everyone" ON public.purchase_events FOR SELECT USING (true);
CREATE POLICY "Purchase events insertable by staff" ON public.purchase_events FOR INSERT TO authenticated WITH CHECK (public.is_staff());

CREATE INDEX IF NOT EXISTS purchase_events_created_at_idx ON public.purchase_events (created_at DESC);