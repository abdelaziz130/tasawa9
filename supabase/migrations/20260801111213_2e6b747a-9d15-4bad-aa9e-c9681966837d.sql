REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_staff() FROM anon;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM anon, authenticated;