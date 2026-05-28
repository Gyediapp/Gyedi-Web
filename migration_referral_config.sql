-- Referral program configuration — run in Supabase SQL Editor
-- Adds referral_reward_amount and referral_enabled to fee_configs table

INSERT INTO fee_configs (key, value, "updatedAt")
VALUES
  ('referral_reward_amount', '5.00', now()),
  ('referral_enabled',       'true', now())
ON CONFLICT (key) DO NOTHING;
