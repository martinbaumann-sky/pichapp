import { NextRequest, NextResponse } from "next/server";
import { generateAndStoreCode } from "@/lib/sms-dev";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const phone = body?.phone;
    console.log(`[send-sms] received POST body: ${JSON.stringify(body)}`);
    if (!phone) {
      console.log(`[send-sms] missing phone in request`);
      return NextResponse.json({ ok: false, error: "Phone missing" }, { status: 400 });
    }

    // Generar código en dev / fallback
    const code = generateAndStoreCode(phone);
    // Logear código en consola del servidor para facilitar debugging en desarrollo
    try {
      if (process.env.NODE_ENV !== "production") console.log(`[send-sms] code for ${phone}: ${code}`);
    } catch (e) {}

    // Intentar buscar usuario y devolver necesidades de signup
    let needsSignup = true;
    try {
      const user = await prisma.user.findFirst({ where: { phone } });
      if (user) needsSignup = false;
    } catch (e) {
      console.log(`[send-sms] prisma lookup error: ${String(e)}`);
    }

    // En modo desarrollo, devolver el código para facilitar testing
    const dev = process.env.NODE_ENV !== "production";
    const resp = { ok: true, dev, code: dev ? code : undefined, needsSignup };
    console.log(`[send-sms] responding: ${JSON.stringify(resp)}`);
    return NextResponse.json(resp);
  } catch (err: any) {
    console.log(`[send-sms] handler error: ${String(err)}`);
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
