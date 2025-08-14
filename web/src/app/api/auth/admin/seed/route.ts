import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST() {
  try {
    const email = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    const id = process.env.ADMIN_USER_ID;
    if (!email || !id) {
      return NextResponse.json({ error: "Faltan ADMIN_EMAIL y ADMIN_USER_ID en env" }, { status: 400 });
    }
    const user = await prisma.user.upsert({
      where: { id },
      update: { email, isAdmin: true },
      create: { id, email, isAdmin: true },
    });
    return NextResponse.json({ ok: true, user });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Error" }, { status: 500 });
  }
}


