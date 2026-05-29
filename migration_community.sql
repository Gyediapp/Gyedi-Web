CREATE TABLE IF NOT EXISTS forum_categories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#1B4332',
  "postCount" INTEGER DEFAULT 0,
  "sortOrder" INTEGER DEFAULT 0,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forum_posts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "categoryId" TEXT NOT NULL REFERENCES forum_categories(id),
  "authorId" TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  "upvotes" INTEGER DEFAULT 0,
  "downvotes" INTEGER DEFAULT 0,
  "isPinned" BOOLEAN DEFAULT false,
  "isLocked" BOOLEAN DEFAULT false,
  "viewCount" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forum_replies (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "postId" TEXT NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  "authorId" TEXT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  "upvotes" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forum_votes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES users(id),
  "postId" TEXT REFERENCES forum_posts(id) ON DELETE CASCADE,
  "replyId" TEXT REFERENCES forum_replies(id) ON DELETE CASCADE,
  vote INTEGER NOT NULL CHECK (vote IN (1, -1)),
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  UNIQUE("userId", "postId"),
  UNIQUE("userId", "replyId")
);

CREATE TABLE IF NOT EXISTS user_points (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL UNIQUE REFERENCES users(id),
  points INTEGER DEFAULT 0,
  "totalEarned" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS points_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES users(id),
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_badges (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES users(id),
  badge TEXT NOT NULL,
  "awardedAt" TIMESTAMPTZ DEFAULT now(),
  UNIQUE("userId", badge)
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  body TEXT NOT NULL,
  "coverImage" TEXT,
  "authorId" TEXT REFERENCES users(id),
  "isPublished" BOOLEAN DEFAULT false,
  "publishedAt" TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  "viewCount" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

INSERT INTO forum_categories (name, slug, description, icon, color, "sortOrder") VALUES
('General', 'general', 'General discussions about Gyedi', '💬', '#1B4332', 1),
('Buying Tips', 'buying-tips', 'Tips and advice for safe buying', '🛒', '#F5A623', 2),
('Selling Tips', 'selling-tips', 'How to sell more on Gyedi', '📦', '#1B4332', 3),
('Scam Alerts', 'scam-alerts', 'Warn the community about bad actors', '⚠️', '#DC2626', 4),
('Success Stories', 'success-stories', 'Share your Gyedi success stories', '🎉', '#F5A623', 5),
('Help & Support', 'help-support', 'Get help from the community', '🔧', '#6B7280', 6)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO fee_configs (key, value, "updatedAt") VALUES
('points_per_transaction', '10', now()),
('points_per_review', '5', now()),
('points_per_referral', '50', now()),
('points_per_login', '1', now()),
('points_per_kyc', '20', now())
ON CONFLICT (key) DO NOTHING;
