import { NextRequest, NextResponse } from "next/server";
import { authenticateLocalUser, createSession } from "@/lib/auth-local";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const user = await authenticateLocalUser(email, password);
    const sessionId = createSession(user);

    const response = NextResponse.json({ 
      success: true, 
      user: { id: user.id, email: user.email, name: user.name },
      message: "Sesión iniciada exitosamente" 
    });

    // Cookie de sesión httpOnly (servidor)
    response.cookies.set("session_id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7 // 7 días
    });

    // Cookie uid legible por el cliente para persistencia ligera
    response.cookies.set("uid", user.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30 // 30 días
    });

    return response;
  } catch (error: any) {
    console.error("[AUTH] Signin error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
