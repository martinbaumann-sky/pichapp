import { NextRequest, NextResponse } from "next/server";
import { verifyCode } from "@/lib/sms-dev";

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json();
    if (!phone || !code) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    const res = verifyCode(phone, String(code));
    if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}


