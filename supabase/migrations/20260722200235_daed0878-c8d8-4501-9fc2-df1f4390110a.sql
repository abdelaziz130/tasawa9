
CREATE POLICY "Product images readable by all"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Product images insertable by all"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Product images updatable by all"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Product images deletable by all"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images');
