DROP POLICY IF EXISTS "public select" ON public.violations;
DROP POLICY IF EXISTS "view all" ON public.violations;
REVOKE SELECT ON public.violations FROM anon;