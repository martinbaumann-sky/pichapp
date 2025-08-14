import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-local";

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.cookies.get("session_id")?.value;

    if (!sessionId) {
      return NextResponse.json({ user: null });
    }

    const user = getSession(sessionId);

    if (!user) {
      return NextResponse.json({ user: null });
    }

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
  } catch (error: any) {
    console.error("[AUTH] Verify error:", error);
    return NextResponse.json({ user: null });
  }
}
