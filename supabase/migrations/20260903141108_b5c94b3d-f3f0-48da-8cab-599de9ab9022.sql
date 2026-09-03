-- 1. Coupons: remove public read access
DROP POLICY IF EXISTS "Coupons readable by everyone" ON public.coupons;
REVOKE SELECT ON public.coupons FROM anon;

-- 2. Abandoned carts: remove public update/insert (handled server-side now)
DROP POLICY IF EXISTS "Abandoned carts updatable by everyone" ON public.abandoned_carts;
DROP POLICY IF EXISTS "Abandoned carts insertable by everyone" ON public.abandoned_carts;
REVOKE INSERT, UPDATE ON public.abandoned_carts FROM anon;

-- 3. Purchase events: remove public read access
DROP POLICY IF EXISTS "Purchase events readable by everyone" ON public.purchase_events;
REVOKE SELECT ON public.purchase_events FROM anon;
CREATE POLICY "Purchase events readable by staff"
  ON public.purchase_events FOR SELECT TO authenticated
  USING (public.is_staff());

-- 4. Storage policies: restrict writes on product-images and review-photos
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname, cmd FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND qual || ' ' || coalesce(with_check, '') LIKE '%product-images%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND coalesce(qual, '') || ' ' || coalesce(with_check, '') LIKE '%review-photos%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "Product images readable by everyone"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Product images insertable by staff"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.is_staff());

CREATE POLICY "Product images updatable by staff"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_staff())
  WITH CHECK (bucket_id = 'product-images' AND public.is_staff());

CREATE POLICY "Product images deletable by staff"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_staff());

CREATE POLICY "Review photos readable by everyone"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'review-photos');

CREATE POLICY "Review photos manageable by staff"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'review-photos' AND public.is_staff())
  WITH CHECK (bucket_id = 'review-photos' AND public.is_staff());

-- 5. SECURITY DEFINER helpers: switch to INVOKER and revoke public execute
ALTER FUNCTION public.has_role(uuid, public.app_role) SECURITY INVOKER;
ALTER FUNCTION public.is_staff() SECURITY INVOKER;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_staff() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;