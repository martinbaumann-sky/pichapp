type CodeEntry = { code: string; expiresAt: number };

// Mantener el mapa en globalThis para que sobreviva a recargas HMR en desarrollo
const GLOBAL_KEY = "__PICHANG_SMS_CODES__";
const globalAny: any = globalThis as any;
if (!globalAny[GLOBAL_KEY]) globalAny[GLOBAL_KEY] = new Map<string, CodeEntry>();
const codes: Map<string, CodeEntry> = globalAny[GLOBAL_KEY];

export function normalizePhone(phone: string) {
  if (!phone) return "";
  // Mantener solo dígitos, por ejemplo '+56 9 1234 5678' -> '56912345678'
  return String(phone).replace(/\D+/g, "");
}

export function generateAndStoreCode(phone: string) {
  const key = normalizePhone(phone);
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  codes.set(key, { code, expiresAt: Date.now() + 5 * 60 * 1000 });
  return code;
}

export function verifyCode(phone: string, code: string) {
  const key = normalizePhone(phone);
  const entry = codes.get(key);
  if (!entry) return { ok: false, error: "Código no enviado" };
  if (entry.expiresAt < Date.now()) { codes.delete(key); return { ok: false, error: "Código expirado" }; }
  if (entry.code !== String(code)) return { ok: false, error: "Código inválido" };
  codes.delete(key);
  return { ok: true };
}

export function hasCode(phone: string) {
  const key = normalizePhone(phone);
  const e = codes.get(key);
  return !!e && e.expiresAt > Date.now();
}


