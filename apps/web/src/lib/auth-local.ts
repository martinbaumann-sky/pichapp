import { randomUUID } from "crypto";

type Session = { id: string; expiresAt: number };
type LocalUser = { id: string; email: string; password?: string | null } & Record<string, any>;

const sessions = new Map<string, Session>();
const users = new Map<string, LocalUser>();
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export function createSession(userId: string, ttlMs = DEFAULT_TTL_MS) {
  const token = randomUUID();
  sessions.set(token, { id: userId, expiresAt: Date.now() + ttlMs });
  return token;
}

export function getSession(token: string) {
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return session;
}

export function clearSession(token: string) {
  sessions.delete(token);
}

export function createLocalUser(email: string, password?: string, profile?: Record<string, any>) {
  const id = randomUUID();
  const user: LocalUser = { id, email, password: password ?? null, ...profile };
  users.set(id, user);
  return user;
}

export function findLocalUserByEmail(email: string) {
  for (const user of users.values()) {
    if (user.email.toLowerCase() === email.toLowerCase()) return user;
  }
  return null;
}

export function setDevPassword(email: string, password: string) {
  const existing = findLocalUserByEmail(email);
  if (existing) {
    existing.password = password;
    users.set(existing.id, existing);
  }
}

export function authenticateLocalUser(email: string, password: string) {
  const user = findLocalUserByEmail(email);
  if (!user) return null;
  if (!user.password || user.password === password) return user;
  return null;
}
