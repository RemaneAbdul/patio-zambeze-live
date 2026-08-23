ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS "restaurantId" varchar(64) NOT NULL DEFAULT 'default';
CREATE INDEX IF NOT EXISTS audit_logs_restaurant_idx ON public.audit_logs ("restaurantId");
