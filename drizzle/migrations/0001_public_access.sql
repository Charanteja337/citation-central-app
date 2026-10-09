ALTER TABLE public.violations ALTER COLUMN reporter_id SET DEFAULT '00000000-0000-0000-0000-000000000000';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.violations TO anon;
CREATE POLICY "public select" ON public.violations FOR SELECT TO anon USING (true);
CREATE POLICY "public insert" ON public.violations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "public update" ON public.violations FOR UPDATE TO anon USING (true);
CREATE POLICY "public delete" ON public.violations FOR DELETE TO anon USING (true);
CREATE POLICY "public read images" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'violation-images');
CREATE POLICY "public upload images" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'violation-images' AND (storage.foldername(name))[1] = 'public');