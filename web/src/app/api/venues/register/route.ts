import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { z } from "zod";
import { normalizeForStorage } from "@/lib/phone";
import crypto from "node:crypto";
import { assertResend } from "@/lib/email";

const registerSchema = z.object({
  name: z.string().min(3).max(120),
  address: z.string().min(5).max(200),
  comuna: z.string().min(3).max(80),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  contactName: z.string().min(3).max(120).optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  contactPhone: z.string().min(7).max(20).optional().nullable(),
});

function baseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || "http://localhost:3000";
  try {
    return new URL(envUrl).origin;
  } catch {
    return "http://localhost:3000";
  }
}

function mailtoContact() {
  return process.env.PICHAPP_VENUE_VERIFIER_EMAIL || "contacto.pichapp@gmail.com";
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json().catch(() => ({}));
    const parsed = registerSchema.safeParse({
      ...body,
      lat: body?.lat == null ? null : Number(body.lat),
      lng: body?.lng == null ? null : Number(body.lng),
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const phone = data.contactPhone ? normalizeForStorage(data.contactPhone) : null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, status: true, venue: true },
    });
    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Cuenta no disponible" }, { status: 403 });
    }

    if (user.venue && user.venue.status === "APPROVED") {
      return NextResponse.json({ error: "Esta cuenta ya está verificada como cancha" }, { status: 400 });
    }

    const verificationToken = crypto.randomUUID();

    const venue = await prisma.$transaction(async (tx) => {
      const saved = await tx.venue.upsert({
        where: { ownerId: userId },
        update: {
          name: data.name,
          address: data.address,
          comuna: data.comuna,
          lat: data.lat ?? null,
          lng: data.lng ?? null,
          contactName: data.contactName ?? null,
          contactEmail: (data.contactEmail ?? user.email ?? null)?.toLowerCase() ?? null,
          contactPhone: phone,
          status: "PENDING",
          verificationToken,
        },
        create: {
          ownerId: userId,
          name: data.name,
          address: data.address,
          comuna: data.comuna,
          lat: data.lat ?? null,
          lng: data.lng ?? null,
          contactName: data.contactName ?? null,
          contactEmail: (data.contactEmail ?? user.email ?? null)?.toLowerCase() ?? null,
          contactPhone: phone,
          status: "PENDING",
          verificationToken,
        },
      });

      await tx.user.update({ where: { id: userId }, data: { role: "VENUE" } });
      return saved;
    });

    const reviewEmail = mailtoContact();
    const origin = baseUrl();
    const approveUrl = `${origin}/api/venues/action?token=${encodeURIComponent(verificationToken)}&decision=approve`;
    const blockUrl = `${origin}/api/venues/action?token=${encodeURIComponent(verificationToken)}&decision=block`;

    let emailSent = false;
    try {
      const resend = assertResend();
      const detailRows = [
        { label: "Nombre comercial", value: venue.name },
        { label: "Dirección", value: venue.address },
        { label: "Comuna", value: venue.comuna },
        { label: "Latitud", value: venue.lat != null ? String(venue.lat) : "—" },
        { label: "Longitud", value: venue.lng != null ? String(venue.lng) : "—" },
        { label: "Contacto", value: venue.contactName || "—" },
        { label: "Email de contacto", value: venue.contactEmail || user.email || "—" },
        { label: "Teléfono", value: venue.contactPhone || "—" },
      ];

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "PichangApp <no-reply@pichangapp.cl>",
        to: reviewEmail,
        subject: "Nueva solicitud de registro de cancha",
        html: `
          <div style="font-family: Inter, Arial, sans-serif; line-height: 1.5; color: #0f172a;">
            <h1 style="font-size:20px; font-weight:600;">Nueva cancha para revisar</h1>
            <p style="margin-bottom:16px;">Un usuario solicitó activar el modo cancha en PichangApp. Revisa los datos y decide si apruebas o bloqueas la cuenta.</p>
            <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">
              <tbody>
                ${detailRows
                  .map(
                    (row) => `
                      <tr>
                        <td style="padding:6px 8px; font-size:13px; color:#64748b; width:160px;">${row.label}</td>
                        <td style="padding:6px 8px; font-size:14px; font-weight:500;">${row.value}</td>
                      </tr>`
                  )
                  .join("")}
              </tbody>
            </table>
            <div style="display:flex; gap:12px; margin-top:20px;">
              <a href="${approveUrl}" style="background:#0f172a; color:#fff; padding:10px 16px; border-radius:9999px; font-size:13px; text-decoration:none;">Aprobar cuenta</a>
              <a href="${blockUrl}" style="background:#fee2e2; color:#b91c1c; padding:10px 16px; border-radius:9999px; font-size:13px; text-decoration:none;">Bloquear y eliminar</a>
            </div>
          </div>
        `,
        text:
          `Nueva solicitud de cancha\n\n` +
          detailRows.map((row) => `${row.label}: ${row.value}`).join("\n") +
          `\n\nAprobar: ${approveUrl}\nBloquear: ${blockUrl}`,
      });
      emailSent = true;
    } catch (err) {
      console.error("[venues/register] No se pudo enviar correo de verificación", err);
    }

    return NextResponse.json({
      ok: true,
      status: venue.status,
      emailSent,
    });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error("[POST /api/venues/register]", err);
    return NextResponse.json(
      { error: "No se pudo registrar la cancha" },
      { status: 500 }
    );
  }
}
