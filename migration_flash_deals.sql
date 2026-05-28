-- Flash Deals migration
-- Run in Supabase SQL Editor

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS "flashDeal"       BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "flashDealExpiry" TIMESTAMP WITH TIME ZONE;

-- Index so flash deal queries are fast
CREATE INDEX IF NOT EXISTS idx_listings_flash_deal
  ON listings ("flashDeal", "flashDealExpiry")
  WHERE "flashDeal" = TRUE;
