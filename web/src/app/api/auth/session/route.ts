import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth-core";
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const uid = await getSessionUserId();
    if (!uid) return NextResponse.json({ user: null });
    const user = await prisma.user.findUnique({
      where: { id: uid },
      select: {
        id: true,
        email: true,
        isAdmin: true,
        profile: { select: { name: true, comuna: true, position: true } },
      },
    });
    if (!user) return NextResponse.json({ user: null });
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        isAdmin: !!user.isAdmin,
        emailVerified: false,
        name: user.profile?.name || null,
        comuna: user.profile?.comuna || null,
        position: user.profile?.position || null,
      },
    });
  } catch (err) {
    return NextResponse.json({ user: null });
  }
}
