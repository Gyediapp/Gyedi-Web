-- Referral system migration
-- Run in Supabase Dashboard → SQL Editor → New Query → Run

-- 1. Add referral columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS "referralCode" TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "referredBy" TEXT;

-- 2. Referral rewards table — one row per referred user
CREATE TABLE IF NOT EXISTS referral_rewards (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "referrerId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "referredId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING',
  reward DECIMAL(10, 2) NOT NULL DEFAULT 5.00,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE("referredId")
);

-- 3. Founding members — users who join in the first wave
CREATE TABLE IF NOT EXISTS founding_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  badge TEXT NOT NULL DEFAULT 'Founding Member',
  "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS referral_rewards_referrer_idx ON referral_rewards ("referrerId");
