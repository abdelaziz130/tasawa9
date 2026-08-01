-- 1. Products: gallery, video, tags, offer expiry, landing page
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS offer_expires_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS landing_slug text,
  ADD COLUMN IF NOT EXISTS landing_content jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS products_landing_slug_key ON public.products (landing_slug) WHERE landing_slug IS NOT NULL;

-- 2. Orders: refusal reason
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS refusal_reason text;

-- 3. Store settings (single row)
CREATE TABLE IF NOT EXISTS public.store_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_name text NOT NULL DEFAULT 'تسوق | Tasawa9',
  whatsapp_number text NOT NULL DEFAULT '213782524124',
  default_theme text NOT NULL DEFAULT 'neon-cyber',
  chatbot_kb text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.store_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.store_settings TO authenticated;
GRANT ALL ON public.store_settings TO service_role;

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings readable by everyone" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Settings insertable by admin" ON public.store_settings FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Settings updatable by admin" ON public.store_settings FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.store_settings (store_name) SELECT 'تسوق | Tasawa9'
WHERE NOT EXISTS (SELECT 1 FROM public.store_settings);

-- 4. Staff roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'sub_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  email text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'sub_admin',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin() OR public.has_role(auth.uid(), 'sub_admin') OR public.has_role(auth.uid(), 'admin');
$$;

CREATE POLICY "Roles readable by admin" ON public.user_roles FOR SELECT TO authenticated USING (public.is_admin() OR user_id = auth.uid());
CREATE POLICY "Roles manageable by admin" ON public.user_roles FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 5. Widen management policies to staff
DROP POLICY IF EXISTS "Products manageable by admin" ON public.products;
CREATE POLICY "Products manageable by staff" ON public.products FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "Orders readable by admin" ON public.orders;
CREATE POLICY "Orders readable by staff" ON public.orders FOR SELECT TO authenticated USING (public.is_staff());
DROP POLICY IF EXISTS "Orders updatable by admin" ON public.orders;
CREATE POLICY "Orders updatable by staff" ON public.orders FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "Abandoned carts readable by admin" ON public.abandoned_carts;
CREATE POLICY "Abandoned carts readable by staff" ON public.abandoned_carts FOR SELECT TO authenticated USING (public.is_staff());

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS store_settings_touch ON public.store_settings;
CREATE TRIGGER store_settings_touch BEFORE UPDATE ON public.store_settings
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();