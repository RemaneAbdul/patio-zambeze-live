ALTER TABLE "table_selection_items"
  ADD COLUMN IF NOT EXISTS "status" varchar(16) NOT NULL DEFAULT 'PENDING';
