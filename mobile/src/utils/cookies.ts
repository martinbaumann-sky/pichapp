export function extractCookieValue(setCookieHeader: string | null, cookieName: string): string | null {
  if (!setCookieHeader || !cookieName) return null;
  const parts = setCookieHeader.split(/,(?=[^;]+=)/g);
  for (const part of parts) {
    const [pair] = part.split(';');
    if (!pair) continue;
    const [name, value] = pair.split('=').map((s) => s.trim());
    if (name === cookieName && value) {
      return decodeURIComponent(value);
    }
  }
  return null;
}
