// Sistema de autenticación local para desarrollo
import { prisma } from "./db";
import { createClient } from "@supabase/supabase-js";
import { ensureUserInDatabase } from "./user";

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
// En desarrollo guardamos passwords en memoria para validar credenciales
const passwords = new Map<string, string>();

export async function createLocalUser(email: string, password: string, userData: any): Promise<LocalUser> {
  // Si hay Supabase configurado, crear usuario ahí (admin) y reflejar en Prisma
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && service) {
    const supa = createClient(url, service as string);
    const { data, error } = await supa.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: userData.name }
    });
    if (error) throw new Error(error.message || "Error al crear usuario en Supabase");
    const created = data.user!;

    // Asegurar existencia en DB propia
    await prisma.user.upsert({
      where: { id: created.id },
      update: { email },
      create: { id: created.id, email }
    });

    await prisma.profile.upsert({
      where: { userId: created.id },
      update: { name: userData.name, comuna: userData.comuna, position: userData.position || null, phone: userData.phone || "+56 9 1234 5678" },
      create: { userId: created.id, name: userData.name, comuna: userData.comuna, position: userData.position || null, phone: userData.phone || "+56 9 1234 5678" }
    });

    return {
      id: created.id,
      email: created.email || email,
      name: userData.name,
      comuna: userData.comuna,
      position: userData.position || undefined,
      isAdmin: false
    };
  }

  // Fallback: comportamiento previo (prisma local + password en memoria)
  // Verificar si el usuario ya existe
  const existingUser = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
  if (existingUser) throw new Error("Este correo ya está registrado");

  // Crear usuario en DB local
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

  // Guardar contraseña en memoria (solo para desarrollo)
  try { if (email && password) passwords.set(email.toLowerCase(), password); } catch {}

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
  // Si hay Supabase configurado, delegar autenticación a Supabase
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && anon) {
    const supa = createClient(url, anon as string);
    const { data, error } = await supa.auth.signInWithPassword({ email, password });
    if (error || !data.session || !data.user) {
      throw new Error("Correo o contraseña inválidos");
    }
    const u = data.user;

    // Reflejar en DB propia (si hace falta) y obtener profile
    await ensureUserInDatabase({ id: u.id, email: u.email });
    let user = await prisma.user.findUnique({ where: { id: u.id }, include: { profile: true } });
    if (!user) throw new Error("Usuario no encontrado después de autenticar");

    // Si no hay perfil, crear uno básico usando metadata o email
    if (!user.profile) {
      const name = (u.user_metadata as any)?.name || (u.email?.split("@")[0] ?? "Usuario");
      await prisma.profile.create({ data: { userId: user.id, name, phone: "+56 9 1234 5678", comuna: "", position: null } });
      user = await prisma.user.findUnique({ where: { id: u.id }, include: { profile: true } });
    }

    return {
      id: user!.id,
      email: user!.email!,
      name: user!.profile!.name,
      comuna: user!.profile!.comuna,
      position: user!.profile!.position || undefined,
      isAdmin: user!.isAdmin
    };
  }

  // Fallback: comportamiento previo (prisma + password en memoria)
  const user = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
  if (!user || !user.profile) throw new Error("Correo o contraseña inválidos");
  const stored = passwords.get((email || "").toLowerCase());
  if (!stored || stored !== password) throw new Error("Correo o contraseña inválidos");
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

// Helper para pruebas locales: establecer/actualizar contraseña en memoria
export function setDevPassword(email: string, password: string) {
  try {
    if (email && password) passwords.set(email.toLowerCase(), password);
  } catch (e) {
    // silent
  }
}