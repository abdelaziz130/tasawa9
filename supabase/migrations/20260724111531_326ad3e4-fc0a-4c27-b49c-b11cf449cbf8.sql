
-- Coupons
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'percent',
  discount_value numeric NOT NULL DEFAULT 0,
  min_order numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  usage_limit integer,
  times_used integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coupons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coupons readable by everyone" ON public.coupons FOR SELECT TO public USING (true);
CREATE POLICY "Coupons manageable by admin" ON public.coupons FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Reviews
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  rating integer NOT NULL DEFAULT 5,
  comment text,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews readable by everyone" ON public.reviews FOR SELECT TO public USING (true);
CREATE POLICY "Reviews insertable by everyone" ON public.reviews FOR INSERT TO public WITH CHECK (rating BETWEEN 1 AND 5);
CREATE POLICY "Reviews manageable by admin" ON public.reviews FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Abandoned carts
CREATE TABLE public.abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text,
  phone text,
  wilaya text,
  commune text,
  cart_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.abandoned_carts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.abandoned_carts TO authenticated;
GRANT ALL ON public.abandoned_carts TO service_role;
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Abandoned carts insertable by everyone" ON public.abandoned_carts FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Abandoned carts updatable by everyone" ON public.abandoned_carts FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Abandoned carts readable by admin" ON public.abandoned_carts FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Abandoned carts deletable by admin" ON public.abandoned_carts FOR DELETE TO authenticated USING (is_admin());
