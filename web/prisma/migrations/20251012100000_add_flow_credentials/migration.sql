-- AlterTable
ALTER TABLE "Venue"
  ADD COLUMN     "paymentProvider" "PaymentProvider" NOT NULL DEFAULT 'MP',
  ADD COLUMN     "flowApiKey" TEXT,
  ADD COLUMN     "flowApiKeyHash" TEXT,
  ADD COLUMN     "flowSecretKey" TEXT,
  ADD COLUMN     "flowEnv" TEXT DEFAULT 'SANDBOX';

-- CreateIndex
CREATE INDEX "Venue_flowApiKeyHash_idx" ON "Venue"("flowApiKeyHash");
