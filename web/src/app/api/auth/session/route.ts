import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth-local";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value || null;
    const uid = cookieStore.get("uid")?.value || null;

    if (sessionId) {
      const s = getSession(sessionId);
      if (s) return NextResponse.json({ user: s });
    }

    // fallback: if uid cookie exists, return minimal user with id
    if (uid) return NextResponse.json({ user: { id: uid } });

    return NextResponse.json({ user: null });
  } catch (err) {
    console.error("/api/auth/session error:", err);
    return NextResponse.json({ user: null });
  }
}


