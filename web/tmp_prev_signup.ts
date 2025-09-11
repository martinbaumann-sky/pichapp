import { NextRequest, NextResponse } from "next/server";
import { createLocalUser, setDevPassword, createSession as createLocalSession } from "@/lib/auth-local";
import { createUser as createSimpleUser, createSessionForUser } from "@/lib/simpleAuth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    console.log(`[signup] received: ${JSON.stringify(body)}`);
    const { email, password, name, lastName, comuna, position, phone, birthday, gender } = body || {};
    if (!email) return NextResponse.json({ ok: false, error: "Email missing" }, { status: 400 });

    try {
      // Intentar crear usuario con lógica local (puede usar Prisma o Supabase internamente)
      const user = await createLocalUser(email, password, { name, lastName, comuna, position, phone, birthday, gender });
      // Establecer contraseña en modo dev (para login fallback)
      try { setDevPassword(email, password); } catch (e) {}
      console.log(`[signup] created user via createLocalUser: ${JSON.stringify({ id: user.id, email: user.email })}`);
      // Crear sesión en memoria y setear cookie
      try {
        const sid = createLocalSession(user as any);
        const res = NextResponse.json({ ok: true, user });
        res.cookies.set("session_id", sid, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 30 });
        res.cookies.set("uid", user.id, { path: "/", maxAge: 60 * 60 * 24 * 30 });
        return res;
      } catch (e) {
        return NextResponse.json({ ok: true, user });
      }
    } catch (err: any) {
      console.log(`[signup] createLocalUser error: ${String(err)}`);
      // Fallback: usar simple file-based users
      try {
        const simple = createSimpleUser({ email, phone, name, lastName, comuna, position, birthday, gender });
        try { setDevPassword(email, password); } catch (e) {}
        console.log(`[signup] created user via simpleAuth: ${JSON.stringify({ id: simple.id, email: simple.email })}`);
        try {
          const sid = createSessionForUser(simple as any);
          const res = NextResponse.json({ ok: true, user: simple });
          res.cookies.set("session_id", sid, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 30 });
          res.cookies.set("uid", simple.id, { path: "/", maxAge: 60 * 60 * 24 * 30 });
          return res;
        } catch (e) {
          return NextResponse.json({ ok: true, user: simple });
        }
      } catch (err2: any) {
        console.log(`[signup] simpleAuth fallback error: ${String(err2)}`);
        return NextResponse.json({ ok: false, error: String(err2?.message || err2) }, { status: 500 });
      }
    }
  } catch (err: any) {
    console.log(`[signup] handler error: ${String(err)}`);
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}

