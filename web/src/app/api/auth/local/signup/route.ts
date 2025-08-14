import { NextRequest, NextResponse } from "next/server";
import { createLocalUser, createSession } from "@/lib/auth-local";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, comuna, position } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    if (!comuna) {
      return NextResponse.json({ error: "Selecciona tu comuna" }, { status: 400 });
    }

    // Validar posición si se proporciona
    const validPositions = ["ARQUERO", "DEFENSA", "LATERAL", "VOLANTE", "DELANTERO"];
    let normalizedPosition = null;
    
    if (position) {
      const upperPosition = position.toUpperCase();
      if (!validPositions.includes(upperPosition)) {
        return NextResponse.json({ 
          error: `Posición inválida. Posiciones válidas: ${validPositions.join(", ")}` 
        }, { status: 400 });
      }
      normalizedPosition = upperPosition;
    }

    const user = await createLocalUser(email, password, { 
      name, 
      comuna, 
      position: normalizedPosition 
    });
    const sessionId = createSession(user);

    const response = NextResponse.json({ 
      success: true, 
      user: { id: user.id, email: user.email, name: user.name },
      message: "Cuenta creada exitosamente" 
    });

    // Establecer cookie de sesión
    response.cookies.set("session_id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7 // 7 días
    });

    // Cookie uid legible por el cliente
    response.cookies.set("uid", user.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30 // 30 días
    });

    return response;
  } catch (error: any) {
    console.error("[AUTH] Signup error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
