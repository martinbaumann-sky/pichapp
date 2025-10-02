import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

function getKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;
  if (!envKey) {
    throw new Error("ENCRYPTION_KEY no está configurado");
  }
  const keyBuffer = Buffer.from(envKey, envKey.length === 64 ? "hex" : "utf8");
  if (keyBuffer.length === 32) {
    return keyBuffer;
  }
  // Derive a 32-byte key using SHA-256 when size is not 32 bytes.
  return createHash("sha256").update(keyBuffer).digest();
}

export function encryptSecret(value: string): string {
  if (!value) {
    throw new Error("Valor vacío no puede cifrarse");
  }
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptSecret(payload: string | null | undefined): string | null {
  if (!payload) return null;
  const raw = Buffer.from(payload, "base64");
  if (raw.length < 28) {
    throw new Error("Payload cifrado inválido");
  }
  const iv = raw.subarray(0, 12);
  const authTag = raw.subarray(12, 28);
  const ciphertext = raw.subarray(28);
  const key = getKey();
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
}
