import { beforeEach, describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "@/lib/encryption";

describe("encryption", () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = "unit-test-key";
    process.env.AUTH_SECRET = "auth-secret";
    process.env.NEXTAUTH_SECRET = "nextauth-secret";
  });

  it("encrypts and decrypts values symmetrically", () => {
    const encrypted = encryptSecret("hola mundo");
    expect(encrypted.startsWith("enc:v1:")).toBe(true);
    const decrypted = decryptSecret(encrypted);
    expect(decrypted).toBe("hola mundo");
  });

  it("supports contextual keys", () => {
    const encrypted = encryptSecret("token-123", { context: "venue:test" });
    expect(encrypted.startsWith("enc:v1:")).toBe(true);
    const decrypted = decryptSecret(encrypted, { context: "venue:test" });
    expect(decrypted).toBe("token-123");
  });

  it("throws on invalid payload", () => {
    process.env.ENCRYPTION_KEY = "unit-test-key";
    expect(() => decryptSecret("invalid")).toThrow();
  });

  it("falls back to AUTH_SECRET when ENCRYPTION_KEY is missing", () => {
    process.env.ENCRYPTION_KEY = "";
    const encrypted = encryptSecret("fallback");
    expect(encrypted).toBeTypeOf("string");
    delete process.env.ENCRYPTION_KEY;
    const decrypted = decryptSecret(encrypted);
    expect(decrypted).toBe("fallback");
  });
});
