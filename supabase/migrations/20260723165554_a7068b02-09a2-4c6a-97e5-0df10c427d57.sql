
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce((auth.jwt() ->> 'email') = 'chaib.aziz2004@gmail.com', false);
$$;

DROP POLICY IF EXISTS "Products manageable by authenticated" ON public.products;
CREATE POLICY "Products manageable by admin" ON public.products
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Orders manageable by authenticated" ON public.orders;
CREATE POLICY "Orders readable by admin" ON public.orders
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Orders updatable by admin" ON public.orders
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Orders deletable by admin" ON public.orders
  FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Shipping manageable by authenticated" ON public.wilayas_shipping;
CREATE POLICY "Shipping manageable by admin" ON public.wilayas_shipping
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
