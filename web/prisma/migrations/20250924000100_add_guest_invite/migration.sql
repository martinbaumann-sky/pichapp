-- CreateTable GuestInvite (faltaba en la migración inicial)
CREATE TABLE "public"."GuestInvite" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "guestUserId" TEXT NOT NULL,
    "spotId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "position" "public"."Position",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestInvite_pkey" PRIMARY KEY ("id")
);

-- Indexes y restricciones únicas
CREATE UNIQUE INDEX "GuestInvite_spotId_key" ON "public"."GuestInvite"("spotId");
CREATE INDEX "GuestInvite_matchId_idx" ON "public"."GuestInvite"("matchId");
CREATE INDEX "GuestInvite_inviterId_idx" ON "public"."GuestInvite"("inviterId");
CREATE INDEX "GuestInvite_guestUserId_idx" ON "public"."GuestInvite"("guestUserId");

-- Foreign keys
ALTER TABLE "public"."GuestInvite" ADD CONSTRAINT "GuestInvite_matchId_fkey"
  FOREIGN KEY ("matchId") REFERENCES "public"."Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "public"."GuestInvite" ADD CONSTRAINT "GuestInvite_inviterId_fkey"
  FOREIGN KEY ("inviterId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "public"."GuestInvite" ADD CONSTRAINT "GuestInvite_guestUserId_fkey"
  FOREIGN KEY ("guestUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "public"."GuestInvite" ADD CONSTRAINT "GuestInvite_spotId_fkey"
  FOREIGN KEY ("spotId") REFERENCES "public"."Spot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


