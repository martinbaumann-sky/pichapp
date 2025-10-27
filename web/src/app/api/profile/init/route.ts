import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const uid = await requireUserId();
    const body = await req.json();
    const name = (body?.name ?? "").toString();
    const comuna = body?.comuna ? String(body.comuna) : "";
    const positionRaw = body?.position ? String(body.position).toUpperCase() : null;
    const skillLevelRaw = body?.skillLevel ? String(body.skillLevel).toUpperCase() : null;
    const bioInput = typeof body?.bio === "string" ? body.bio : "";

    const allowedPositions = new Set(["ARQUERO", "DEFENSA", "LATERAL", "VOLANTE", "DELANTERO"]);
    const allowedSkillLevels = new Set(["BEGINNER", "INTERMEDIATE", "ADVANCED"]);
    const position = positionRaw && allowedPositions.has(positionRaw) ? positionRaw : null;
    const skillLevel = skillLevelRaw && allowedSkillLevels.has(skillLevelRaw) ? skillLevelRaw : null;
    const bio = bioInput.trim().slice(0, 400);

    const profile = await prisma.profile.upsert({
      where: { userId: uid },
      update: { name, comuna, position, skillLevel, bio: bio ? bio : null },
      create: { userId: uid, name, comuna, position, skillLevel, bio: bio ? bio : null },
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err as any;
    return NextResponse.json({ error: "Error al inicializar perfil" }, { status: 500 });
  }
}



