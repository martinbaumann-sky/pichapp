import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteSession } from "@/lib/auth-local";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;
    if (sessionId) {
      try { deleteSession(sessionId); } catch {}
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set("session_id", "", { path: "/", maxAge: 0 });
    res.cookies.set("uid", "", { path: "/", maxAge: 0 });
    return res;
  } catch (err: any) {
    console.error("[signout] handler error:", err);
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
