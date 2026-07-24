
CREATE POLICY "Public read review photos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'review-photos');
CREATE POLICY "Public upload review photos" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'review-photos');
