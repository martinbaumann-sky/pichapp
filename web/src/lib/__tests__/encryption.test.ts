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
    expect(encrypted).toBeTypeOf("string");
    const decrypted = decryptSecret(encrypted);
    expect(decrypted).toBe("hola mundo");
  });

  it("throws on invalid payload", () => {
    process.env.ENCRYPTION_KEY = "unit-test-key";
    expect(() => decryptSecret("invalid")).toThrow();
  });

  it("falls back to AUTH_SECRET when ENCRYPTION_KEY is missing", () => {
    process.env.ENCRYPTION_KEY = "";
    const encrypted = encryptSecret("fallback");
    expect(encrypted).toBeTypeOf("string");
    process.env.ENCRYPTION_KEY = undefined;
    const decrypted = decryptSecret(encrypted);
    expect(decrypted).toBe("fallback");
  });
});
