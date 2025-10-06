-- CreateEnum
CREATE TYPE "public"."VenueSubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAUSED', 'CANCELED', 'EXPIRED');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."UserRole_new" AS ENUM ('PLAYER', 'VENUE_ADMIN', 'SUPERADMIN');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."User" ALTER COLUMN "role" TYPE "public"."UserRole_new" USING ("role"::text::"public"."UserRole_new");
ALTER TYPE "public"."UserRole" RENAME TO "UserRole_old";
ALTER TYPE "public"."UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "public"."User" ALTER COLUMN "role" SET DEFAULT 'PLAYER';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."Venue" DROP CONSTRAINT "Venue_ownerId_fkey";

-- AlterTable
ALTER TABLE "public"."Venue" ADD COLUMN     "mpAccountType" TEXT,
ADD COLUMN     "mpCollectorId" TEXT,
ALTER COLUMN "mpTokenExpiresAt" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."OAuthAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "email" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OAuthAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VenueSubscription" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "status" "public"."VenueSubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "mpPreapprovalId" TEXT,
    "mpPlanId" TEXT,
    "externalReference" TEXT NOT NULL,
    "initPoint" TEXT,
    "backUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "activatedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "nextChargeAt" TIMESTAMP(3),
    "lastChargeAt" TIMESTAMP(3),
    "cancellationReason" TEXT,

    CONSTRAINT "VenueSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OAuthAccount_userId_idx" ON "public"."OAuthAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_provider_providerAccountId_key" ON "public"."OAuthAccount"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "VenueSubscription_externalReference_key" ON "public"."VenueSubscription"("externalReference");

-- CreateIndex
CREATE INDEX "VenueSubscription_venueId_status_idx" ON "public"."VenueSubscription"("venueId", "status");

-- AddForeignKey
ALTER TABLE "public"."Venue" ADD CONSTRAINT "Venue_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OAuthAccount" ADD CONSTRAINT "OAuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VenueSubscription" ADD CONSTRAINT "VenueSubscription_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "public"."Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

