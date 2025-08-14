import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-local";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.cookies.get("session_id")?.value || null;
    const uid = req.cookies.get("uid")?.value || null;

    // 1) Intentar con sesión en memoria
    if (sessionId) {
      const user = getSession(sessionId);
      if (user) {
        return NextResponse.json({ 
          user: { 
            id: user.id, 
            email: user.email, 
            name: user.name,
            comuna: user.comuna,
            position: user.position,
            isAdmin: user.isAdmin
          } 
        });
      }
    }

    // 2) Fallback: leer usuario desde DB por uid
    if (uid) {
      const user = await prisma.user.findUnique({ where: { id: uid }, include: { profile: true } });
      if (user) {
        const name = user.profile?.name || (user.email || "Usuario");
        const comuna = user.profile?.comuna || "";
        const position = user.profile?.position || undefined;
        return NextResponse.json({
          user: {
            id: user.id,
            email: user.email ?? "",
            name,
            comuna,
            position,
            isAdmin: user.isAdmin,
          }
        });
      }
    }

    return NextResponse.json({ user: null });
  } catch (error: any) {
    console.error("[AUTH] Session error:", error);
    return NextResponse.json({ user: null });
  }
}
