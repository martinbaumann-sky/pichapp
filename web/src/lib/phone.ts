export function digitsOnly(input: string): string {
  return String(input || "").replace(/\D+/g, "");
}

// Returns the last 9 digits (Chile local) to compare flexibly
export function last9(input: string): string {
  const d = digitsOnly(input);
  return d.slice(-9);
}

export function normalizeForDisplay(phone: string): string {
  const d = digitsOnly(phone);
  if (d.length >= 9) {
    const nine = d.slice(-9);
    // Format as +56 9 XXXX XXXX if possible
    const cc = d.length > 9 ? "+" + d.slice(0, d.length - 9) + " " : "+56 ";
    return `${cc}${nine[0]} ${nine.slice(1,5)} ${nine.slice(5)}`;
  }
  return phone;
}

<<<<<<< HEAD
export function normalizeForStorage(phone: string): string | null {
  const digits = digitsOnly(phone);
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
  const candidate = digitsOnly(phone);
  if (candidate.length < normalizedTarget.length) return false;
  return candidate.endsWith(normalizedTarget);
}
=======
export function normalizeForStorage(phone: string): string {
  const digits = digitsOnly(phone);
  if (!digits) return "";
  const nine = last9(digits);
  if (!nine) return "";
  const ccDigits = digits.length > nine.length ? digits.slice(0, digits.length - nine.length) : "56";
  const cc = ccDigits || "56";
  return `+${cc}${nine}`;
}

>>>>>>> ed92f3cfd883cb47dd2736c9ea353b38e3e58f4e
