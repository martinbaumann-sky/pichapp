import { createClient } from "@supabase/supabase-js";
import { prisma } from "../src/lib/db";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const preserveAdminId = process.env.ADMIN_USER_ID;
  const preserveAdminEmail = (process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL)?.toLowerCase();

  if (!url || !service) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en env");
    process.exit(1);
  }

  const supa = createClient(url, service);

  console.log("Obteniendo usuarios desde Prisma...");
  const allUsers = await prisma.user.findMany({ select: { id: true, email: true, isAdmin: true } });

  const toDelete = allUsers
    .filter((u) => {
      if (!u) return false;
      if (preserveAdminId && u.id === preserveAdminId) return false;
      if (preserveAdminEmail && u.email && u.email.toLowerCase() === preserveAdminEmail) return false;
      // también preservamos usuarios marcados como admin en la tabla
      if (u.isAdmin) return false;
      return true;
    })
    .map((u) => u.id);

  if (toDelete.length === 0) {
    console.log("No hay usuarios para borrar (todos son admins o no hay usuarios).");
    return;
  }

  console.log(`Borrando ${toDelete.length} usuarios:`, toDelete);

  // 1) Limpiar referencias en otras tablas que referencian userId
  console.log("Eliminando pagos y entradas de waitlist de esos usuarios...");
  await prisma.payment.deleteMany({ where: { userId: { in: toDelete } } });
  await prisma.waitlistEntry.deleteMany({ where: { userId: { in: toDelete } } });

  // 2) Liberar spots ocupados por esos usuarios (dejarlos AVAILABLE)
  console.log("Liberando spots ocupados por esos usuarios...");
  await prisma.spot.updateMany({ where: { userId: { in: toDelete } }, data: { userId: null, status: "AVAILABLE" } as any });

  // 3) Eliminar perfiles asociados
  console.log("Eliminando perfiles asociados...");
  await prisma.profile.deleteMany({ where: { userId: { in: toDelete } } });

  // 4) Intentar borrar usuarios en Supabase (si existen)
  console.log("Intentando borrar usuarios en Supabase auth...");
  for (const id of toDelete) {
    try {
      // supabase-js admin.deleteUser acepta el id del usuario
      const { error } = await supa.auth.admin.deleteUser(id as any);
      if (error) console.warn(`Supabase: no se pudo borrar usuario ${id}:`, error.message || error);
      else console.log(`Supabase: usuario ${id} borrado`);
    } catch (err: any) {
      console.warn(`Excepción borrando usuario ${id} en Supabase:`, err?.message ?? err);
    }
  }

  // 5) Finalmente borrar usuarios en Prisma
  console.log("Borrando usuarios en Prisma...");
  await prisma.user.deleteMany({ where: { id: { in: toDelete } } });

  console.log("Usuarios borrados correctamente.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });


