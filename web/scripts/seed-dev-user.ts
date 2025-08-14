import { createClient } from "@supabase/supabase-js";
import { prisma } from "../src/lib/db";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !service) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const supa = createClient(url, service);
  const { data, error } = await supa.auth.admin.createUser({
    email: "martin@pichapp.dev",
    password: "Maika",
    email_confirm: true,
    user_metadata: { name: "Martin" },
  });
  if (error) throw error;
  const user = data.user!;
  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: { id: user.id, email: user.email },
  });
  await prisma.profile.upsert({
    where: { userId: user.id },
    update: { name: "Martin", comuna: "Ñuñoa", phone: "+56 9 0000 0000", position: "DELANTERO" as any },
    create: { userId: user.id, name: "Martin", comuna: "Ñuñoa", phone: "+56 9 0000 0000", position: "DELANTERO" as any },
  });
  console.log("Usuario de desarrollo creado: martin@pichapp.dev / Maika");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });


