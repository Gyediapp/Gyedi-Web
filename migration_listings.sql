-- Migration: Create listings table for Gyedi Marketplace
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS listings (
  id          TEXT         NOT NULL DEFAULT gen_random_uuid()::text PRIMARY KEY,
  title       TEXT         NOT NULL,
  description TEXT         NOT NULL,
  price       NUMERIC(10,2) NOT NULL,
  category    TEXT         NOT NULL,
  images      TEXT[]       NOT NULL DEFAULT '{}',
  "sellerId"  TEXT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  country     TEXT         NOT NULL DEFAULT 'GH',
  status      TEXT         NOT NULL DEFAULT 'ACTIVE',
  "storeType" TEXT         NOT NULL DEFAULT 'BASIC',
  views       INTEGER      NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ  NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS listings_seller_idx   ON listings("sellerId");
CREATE INDEX IF NOT EXISTS listings_status_idx   ON listings(status);
CREATE INDEX IF NOT EXISTS listings_country_idx  ON listings(country);
CREATE INDEX IF NOT EXISTS listings_category_idx ON listings(category);
CREATE INDEX IF NOT EXISTS listings_views_idx    ON listings(views DESC);

-- Auto-update updatedAt
CREATE OR REPLACE FUNCTION update_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS listings_updated_at ON listings;
CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE PROCEDURE update_listings_updated_at();
