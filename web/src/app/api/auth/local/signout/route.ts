import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth-core";

export async function POST() {
  try {
    const res = NextResponse.json({ ok: true });
    clearSessionCookie(res);
    return res;
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
