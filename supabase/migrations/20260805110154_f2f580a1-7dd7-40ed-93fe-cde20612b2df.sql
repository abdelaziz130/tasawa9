CREATE TABLE public.communes_shipping (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wilaya_code integer NOT NULL,
  commune_name text NOT NULL,
  home_fee numeric NOT NULL DEFAULT 0,
  desk_fee numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (wilaya_code, commune_name)
);

GRANT SELECT ON public.communes_shipping TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.communes_shipping TO authenticated;
GRANT ALL ON public.communes_shipping TO service_role;

ALTER TABLE public.communes_shipping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Commune shipping readable by everyone"
ON public.communes_shipping FOR SELECT USING (true);

CREATE POLICY "Commune shipping manageable by admin"
ON public.communes_shipping FOR ALL TO authenticated
USING (is_admin()) WITH CHECK (is_admin());

CREATE TRIGGER communes_shipping_touch
BEFORE UPDATE ON public.communes_shipping
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();