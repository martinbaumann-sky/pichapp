import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { requireUserId } from "@/lib/auth";
import { ensureUserInDatabase } from "@/lib/user";
import { normalizeForStorage } from "@/lib/phone";

export async function GET() {
  try {
    const userId = await requireUserId();
    await ensureUserInDatabase({ id: userId, email: null });
    const profile = await prisma.profile.findUnique({ where: { userId } });
    return NextResponse.json({ profile });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const name = String(body.name || "").trim();
    const phoneInput = String(body.phone || "").trim();
    const comuna = String(body.comuna || "").trim();
    const positionRaw = body.position ? String(body.position).toUpperCase() : null;
    const skillLevelRaw = body.skillLevel ? String(body.skillLevel).toUpperCase() : null;
    const bioInput = typeof body.bio === "string" ? body.bio : "";

    const allowedPositions = new Set(["ARQUERO", "DEFENSA", "LATERAL", "VOLANTE", "DELANTERO"]);
    const allowedSkillLevels = new Set(["BEGINNER", "INTERMEDIATE", "ADVANCED"]);
    const position = positionRaw && allowedPositions.has(positionRaw) ? positionRaw : null;
    const skillLevel = skillLevelRaw && allowedSkillLevels.has(skillLevelRaw) ? skillLevelRaw : null;
    const bio = bioInput.trim().slice(0, 400);

    if (!name || !comuna) {
      return NextResponse.json({ error: "Nombre y comuna son obligatorios" }, { status: 400 });
    }
    const normalizedPhone = normalizeForStorage(phoneInput);
    const localNine = normalizedPhone ? normalizedPhone.slice(-9) : '';
    if (!normalizedPhone || localNine.length !== 9 || !localNine.startsWith('9')) {
      return NextResponse.json({ error: "Celular invalido (+56 9 XXXXXXXX)" }, { status: 400 });
    }

    const data: any = {
      name,
      phone: normalizedPhone,
      comuna,
      position,
      skillLevel,
      bio: bio ? bio : null,
    };
    const profile = await prisma.profile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
    return NextResponse.json({ profile });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  }
}
