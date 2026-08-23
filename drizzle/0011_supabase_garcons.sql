CREATE TABLE IF NOT EXISTS public.garcons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "authUserId" uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  "legacyUserId" integer NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE RESTRICT,
  "restaurantId" varchar(64) NOT NULL DEFAULT 'default',
  "fullName" text NOT NULL,
  username varchar(64) NOT NULL UNIQUE,
  email varchar(320) NOT NULL UNIQUE,
  phone varchar(32),
  role varchar(16) NOT NULL DEFAULT 'GARCOM' CHECK (role = 'GARCOM'),
  status varchar(16) NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO')),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "disabledAt" timestamptz
);

CREATE INDEX IF NOT EXISTS garcons_restaurant_idx ON public.garcons ("restaurantId");
CREATE INDEX IF NOT EXISTS garcons_status_idx ON public.garcons (status);

CREATE OR REPLACE FUNCTION public.set_garcons_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS garcons_updated_at ON public.garcons;
CREATE TRIGGER garcons_updated_at
BEFORE UPDATE ON public.garcons
FOR EACH ROW EXECUTE FUNCTION public.set_garcons_updated_at();

ALTER TABLE public.garcons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS garcons_service_role_all ON public.garcons;
CREATE POLICY garcons_service_role_all
ON public.garcons
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS garcons_self_select ON public.garcons;
CREATE POLICY garcons_self_select
ON public.garcons
FOR SELECT TO authenticated
USING ("authUserId" = auth.uid());
