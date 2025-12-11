// @ts-nocheck
import { describe, expect, it } from "vitest";
import { createHmac } from "crypto";
import { parseExternalReference, verifyMpSignature } from "@/lib/mp/marketplace";

describe("mp marketplace helpers", () => {
  it("parses valid external references", () => {
    expect(parseExternalReference("match-1:spot-2")).toEqual({ matchId: "match-1", reservationId: "spot-2" });
    expect(parseExternalReference("bad")).toBeNull();
    expect(parseExternalReference(null)).toBeNull();
  });

  it("validates webhook signatures", () => {
    const secret = "demo";
    const payload = "id:123;request-id:req-1;ts:456";
    const signature = createHmac("sha256", secret).update(payload).digest("hex");
    const header = `id=123,ts=456,signature=${signature}`;
    expect(verifyMpSignature({ signature: header, requestId: "req-1", secret })).toBe(true);
    expect(verifyMpSignature({ signature: header, requestId: "req-2", secret })).toBe(false);
  });
});
