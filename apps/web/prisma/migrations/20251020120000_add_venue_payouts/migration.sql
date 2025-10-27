-- CreateEnum
CREATE TYPE "public"."VenuePayoutMethod" AS ENUM ('MP_WALLET', 'FLOW', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "public"."VenuePayoutStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- AlterTable
ALTER TABLE "public"."Venue"
  ADD COLUMN     "payoutMethod" "public"."VenuePayoutMethod" NOT NULL DEFAULT 'MP_WALLET',
  ADD COLUMN     "bankName" TEXT,
  ADD COLUMN     "bankAccountType" TEXT,
  ADD COLUMN     "bankAccountNumber" TEXT,
  ADD COLUMN     "bankAccountRut" TEXT;

-- CreateTable
CREATE TABLE "public"."VenuePayout" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "venueId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "status" "public"."VenuePayoutStatus" NOT NULL DEFAULT 'PENDING',
    "method" "public"."VenuePayoutMethod" NOT NULL,
    "amountCLP" INTEGER NOT NULL,
    "platformFeeCLP" INTEGER NOT NULL,
    "providerFeeCLP" INTEGER NOT NULL,
    "netAmountCLP" INTEGER NOT NULL,
    "destination" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "VenuePayout_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "VenuePayout_paymentId_key" UNIQUE ("paymentId"),
    CONSTRAINT "VenuePayout_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "public"."Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VenuePayout_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "public"."Match"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VenuePayout_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "public"."Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "VenuePayout_venueId_status_idx" ON "public"."VenuePayout"("venueId", "status");

-- CreateIndex
CREATE INDEX "VenuePayout_matchId_idx" ON "public"."VenuePayout"("matchId");
