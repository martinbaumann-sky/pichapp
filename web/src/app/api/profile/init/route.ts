import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { ensureUserInDatabase } from "@/lib/user";

export async function POST(req: NextRequest) {
  try {
    const uid = await requireUserId();
    const body = await req.json();
    const name = (body?.name ?? "").toString();
    const comuna = body?.comuna ? String(body.comuna) : "";
    const position = body?.position ? String(body.position) : null;

    const profile = await prisma.profile.upsert({
      where: { userId: uid },
      update: { name, comuna, position },
      create: { userId: uid, name, comuna, position },
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err as any;
    return NextResponse.json({ error: "Error al inicializar perfil" }, { status: 500 });
  }
}



