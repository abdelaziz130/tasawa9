
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  old_price NUMERIC(12,2),
  image_url TEXT,
  category TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products readable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Products insertable by everyone" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Products updatable by everyone" ON public.products FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Products deletable by everyone" ON public.products FOR DELETE USING (true);

CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  wilaya TEXT NOT NULL,
  commune TEXT NOT NULL,
  delivery_type TEXT NOT NULL DEFAULT 'توصيل للمنزل',
  cart_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'جديد',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Orders readable by everyone" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Orders insertable by everyone" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Orders updatable by everyone" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Orders deletable by everyone" ON public.orders FOR DELETE USING (true);

CREATE INDEX orders_created_at_idx ON public.orders (created_at DESC);
CREATE INDEX products_created_at_idx ON public.products (created_at DESC);
