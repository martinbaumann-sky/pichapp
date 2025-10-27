-- Align Venue schema to include billing fields and drop legacy columns
DROP INDEX IF EXISTS "Venue_ownerId_key";
DROP INDEX IF EXISTS "Venue_verificationToken_key";

ALTER TABLE "public"."Venue"
  ADD COLUMN IF NOT EXISTS "taxId" TEXT;
ALTER TABLE "public"."Venue"
  ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "public"."Venue"
  ADD COLUMN IF NOT EXISTS "payoutEmail" TEXT;
ALTER TABLE "public"."Venue"
  ADD COLUMN IF NOT EXISTS "accountHolder" TEXT;
ALTER TABLE "public"."Venue"
  ADD COLUMN IF NOT EXISTS "plan" TEXT;
ALTER TABLE "public"."Venue"
  ADD COLUMN IF NOT EXISTS "verified" BOOLEAN;
ALTER TABLE "public"."Venue"
  ADD COLUMN IF NOT EXISTS "mpAccountId" TEXT;
ALTER TABLE "public"."Venue"
  ADD COLUMN IF NOT EXISTS "placeId" TEXT;

ALTER TABLE "public"."Venue"
  DROP COLUMN IF EXISTS "contactName";
ALTER TABLE "public"."Venue"
  DROP COLUMN IF EXISTS "contactEmail";
ALTER TABLE "public"."Venue"
  DROP COLUMN IF EXISTS "contactPhone";
ALTER TABLE "public"."Venue"
  DROP COLUMN IF EXISTS "status";
ALTER TABLE "public"."Venue"
  DROP COLUMN IF EXISTS "verifiedAt";
ALTER TABLE "public"."Venue"
  DROP COLUMN IF EXISTS "verificationToken";
ALTER TABLE "public"."Venue"
  DROP COLUMN IF EXISTS "updatedAt";

UPDATE "public"."Venue"
SET
  "taxId" = COALESCE("taxId", 'PENDIENTE'),
  "payoutEmail" = COALESCE("payoutEmail", 'pending@pichapp.test'),
  "accountHolder" = COALESCE("accountHolder", 'Pendiente'),
  "plan" = COALESCE("plan", 'gratis'),
  "verified" = COALESCE("verified", false);

ALTER TABLE "public"."Venue"
  ALTER COLUMN "taxId" SET NOT NULL;
ALTER TABLE "public"."Venue"
  ALTER COLUMN "payoutEmail" SET NOT NULL;
ALTER TABLE "public"."Venue"
  ALTER COLUMN "accountHolder" SET NOT NULL;
ALTER TABLE "public"."Venue"
  ALTER COLUMN "plan" SET DEFAULT 'gratis';
ALTER TABLE "public"."Venue"
  ALTER COLUMN "plan" SET NOT NULL;
ALTER TABLE "public"."Venue"
  ALTER COLUMN "verified" SET DEFAULT false;
ALTER TABLE "public"."Venue"
  ALTER COLUMN "verified" SET NOT NULL;

-- Extend User structure to match application schema
ALTER TABLE "public"."User"
  ADD COLUMN IF NOT EXISTS "disabledAt" TIMESTAMP(3);

ALTER TABLE "public"."User" DROP COLUMN IF EXISTS "status";
DROP TYPE IF EXISTS "public"."UserStatus";

DO $$
DECLARE
  user_role regtype := to_regtype('"UserRole"');
BEGIN
  IF user_role IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'VENUE' AND enumtypid = user_role)
       AND NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'VENUE_ADMIN' AND enumtypid = user_role) THEN
      EXECUTE 'ALTER TYPE "public"."UserRole" RENAME VALUE ''VENUE'' TO ''VENUE_ADMIN''';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ADMIN' AND enumtypid = user_role)
       AND NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SUPERADMIN' AND enumtypid = user_role) THEN
      EXECUTE 'ALTER TYPE "public"."UserRole" RENAME VALUE ''ADMIN'' TO ''SUPERADMIN''';
    END IF;
  END IF;
END $$;

ALTER TYPE "public"."UserRole" ADD VALUE IF NOT EXISTS 'VENUE_ADMIN';
ALTER TYPE "public"."UserRole" ADD VALUE IF NOT EXISTS 'SUPERADMIN';

-- Add new match references to venues
ALTER TABLE "public"."Match"
  ADD COLUMN IF NOT EXISTS "venueId" TEXT;
ALTER TABLE "public"."Match"
  ADD COLUMN IF NOT EXISTS "minSpotsToConfirm" INTEGER;

UPDATE "public"."Match"
SET "minSpotsToConfirm" = 0
WHERE "minSpotsToConfirm" IS NULL;

ALTER TABLE "public"."Match"
  ALTER COLUMN "minSpotsToConfirm" SET DEFAULT 0;
ALTER TABLE "public"."Match"
  ALTER COLUMN "minSpotsToConfirm" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "Match_venueId_idx" ON "public"."Match"("venueId");

DO $$
BEGIN
  ALTER TABLE "public"."Match"
    ADD CONSTRAINT "Match_venueId_fkey"
    FOREIGN KEY ("venueId") REFERENCES "public"."Venue"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Clean up unused enum from legacy venue status
DROP TYPE IF EXISTS "public"."VenueStatus";