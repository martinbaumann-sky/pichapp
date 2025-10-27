import { createLocalUser, authenticateLocalUser } from "../src/lib/auth-local";
import { prisma } from "../src/lib/db";
import { createClient } from "@supabase/supabase-js";

async function main() {
  const email = `test-local+${Date.now()}@example.com`;
  const password = `Test1234`;
  let createdUserId: string | null = null;

  try {
    console.log("Iniciando prueba de signup -> signin con:", email);

    // Ensure clean state: remove existing user with same email
    await prisma.user.deleteMany({ where: { email } });

    const created = await createLocalUser(email, password, { name: "Usuario Prueba", comuna: "Ñuñoa", position: null });
    createdUserId = created.id;
    console.log("Usuario creado:", created);

    const auth = await authenticateLocalUser(email, password);
    console.log("Autenticación exitosa:", auth);

    console.log("Prueba completa OK");
  } catch (err: any) {
    console.error("Error en prueba:", err?.message ?? err);
  } finally {
    // Cleanup: intentar borrar en Supabase si corresponde
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (url && service && createdUserId) {
        const supa = createClient(url, service as string);
        try {
          const { error } = await supa.auth.admin.deleteUser(createdUserId as any);
          if (error) console.warn("No se pudo borrar usuario en Supabase:", error.message || error);
          else console.log("Usuario borrado en Supabase");
        } catch (e) {
          console.warn("Excepción borrando usuario en Supabase:", e);
        }
      }
      // Borrar dependencias primero en Prisma
      if (createdUserId) {
        try {
          await prisma.payment.deleteMany({ where: { userId: createdUserId } });
        } catch (e) {}
        try {
          await prisma.waitlistEntry.deleteMany({ where: { userId: createdUserId } });
        } catch (e) {}
        try {
          // Liberar spots si hubiese
          await prisma.spot.updateMany({ where: { userId: createdUserId }, data: { userId: null, status: "AVAILABLE" } as any });
        } catch (e) {}
        try {
          await prisma.profile.deleteMany({ where: { userId: createdUserId } });
        } catch (e) {}
        try {
          await prisma.user.deleteMany({ where: { id: createdUserId } });
        } catch (e) { console.warn("No se pudo borrar usuario en Prisma:", e); }
        console.log("Cleanup Prisma completado");
      }
    } catch (e) {
      console.warn("Error en cleanup:", e);
    }

    try { await prisma.$disconnect(); } catch {};
    process.exit(0);
  }
}

main();


