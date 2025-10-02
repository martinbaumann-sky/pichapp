import { beforeEach, describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "@/lib/encryption";

describe("encryption", () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = "unit-test-key";
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
});
