-- Add new columns to existing notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'push';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "actionUrl" TEXT;

-- Per-user notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  "pushEnabled"      BOOLEAN NOT NULL DEFAULT true,
  "smsEnabled"       BOOLEAN NOT NULL DEFAULT false,
  "whatsAppEnabled"  BOOLEAN NOT NULL DEFAULT false,
  "escrowUpdates"    BOOLEAN NOT NULL DEFAULT true,
  "referralUpdates"  BOOLEAN NOT NULL DEFAULT true,
  "marketingUpdates" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin-editable notification templates
CREATE TABLE IF NOT EXISTS notification_templates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug TEXT NOT NULL UNIQUE,
  "titleTemplate" TEXT NOT NULL,
  "bodyTemplate"  TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default templates
INSERT INTO notification_templates (slug, "titleTemplate", "bodyTemplate", type) VALUES
  ('escrow_funded',      'Escrow funded',         '{{buyerName}} funded "{{title}}" for {{amount}}.',                     'escrow'),
  ('item_shipped',       'Item shipped',           '{{sellerName}} marked "{{title}}" as shipped. Confirm when received.', 'escrow'),
  ('delivery_confirmed', 'Delivery confirmed',     '{{buyerName}} confirmed delivery of "{{title}}". Release pending.',    'escrow'),
  ('dispute_opened',     'Dispute opened',         'A dispute was opened on "{{title}}".',                                 'dispute'),
  ('kyc_approved',       'Identity verified',      'Your KYC was approved. You can now create escrows.',                  'kyc'),
  ('kyc_rejected',       'KYC rejected',           'Your KYC submission was rejected. Please resubmit your documents.',   'kyc'),
  ('referral_reward',    'Referral bonus earned',  '{{friendName}} joined Gyedi with your code. {{amount}} bonus added.', 'referral')
ON CONFLICT (slug) DO NOTHING;
