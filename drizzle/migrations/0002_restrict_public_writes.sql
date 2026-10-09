DROP POLICY "public update" ON public.violations;
DROP POLICY "public delete" ON public.violations;
DROP POLICY "public insert" ON public.violations;
REVOKE UPDATE, DELETE ON public.violations FROM anon;
CREATE POLICY "public insert" ON public.violations FOR INSERT TO anon
  WITH CHECK (status = 'pending' AND reporter_id = '00000000-0000-0000-0000-000000000000'::uuid
    AND char_length(vehicle_number) BETWEEN 1 AND 20 AND char_length(location) BETWEEN 1 AND 200
    AND coalesce(char_length(description),0) <= 1000);