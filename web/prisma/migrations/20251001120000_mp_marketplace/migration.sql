-- Add new match statuses
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'MatchStatus' AND e.enumlabel = 'CONFIRMED') THEN
        ALTER TYPE "MatchStatus" ADD VALUE 'CONFIRMED';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'MatchStatus' AND e.enumlabel = 'CANCELED_MINIMUM') THEN
        ALTER TYPE "MatchStatus" ADD VALUE 'CANCELED_MINIMUM';
    END IF;
END$$;

-- Add new spot status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'SpotStatus' AND e.enumlabel = 'REFUNDED') THEN
        ALTER TYPE "SpotStatus" ADD VALUE 'REFUNDED';
    END IF;
END$$;

-- Add marketplace credential columns to Venue
ALTER TABLE "Venue"
    ADD COLUMN IF NOT EXISTS "mpAccessToken" TEXT,
    ADD COLUMN IF NOT EXISTS "mpRefreshToken" TEXT,
    ADD COLUMN IF NOT EXISTS "mpTokenExpiresAt" TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS "mpUserId" TEXT;

-- Add raw payload column to Payment
ALTER TABLE "Payment"
    ADD COLUMN IF NOT EXISTS "raw" JSONB;
