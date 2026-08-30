-- Repair legacy waiter users created before the garcons profile became mandatory.
-- Safe to run repeatedly: only creates missing garcons profiles.
INSERT INTO garcons (
  "authUserId",
  "legacyUserId",
  "restaurantId",
  "fullName",
  "username",
  "email",
  "phone",
  "role",
  "status",
  "disabledAt"
)
SELECT
  split_part(u."openId", ':', 2)::uuid,
  u.id,
  'default',
  COALESCE(u.name, 'Garçom'),
  regexp_replace(lower(COALESCE(u.name, 'garcom')) || '-' || u.id::text, '[^a-z0-9-]', '', 'g'),
  u.email,
  NULL,
  'GARCOM',
  CASE WHEN u."waiterActive" = 1 THEN 'ATIVO' ELSE 'INATIVO' END,
  CASE WHEN u."waiterActive" = 1 THEN NULL ELSE now() END
FROM users u
WHERE u.role = 'garcom'
  AND u."openId" LIKE 'supabase:%'
  AND NOT EXISTS (
    SELECT 1 FROM garcons g WHERE g."legacyUserId" = u.id
  );
