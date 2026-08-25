ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_self_select ON public.users;
CREATE POLICY users_self_select
ON public.users
FOR SELECT TO authenticated
USING ("openId" = 'supabase:' || auth.uid()::text);
