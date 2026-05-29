-- ── supported_countries ────────────────────────────────────────────────────
-- Run this in Supabase SQL Editor ONCE before deploying country features.

CREATE TABLE IF NOT EXISTS supported_countries (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name             TEXT NOT NULL,
  code             TEXT NOT NULL UNIQUE,
  flag             TEXT NOT NULL,
  currency         TEXT NOT NULL,
  "currencySymbol" TEXT NOT NULL,
  "dialCode"       TEXT NOT NULL,
  "paymentMethods" TEXT[]  DEFAULT '{}',
  "isActive"       BOOLEAN DEFAULT true,
  "isLaunchCountry" BOOLEAN DEFAULT false,
  "sortOrder"      INTEGER DEFAULT 0,
  "createdAt"      TIMESTAMPTZ DEFAULT now()
);

INSERT INTO supported_countries
  (name, code, flag, currency, "currencySymbol", "dialCode", "paymentMethods", "isActive", "isLaunchCountry", "sortOrder")
VALUES
  ('Ghana',          'GH', '🇬🇭', 'GHS', '₵',    '+233',  '{"mtn_momo","vodafone_cash","airteltigo"}', true,  true,  1),
  ('Nigeria',        'NG', '🇳🇬', 'NGN', '₦',    '+234',  '{"opay","palmpay","flutterwave"}',         false, false, 2),
  ('Ivory Coast',    'CI', '🇨🇮', 'XOF', 'CFA',  '+225',  '{"orange_money","wave","mtn_momo"}',       false, false, 3),
  ('Kenya',          'KE', '🇰🇪', 'KES', 'KSh',  '+254',  '{"mpesa","airtel_money"}',                 false, false, 4),
  ('South Africa',   'ZA', '🇿🇦', 'ZAR', 'R',    '+27',   '{"flutterwave","bank_transfer"}',          false, false, 5),
  ('United Kingdom', 'GB', '🇬🇧', 'GBP', '£',    '+44',   '{"stripe","wise","bank_transfer"}',        false, false, 6),
  ('Germany',        'DE', '🇩🇪', 'EUR', '€',    '+49',   '{"stripe","wise","sepa"}',                 false, false, 7),
  ('United States',  'US', '🇺🇸', 'USD', '$',    '+1',    '{"stripe","wise","bank_transfer"}',        false, false, 8),
  ('Canada',         'CA', '🇨🇦', 'CAD', 'CA$',  '+1',    '{"stripe","wise","interac"}',              false, false, 9),
  ('Italy',          'IT', '🇮🇹', 'EUR', '€',    '+39',   '{"stripe","wise","sepa"}',                 false, false, 10),
  ('Netherlands',    'NL', '🇳🇱', 'EUR', '€',    '+31',   '{"stripe","wise","ideal","sepa"}',         false, false, 11),
  ('Australia',      'AU', '🇦🇺', 'AUD', 'A$',   '+61',   '{"stripe","wise","bank_transfer"}',        false, false, 12),
  ('UAE',            'AE', '🇦🇪', 'AED', 'د.إ',  '+971',  '{"stripe","wise","bank_transfer"}',        false, false, 13),
  ('Senegal',        'SN', '🇸🇳', 'XOF', 'CFA',  '+221',  '{"orange_money","wave","free_money"}',     false, false, 14),
  ('Cameroon',       'CM', '🇨🇲', 'XAF', 'CFA',  '+237',  '{"mtn_momo","orange_money"}',              false, false, 15)
ON CONFLICT (code) DO NOTHING;
