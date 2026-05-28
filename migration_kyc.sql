CREATE TABLE IF NOT EXISTS kyc_submissions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "documentType" TEXT NOT NULL,
  "documentFront" TEXT NOT NULL,
  "documentBack" TEXT,
  "selfieUrl" TEXT,
  "fullName" TEXT NOT NULL,
  "dateOfBirth" TEXT,
  "documentNumber" TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  "adminNote" TEXT,
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kyc_user   ON kyc_submissions("userId");
CREATE INDEX IF NOT EXISTS idx_kyc_status ON kyc_submissions(status);
