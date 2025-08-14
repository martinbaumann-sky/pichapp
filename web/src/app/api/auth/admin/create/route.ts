import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/db";

export async function POST() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const email = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD || process.env.ADMIN_PASS;
    if (!url || !serviceKey || !email || !password) {
      return NextResponse.json({ error: "Faltan env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD" }, { status: 400 });
    }
    const supa = createClient(url, serviceKey);
    const { data, error } = await supa.auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !data.user) {
      return NextResponse.json({ error: error?.message || "No se pudo crear usuario admin" }, { status: 500 });
    }
    const user = data.user;
    await prisma.user.upsert({
      where: { id: user.id },
      update: { email, isAdmin: true },
      create: { id: user.id, email, isAdmin: true },
    });
    return NextResponse.json({ ok: true, id: user.id, email });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Error" }, { status: 500 });
  }
}


