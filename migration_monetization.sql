-- ============================================================
-- Gyedi Monetization Migration
-- Run this in Supabase SQL Editor → New Query → Run
-- ============================================================

-- 1. Subscription Plans (catalog)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  price       DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency    TEXT NOT NULL DEFAULT 'GHS',
  interval    TEXT NOT NULL DEFAULT 'month',
  "maxListings" INTEGER NOT NULL DEFAULT 5,
  "freeBoosts"  INTEGER NOT NULL DEFAULT 0,
  features    JSONB DEFAULT '[]',
  badge       TEXT,
  "badgeColor"  TEXT,
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. User Subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "planId"      TEXT NOT NULL REFERENCES subscription_plans(id),
  status        TEXT NOT NULL DEFAULT 'ACTIVE',
  "startDate"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "endDate"     TIMESTAMPTZ NOT NULL,
  "autoRenew"   BOOLEAN NOT NULL DEFAULT true,
  "paymentMethod" TEXT,
  "momoRef"     TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Boost Packages (catalog)
CREATE TABLE IF NOT EXISTS boost_packages (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  price         DECIMAL(10,2) NOT NULL,
  "durationDays" INTEGER NOT NULL,
  description   TEXT,
  badge         TEXT,
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "sortOrder"   INTEGER NOT NULL DEFAULT 0
);

-- 4. Listing Boosts (purchased)
CREATE TABLE IF NOT EXISTS listing_boosts (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "listingId"   TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  "userId"      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "boostType"   TEXT NOT NULL DEFAULT 'BASIC',
  price         DECIMAL(10,2) NOT NULL,
  "startDate"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "endDate"     TIMESTAMPTZ NOT NULL,
  status        TEXT NOT NULL DEFAULT 'ACTIVE',
  "momoRef"     TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Promo Codes
CREATE TABLE IF NOT EXISTS promo_codes (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code              TEXT NOT NULL UNIQUE,
  "discountPercent" INTEGER NOT NULL DEFAULT 0,
  "maxUses"         INTEGER,
  "usedCount"       INTEGER NOT NULL DEFAULT 0,
  "expiresAt"       TIMESTAMPTZ,
  "isActive"        BOOLEAN NOT NULL DEFAULT true,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user   ON user_subscriptions("userId");
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_listing_boosts_listing    ON listing_boosts("listingId");
CREATE INDEX IF NOT EXISTS idx_listing_boosts_status     ON listing_boosts(status, "endDate");

-- 7. Seed default plans
INSERT INTO subscription_plans (name, slug, price, "maxListings", "freeBoosts", features, badge, "badgeColor", "sortOrder")
VALUES
  ('Basic', 'basic', 0, 5, 0, '["5 active listings", "Standard store page", "Basic search ranking"]', null, null, 1),
  ('Pro', 'pro', 20, 20, 1, '["20 active listings", "Gold Pro badge", "Custom store banner", "Featured in Top Sellers", "Priority search ranking", "1 free boost/month"]', 'Pro Seller', '#F5A623', 2),
  ('Business', 'business', 50, 999, 3, '["Unlimited listings", "Verified Business badge", "Custom store URL", "Homepage hero feature", "Full analytics", "3 free boosts/month", "Dedicated support"]', 'Verified Business', '#1B4332', 3),
  ('Enterprise', 'enterprise', 150, 9999, 10, '["Everything in Business", "API access", "5 staff accounts", "Account manager", "10 free boosts/month"]', 'Enterprise', '#7C3AED', 4)
ON CONFLICT (slug) DO NOTHING;

-- 8. Seed default boost packages
INSERT INTO boost_packages (name, slug, price, "durationDays", description, badge, "sortOrder")
VALUES
  ('Basic Boost',   'basic-boost',   5,  7,  'Appear above regular listings for 7 days',         '🥉 Basic',   1),
  ('Pro Boost',     'pro-boost',     15, 30, 'Top of category + homepage for 30 days',            '🥈 Pro',     2),
  ('Premium Boost', 'premium-boost', 30, 30, 'Hero banner + top of everything + Sponsored badge', '🥇 Premium', 3)
ON CONFLICT (slug) DO NOTHING;
