import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth-local";

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.cookies.get("session_id")?.value;

    if (sessionId) {
      deleteSession(sessionId);
    }

    const response = NextResponse.json({ success: true });

    // Eliminar cookies
    response.cookies.set("session_id", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0
    });
    response.cookies.set("uid", "", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0
    });

    return response;
  } catch (error: any) {
    console.error("[AUTH] Signout error:", error);
    return NextResponse.json({ success: true });
  }
}
