import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "crypto";

type EncryptionSource = "ENCRYPTION_KEY" | "AUTH_SECRET" | "NEXTAUTH_SECRET";

let warnedFallback = false;

function pickEncryptionSource(): { key: string; source: EncryptionSource } | null {
  const candidates: Array<[EncryptionSource, string | undefined]> = [
    ["ENCRYPTION_KEY", process.env.ENCRYPTION_KEY],
    ["AUTH_SECRET", process.env.AUTH_SECRET],
    ["NEXTAUTH_SECRET", process.env.NEXTAUTH_SECRET],
  ];

  for (const [source, value] of candidates) {
    if (value && value.trim().length > 0) {
      return { key: value.trim(), source };
    }
  }
  return null;
}

function getMasterKey(): Buffer {
  const resolved = pickEncryptionSource();
  if (!resolved) {
    throw new Error("ENCRYPTION_KEY no está configurado");
  }

  if (resolved.source !== "ENCRYPTION_KEY" && !warnedFallback) {
    warnedFallback = true;
    console.warn(
      `ENCRYPTION_KEY no está configurado. Usando ${resolved.source} como clave de cifrado fallback. Configura ENCRYPTION_KEY para un mayor control.`,
    );
  }

  const isHex = /^[0-9a-f]+$/i.test(resolved.key) && resolved.key.length === 64;
  const keyBuffer = Buffer.from(resolved.key, isHex ? "hex" : "utf8");
  if (keyBuffer.length === 32) {
    return keyBuffer;
  }
  // Derive a 32-byte key using SHA-256 when size is not 32 bytes.
  return createHash("sha256").update(keyBuffer).digest();
}

function deriveContextKey(masterKey: Buffer, context: string): Buffer {
  if (!context || context === "global") {
    return masterKey;
  }
  return createHmac("sha256", masterKey).update(context).digest();
}

type EncryptionOptions = {
  context?: string;
};

const PREFIX = "enc:v1";

function serializeContext(context: string): string {
  return Buffer.from(context, "utf8").toString("base64url");
}

function deserializeContext(encoded: string): string {
  return Buffer.from(encoded, "base64url").toString("utf8");
}

function encodePayload(iv: Buffer, authTag: Buffer, encrypted: Buffer): string {
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

function decodePayload(payload: string): { iv: Buffer; authTag: Buffer; ciphertext: Buffer } {
  const raw = Buffer.from(payload, "base64");
  if (raw.length < 28) {
    throw new Error("Payload cifrado inválido");
  }
  const iv = raw.subarray(0, 12);
  const authTag = raw.subarray(12, 28);
  const ciphertext = raw.subarray(28);
  return { iv, authTag, ciphertext };
}

export function encryptSecret(value: string, options: EncryptionOptions = {}): string {
  if (!value) {
    throw new Error("Valor vacío no puede cifrarse");
  }
  const contextRaw = options.context?.trim() || "global";
  const masterKey = getMasterKey();
  const key = deriveContextKey(masterKey, contextRaw);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const body = encodePayload(iv, authTag, encrypted);
  const contextEncoded = serializeContext(contextRaw);
  return `${PREFIX}:${contextEncoded}:${body}`;
}

export function decryptSecret(payload: string | null | undefined, options: EncryptionOptions = {}): string | null {
  if (!payload) return null;
  const requestedContext = options.context?.trim() || "global";
  let encodedBody = payload;
  let contextsToTry: string[] = [];

  if (payload.startsWith(PREFIX)) {
    const remainder = payload.slice(PREFIX.length + 1);
    const separatorIndex = remainder.indexOf(":");
    if (separatorIndex === -1) {
      throw new Error("Payload cifrado inválido");
    }
    const encodedContext = remainder.slice(0, separatorIndex);
    const body = remainder.slice(separatorIndex + 1);
    if (!encodedContext || !body) {
      throw new Error("Payload cifrado inválido");
    }
    contextsToTry = [deserializeContext(encodedContext)];
    encodedBody = body;
  } else {
    contextsToTry = requestedContext === "global" ? ["global"] : [requestedContext, "global"];
  }

  const { iv, authTag, ciphertext } = decodePayload(encodedBody);
  const masterKey = getMasterKey();

  for (const context of contextsToTry) {
    try {
      const key = deriveContextKey(masterKey, context);
      const decipher = createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      return decrypted.toString("utf8");
    } catch (err) {
      // Try next context.
    }
  }

  throw new Error("No se pudo descifrar el contenido protegido");
}
