import { randomUUID } from "crypto";

type SimpleUser = {
  id: string;
  email: string;
} & Record<string, any>;

const simpleUsers = new Map<string, SimpleUser>();
const simpleSessions = new Map<string, { id: string; createdAt: number }>();

export function createUser(data: { email: string } & Record<string, any>) {
  const existing = Array.from(simpleUsers.values()).find((u) => u.email.toLowerCase() === data.email.toLowerCase());
  if (existing) return existing;
  const user: SimpleUser = { id: randomUUID(), ...data };
  simpleUsers.set(user.id, user);
  return user;
}

export function createSessionForUser(user: SimpleUser) {
  const token = randomUUID();
  simpleSessions.set(token, { id: user.id, createdAt: Date.now() });
  return token;
}
