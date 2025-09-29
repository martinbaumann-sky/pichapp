import * as jose from "jose";

const DEFAULT_TTL_HOURS = Number(process.env.VENUE_REVIEW_TOKEN_TTL_HOURS ?? "72");

type VenueReviewPayload = {
  venueId: string;
  action: "approve" | "block";
  type: "venue_review";
};

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET || "dev-insecure-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function createVenueReviewToken(venueId: string, action: "approve" | "block", ttlHours = DEFAULT_TTL_HOURS) {
  const secret = getSecret();
  const exp = ttlHours > 0 ? `${ttlHours}h` : "72h";
  return new jose.SignJWT({ venueId, action, type: "venue_review" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(secret);
}

export async function verifyVenueReviewToken(token: string) {
  const secret = getSecret();
  const { payload } = await jose.jwtVerify(token, secret, { clockTolerance: 5 });
  if ((payload as VenueReviewPayload).type !== "venue_review") {
    throw new Error("Token inválido");
  }
  const venueId = (payload as any)?.venueId as string | undefined;
  const action = (payload as any)?.action as "approve" | "block" | undefined;
  if (!venueId || (action !== "approve" && action !== "block")) {
    throw new Error("Token incompleto");
  }
  return { venueId, action } as const;
}
