// Sistema de autenticación local para desarrollo
import { prisma } from "./db";

export interface LocalUser {
  id: string;
  email: string;
  name: string;
  comuna: string;
  position?: string;
  isAdmin: boolean;
}

// Simular sesiones en memoria (en producción usar cookies/JWT)
const sessions = new Map<string, LocalUser>();

export async function createLocalUser(email: string, password: string, userData: any): Promise<LocalUser> {
  // Verificar si el usuario ya existe
  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { profile: true }
  });

  if (existingUser) {
    throw new Error("Este correo ya está registrado");
  }

  // Crear usuario
  const user = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      email,
      isAdmin: false,
      profile: {
        create: {
          name: userData.name,
          phone: userData.phone || "+56 9 1234 5678",
          comuna: userData.comuna,
          position: userData.position || null
        }
      }
    },
    include: { profile: true }
  });

  return {
    id: user.id,
    email: user.email!,
    name: user.profile!.name,
    comuna: user.profile!.comuna,
    position: user.profile!.position || undefined,
    isAdmin: user.isAdmin
  };
}

export async function authenticateLocalUser(email: string, password: string): Promise<LocalUser> {
  // En desarrollo, aceptar cualquier contraseña
  const user = await prisma.user.findUnique({
    where: { email },
    include: { profile: true }
  });

  if (!user || !user.profile) {
    throw new Error("Correo o contraseña inválidos");
  }

  return {
    id: user.id,
    email: user.email!,
    name: user.profile.name,
    comuna: user.profile.comuna,
    position: user.profile.position || undefined,
    isAdmin: user.isAdmin
  };
}

export function createSession(user: LocalUser): string {
  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, user);
  return sessionId;
}

export function getSession(sessionId: string): LocalUser | null {
  return sessions.get(sessionId) || null;
}

export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId);
}
