import { NextRequest, NextResponse } from "next/server";
import { generateAndStoreCode } from "@/lib/sms-dev";
import { resend } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { phone, email } = await req.json();
    if (!phone) return NextResponse.json({ error: "Phone required" }, { status: 400 });
    const code = generateAndStoreCode(phone);

    // Intentar usar Twilio si está configurado
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM;
    if (sid && token && from) {
      try {
        // Import dinámico para evitar crash si no está instalado
        // @ts-ignore
        const twilio = await import('twilio');
        const client = twilio.default ? twilio.default(sid, token) : twilio(sid, token);
        await client.messages.create({ body: `Tu código de verificación es: ${code}`, from, to: phone });
        return NextResponse.json({ ok: true });
      } catch (err) {
        console.warn('[SMS] Twilio envío falló, fallback a dev log/email', err);
      }
    }

    // Si hay RESEND configurado y se pasó un email, enviar por email como fallback
    if (resend && email) {
      try {
        await resend.sendEmail({
          from: 'no-reply@pichapp.cl',
          to: email,
          subject: 'Código de verificación PichApp',
          html: `<p>Tu código de verificación es: <strong>${code}</strong></p>`,
        });
        return NextResponse.json({ ok: true, via: 'email' });
      } catch (e) {
        console.warn('[SMS] Envío por email falló', e);
      }
    }

    // Intentar Textbelt (free testing key 'textbelt', limitado)
    try {
      const tb = await fetch('https://textbelt.com/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message: `Tu código de verificación es: ${code}`, key: process.env.TEXTBELT_KEY || 'textbelt' }),
      });
      const tbj = await tb.json().catch(() => ({}));
      if (tb.ok && tbj?.success) {
        return NextResponse.json({ ok: true, via: 'textbelt' });
      }
      console.warn('[SMS] Textbelt fallo', tbj);
    } catch (e) {
      console.warn('[SMS] Textbelt error', e);
    }

    // Fallback dev: loguear y en modo no producción devolver el código para facilitar pruebas
    console.log(`[SMS DEV] Código para ${phone}: ${code}`);
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ ok: true, dev: true, code });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const phone = String(req.nextUrl.searchParams.get("phone") || "");
    return NextResponse.json({ exists: !!phone });
  } catch (err) {
    return NextResponse.json({ exists: false });
  }
}


