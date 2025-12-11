// @ts-nocheck

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function isGmailDomain(domain: string): boolean {
  if (!domain) return false;
  const normalized = domain.toLowerCase();
  return normalized === "gmail.com" || normalized === "googlemail.com";
}

function canonicalizeGmailDomain(domain: string): string {
  const normalized = domain.toLowerCase();
  return normalized === "googlemail.com" ? "gmail.com" : normalized;
}

export function getEmailLookupVariants(raw: string): string[] {
  const primary = normalizeEmail(raw);
  if (!primary) {
    return [];
  }

  const variants = new Set<string>();
  variants.add(primary);

  const atIndex = primary.indexOf("@");
  if (atIndex <= 0 || atIndex === primary.length - 1) {
    return Array.from(variants);
  }

  const localPart = primary.slice(0, atIndex);
  const domainPart = primary.slice(atIndex + 1);

  if (!domainPart) {
    return Array.from(variants);
  }

  const canonicalDomain = canonicalizeGmailDomain(domainPart);
  if (canonicalDomain !== domainPart) {
    variants.add(`${localPart}@${canonicalDomain}`);
  }

  if (isGmailDomain(canonicalDomain)) {
    const plusIndex = localPart.indexOf("+");
    const baseLocal = plusIndex >= 0 ? localPart.slice(0, plusIndex) : localPart;
    const strippedLocal = baseLocal.replace(/\./g, "");
    if (strippedLocal) {
      variants.add(`${strippedLocal}@${canonicalDomain}`);
      if (canonicalDomain !== domainPart) {
        variants.add(`${strippedLocal}@${domainPart}`);
      }
    }
  }

  return Array.from(variants);
}

export function buildEmailLookupWhere(email: string): Record<string, any> {
  const variants = getEmailLookupVariants(email);
  if (variants.length === 0) {
    return { email: { equals: "", mode: "insensitive" } };
  }

  if (variants.length === 1) {
    return { email: { equals: variants[0], mode: "insensitive" } };
  }

  return {
    OR: variants.map((variant) => ({ email: { equals: variant, mode: "insensitive" } })),
  };
}

