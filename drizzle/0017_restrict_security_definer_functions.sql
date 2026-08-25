-- Keep these SECURITY DEFINER helpers available only to authenticated policy evaluation and the server role.
-- They are referenced by the authenticated garcons_admin_manage RLS policy in 0013.
REVOKE EXECUTE ON FUNCTION public.get_current_user_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_current_restaurant_id() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_current_restaurant_id() TO authenticated, service_role;
