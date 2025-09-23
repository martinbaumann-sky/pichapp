export const normalizePhone = (input: string): string => (input ? String(input).replace(/\D+/g, "") : "");

export const formatPhoneCL = (value: string): string => {
  const digits = normalizePhone(value);
  if (!digits) return "";
  const local = digits.length > 9 ? digits.slice(-9) : digits;
  if (local.length < 9) {
    return local;
  }

  const prefix = digits.length > 9 ? `+${digits.slice(0, digits.length - 9)} ` : "+56 ";
  const first = local.charAt(0);
  const middle = local.slice(1, 5);
  const end = local.slice(5);
  return `${prefix}${first} ${middle} ${end}`.trim();
};

export function digitsOnly(input: string): string {
  return normalizePhone(input);
}

// Returns the last 9 digits (Chile local) to compare flexibly
export function last9(input: string): string {
  return normalizePhone(input).slice(-9);
}

export function normalizeForDisplay(phone: string): string {
  const formatted = formatPhoneCL(phone);
  return formatted || phone;
}

export function normalizeForStorage(phone: string): string | null {
  const digits = normalizePhone(phone);
  if (digits.length < 7) return null;
  if (digits.length > 11) {
    return digits.slice(-11);
  }
  return digits;
}

export function matchesByLastDigits(phone: string | null | undefined, target: string): boolean {
  if (!phone) return false;
  const normalizedTarget = last9(target);
  if (normalizedTarget.length === 0) return false;
  const candidate = normalizePhone(phone);
  if (candidate.length < normalizedTarget.length) return false;
  return candidate.endsWith(normalizedTarget);
}
