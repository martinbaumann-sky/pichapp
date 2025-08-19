type CodeEntry = { code: string; expiresAt: number };

const codes = new Map<string, CodeEntry>();

export function generateAndStoreCode(phone: string) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  codes.set(phone, { code, expiresAt: Date.now() + 5 * 60 * 1000 });
  return code;
}

export function verifyCode(phone: string, code: string) {
  const entry = codes.get(phone);
  if (!entry) return { ok: false, error: "Código no enviado" };
  if (entry.expiresAt < Date.now()) { codes.delete(phone); return { ok: false, error: "Código expirado" }; }
  if (entry.code !== String(code)) return { ok: false, error: "Código inválido" };
  codes.delete(phone);
  return { ok: true };
}

export function hasCode(phone: string) {
  const e = codes.get(phone);
  return !!e && e.expiresAt > Date.now();
}


