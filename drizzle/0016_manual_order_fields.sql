ALTER TABLE "table_selections"
  ADD COLUMN IF NOT EXISTS "source" varchar(16) NOT NULL DEFAULT 'customer';

ALTER TABLE "table_selections"
  ADD COLUMN IF NOT EXISTS "createdByWaiterId" integer;

CREATE INDEX IF NOT EXISTS "table_selections_creator_idx"
  ON "table_selections" ("createdByWaiterId");
