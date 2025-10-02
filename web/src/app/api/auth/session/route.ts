import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { clearSessionCookie, getSessionUserId } from "@/lib/auth-core";
import { normalizeForDisplay } from "@/lib/phone";
import { toAuthUser } from "@/lib/auth-user";
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
        role: true,
        emailVerifiedAt: true,
        profile: { select: { name: true, comuna: true, position: true, phone: true } },
        disabledAt: true,
      },
    });
    if (!user) return NextResponse.json({ user: null });
    if (user.disabledAt) {
      const res = NextResponse.json({ user: null });
      clearSessionCookie(res);
      return res;
    }
    const base = toAuthUser(user);
    return NextResponse.json({
      user: {
        ...base,
        phone: user.profile?.phone || null,
        phoneDisplay: user.profile?.phone ? normalizeForDisplay(user.profile.phone) : null,
      },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
