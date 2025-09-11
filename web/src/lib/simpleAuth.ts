import fs from "fs";
import path from "path";
import { normalizePhone } from "./sms-dev";

const DATA_DIR = path.join(process.cwd(), "web", "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");

export type SimpleUser = {
  id: string;
  phone: string;
  name: string;
  lastName?: string | null;
  comuna?: string | null;
  position?: string | null;
  birthday?: string | null;
  gender?: string | null;
  email?: string | null;
  createdAt: string;
};

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {}
}

function loadUsers(): SimpleUser[] {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    const raw = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(raw || "[]");
  } catch (e) {
    console.warn("[simpleAuth] loadUsers error", e);
    return [];
  }
}

function saveUsers(users: SimpleUser[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (e) {
    console.warn("[simpleAuth] saveUsers error", e);
  }
}

function loadSessions(): Record<string, SimpleUser> {
  try {
    if (!fs.existsSync(SESSIONS_FILE)) return {};
    const raw = fs.readFileSync(SESSIONS_FILE, "utf-8");
    return JSON.parse(raw || "{}");
  } catch (e) {
    return {};
  }
}

function saveSessions(map: Record<string, SimpleUser>) {
  try {
    ensureDataDir();
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(map, null, 2), "utf-8");
  } catch (e) {
    console.warn("[simpleAuth] saveSessions error", e);
  }
}

export function findUserByPhone(phone: string): SimpleUser | null {
  const users = loadUsers();
  const key = normalizePhone(phone);
  // match exact normalized or last 8 digits
  for (const u of users) {
    const a = normalizePhone(u.phone || "");
    if (!a) continue;
    if (a === key) return u;
    if (a.slice(-8) === key.slice(-8)) return u;
    if (a.endsWith(key) || key.endsWith(a)) return u;
  }
  return null;
}

export function findUserById(id: string): SimpleUser | null {
  const users = loadUsers();
  return users.find((u) => u.id === id) || null;
}

export function createUser(data: Partial<SimpleUser>): SimpleUser {
  const users = loadUsers();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const user: SimpleUser = {
    id,
    phone: data.phone || "",
    name: data.name || `Usuario ${id.slice(0, 6)}`,
    lastName: data.lastName ?? null,
    comuna: data.comuna ?? null,
    position: data.position ?? null,
    birthday: data.birthday ?? null,
    gender: data.gender ?? null,
    email: data.email ?? null,
    createdAt: now,
  };
  users.push(user);
  saveUsers(users);
  return user;
}

// Sessions in-memory
const sessions = new Map<string, SimpleUser>();

// Hydrate sessions from disk so they survive restarts in dev
try {
  const raw = loadSessions();
  for (const [k, v] of Object.entries(raw)) sessions.set(k, v as SimpleUser);
} catch (e) {}

export function createSessionForUser(user: SimpleUser): string {
  const sid = crypto.randomUUID();
  sessions.set(sid, user);
  try {
    const obj: Record<string, SimpleUser> = {};
    for (const [k, v] of sessions.entries()) obj[k] = v;
    saveSessions(obj);
  } catch (e) {}
  return sid;
}

export function getSessionUser(sessionId: string): SimpleUser | null {
  return sessions.get(sessionId) || null;
}

export function deleteSession(sessionId: string) {
  sessions.delete(sessionId);
  try {
    const obj: Record<string, SimpleUser> = {};
    for (const [k, v] of sessions.entries()) obj[k] = v;
    saveSessions(obj);
  } catch (e) {}
}

export function updateUser(id: string, data: Partial<SimpleUser>): SimpleUser | null {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...data };
  saveUsers(users);
  // also update sessions where applicable
  for (const [k, v] of sessions.entries()) {
    if (v.id === id) {
      const merged = { ...v, ...data } as SimpleUser;
      sessions.set(k, merged);
    }
  }
  try {
    const obj: Record<string, SimpleUser> = {};
    for (const [k, v] of sessions.entries()) obj[k] = v;
    saveSessions(obj);
  } catch (e) {}
  return users[idx];
}

// exported above with persistence; keep single implementation
