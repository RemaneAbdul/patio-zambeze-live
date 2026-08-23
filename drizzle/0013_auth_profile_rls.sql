CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT u.role
  FROM public.users u
  WHERE u."openId" = 'supabase:' || auth.uid()::text
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_current_restaurant_id()
RETURNS varchar
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT g."restaurantId"
  FROM public.garcons g
  WHERE g."authUserId" = auth.uid()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_current_user_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_current_restaurant_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_current_restaurant_id() TO authenticated, service_role;

ALTER TABLE public.garcons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS garcons_self_select ON public.garcons;
CREATE POLICY garcons_self_select
ON public.garcons
FOR SELECT TO authenticated
USING ("authUserId" = auth.uid() AND status = 'ATIVO');

DROP POLICY IF EXISTS garcons_admin_manage ON public.garcons;
CREATE POLICY garcons_admin_manage
ON public.garcons
FOR ALL TO authenticated
USING (public.get_current_user_role() = 'admin' AND "restaurantId" = COALESCE(public.get_current_restaurant_id(), 'default'))
WITH CHECK (public.get_current_user_role() = 'admin' AND "restaurantId" = COALESCE(public.get_current_restaurant_id(), 'default'));
