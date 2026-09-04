CREATE TABLE IF NOT EXISTS public.owner_accounts (
  user_id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.owner_accounts TO authenticated;
GRANT ALL ON public.owner_accounts TO service_role;
ALTER TABLE public.owner_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can read own marker" ON public.owner_accounts
FOR SELECT TO authenticated USING (user_id = auth.uid());

INSERT INTO public.owner_accounts (user_id)
SELECT u.id FROM auth.users u
WHERE lower(u.email) = lower('chaib.aziz2004@gmail.com')
ON CONFLICT (user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.owner_accounts WHERE user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin()
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'sub_admin'::public.app_role);
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated, service_role;