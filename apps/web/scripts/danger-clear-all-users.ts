import { createClient } from "@supabase/supabase-js";
import { prisma } from "../src/lib/db";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supa = url && service ? createClient(url, service) : null;

  console.log("Recopilando usuarios...");
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  const ids = users.map((u) => u.id);

  if (ids.length === 0) {
    console.log("No hay usuarios en la base de datos.");
    return;
  }

  console.log(`Usuarios a borrar (${ids.length}):`, users.map(u => u.email || u.id));

  // Borrar dependencias en orden seguro
  // Intentar borrar con métodos Prisma normales en orden seguro
  const safeDeletes = async () => {
    try { console.log("Borrando payments de usuarios..."); await prisma.payment.deleteMany({ where: { userId: { in: ids } } }); } catch (e) { console.warn("payments error", e); }
    try { console.log("Borrando organizer/player ratings relacionados..."); await prisma.organizerRating?.deleteMany?.({ where: { OR: [{ organizerId: { in: ids } }, { raterId: { in: ids } }] } } as any); } catch (e) { console.warn("ratings error (prisma)", e); }
    try { console.log("Borrando player ratings relacionados..."); await prisma.playerRating?.deleteMany?.({ where: { OR: [{ playerId: { in: ids } }, { raterId: { in: ids } }] } } as any); } catch (e) { console.warn("player ratings error (prisma)", e); }
    try { console.log("Borrando messages enviados por usuarios..."); await prisma.message?.deleteMany?.({ where: { senderId: { in: ids } } } as any); } catch (e) { console.warn("messages error (prisma)", e); }
    try { console.log("Borrando waitlist entries..."); await prisma.waitlistEntry.deleteMany({ where: { userId: { in: ids } } }); } catch (e) { console.warn("waitlist error (prisma)", e); }
    try { console.log("Liberando spots ocupados por usuarios (dejando AVAILABLE)..."); await prisma.spot.updateMany({ where: { userId: { in: ids } }, data: { userId: null, status: "AVAILABLE" } as any }); } catch (e) { console.warn("spots error (prisma)", e); }
    try { console.log("Borrando payments relacionados a matches..."); await prisma.payment.deleteMany({ where: { matchId: { in: ids } } as any }); } catch (e) { /* ignore */ }
    try { console.log("Borrando matches organizados por usuarios..."); await prisma.match.deleteMany({ where: { organizerId: { in: ids } } }); } catch (e) { console.warn("matches error (prisma)", e); }
    try { console.log("Borrando perfiles..."); await prisma.profile.deleteMany({ where: { userId: { in: ids } } }); } catch (e) { console.warn("profiles error (prisma)", e); }
  };

  await safeDeletes();

  // Intentar borrar usuarios en Supabase auth si es posible
  if (supa) {
    console.log("Intentando borrar usuarios en Supabase (auth)...");
    for (const id of ids) {
      try {
        const { error } = await supa.auth.admin.deleteUser(id as any);
        if (error) console.warn(`Supabase: no se pudo borrar ${id}:`, error.message || error);
      } catch (e) {
        console.warn(`Supabase exception borrando ${id}:`, e);
      }
    }
  } else {
    console.log("No hay credenciales de Supabase: se omite borrado en auth." );
  }

  // Si aún hay constraints, intentar borrado por SQL directo (más agresivo)
  try {
    console.log("Intentando borrados por SQL directo para resolver FK...");
    const tables = [
      "Payment",
      "OrganizerRating",
      "PlayerRating",
      "Message",
      "WaitlistEntry",
      "Spot",
      "Match",
      "Profile",
      "User",
    ];

    // Detectar si usamos SQLite (archivo local) para desactivar foreign keys temporalmente
    const isSqlite = (process.env.DATABASE_URL || "").includes("file:");
    if (isSqlite) {
      console.log("Desactivando foreign keys en SQLite...");
      await prisma.$executeRawUnsafe("PRAGMA foreign_keys = OFF;");
    }

    for (const t of tables) {
      try {
        console.log("DELETE FROM", t);
        await prisma.$executeRawUnsafe(`DELETE FROM \"${t}\";`);
      } catch (e) {
        console.warn(`SQL delete error table ${t}:`, e);
      }
    }

    if (isSqlite) {
      console.log("Reactivando foreign keys en SQLite...");
      await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON;");
    }
  } catch (e) { console.warn("users delete error (sql)", e); }

  console.log("Operación completada.");
}

main().then(()=>process.exit(0)).catch((e)=>{ console.error(e); process.exit(1); });


