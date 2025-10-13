import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { normalizeForStorage } from "@/lib/phone";

function parseFields(raw: unknown): string[] | null {
  if (Array.isArray(raw)) {
    return raw
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter((value) => value.length > 0)
      .slice(0, 12);
  }
  if (typeof raw === "string") {
    return raw
      .split(/[\n,]/)
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .slice(0, 12);
  }
  return null;
}

export async function GET() {
  try {
    const userId = await requireUserId();
    const venue = await prisma.venue.findFirst({
      where: { ownerId: userId },
      include: { fields: { select: { id: true, name: true } } },
    });
    if (!venue) {
      return NextResponse.json({ error: "No encontramos una cancha asociada" }, { status: 404 });
    }
    return NextResponse.json({
      venue: {
        id: venue.id,
        name: venue.name,
        taxId: venue.taxId,
        address: venue.address,
        comuna: venue.comuna,
        lat: venue.lat,
        lng: venue.lng,
        phone: venue.phone,
        payoutEmail: venue.payoutEmail,
        accountHolder: venue.accountHolder,
        mpCollectorId: venue.mpCollectorId,
        mpAccountType: venue.mpAccountType,
        plan: venue.plan,
        verified: venue.verified,
        fields: venue.fields,
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[venue/profile] GET", error);
    return NextResponse.json({ error: "No se pudo cargar la información" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const payload = await req.json().catch(() => ({}));
    const venue = await prisma.venue.findFirst({ where: { ownerId: userId } });
    if (!venue) {
      return NextResponse.json({ error: "No encontramos una cancha asociada" }, { status: 404 });
    }

    const name = typeof payload?.name === "string" ? payload.name.trim() : venue.name;
    const address = typeof payload?.address === "string" ? payload.address.trim() : venue.address;
    const comuna = typeof payload?.comuna === "string" ? payload.comuna.trim() : venue.comuna;
    const payoutEmail = typeof payload?.payoutEmail === "string" ? payload.payoutEmail.trim().toLowerCase() : venue.payoutEmail;
    const accountHolder = typeof payload?.accountHolder === "string" ? payload.accountHolder.trim() : venue.accountHolder;
    const taxId = typeof payload?.taxId === "string" ? payload.taxId.trim() : venue.taxId;
    const phoneRaw = typeof payload?.phone === "string" ? payload.phone.trim() : venue.phone ?? "";
    const mpCollectorIdRaw =
      typeof payload?.mpCollectorId === "string" ? payload.mpCollectorId.trim() : venue.mpCollectorId ?? "";
    const mpAccountTypeRaw =
      typeof payload?.mpAccountType === "string" ? payload.mpAccountType.trim() : venue.mpAccountType ?? "";
    const fieldNames = parseFields(payload?.fields);

    if (!name || !address || !comuna || !payoutEmail || !accountHolder || !taxId || !mpCollectorIdRaw || !mpAccountTypeRaw) {
      return NextResponse.json({ error: "Completa todos los campos obligatorios." }, { status: 400 });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
    if (!emailPattern.test(payoutEmail)) {
      return NextResponse.json({ error: "Ingresa un correo de Mercado Pago válido." }, { status: 400 });
    }

    if (accountHolder.length < 3) {
      return NextResponse.json({ error: "Ingresa el nombre completo del titular de la cuenta." }, { status: 400 });
    }

    const collectorIdDigits = mpCollectorIdRaw.replace(/\D+/g, "");
    if (collectorIdDigits.length < 5) {
      return NextResponse.json({ error: "Ingresa un Collector ID de Mercado Pago válido." }, { status: 400 });
    }

    const mpAccountType = (() => {
      const normalized = mpAccountTypeRaw.toLowerCase();
      if (normalized.includes("persona")) return "Persona";
      if (normalized.includes("empresa") || normalized.includes("sociedad")) return "Empresa";
      if (normalized.includes("fund")) return "Fundación";
      return mpAccountTypeRaw;
    })();

    const normalizedPhone = phoneRaw ? normalizeForStorage(phoneRaw) : null;

    await prisma.$transaction(async (tx) => {
      await tx.venue.update({
        where: { id: venue.id },
        data: {
          name,
          address,
          comuna,
          payoutEmail,
          accountHolder,
          taxId,
          phone: normalizedPhone,
          mpCollectorId: collectorIdDigits,
          mpAccountType,
        },
      });

      if (Array.isArray(fieldNames)) {
        const uniqueFields = Array.from(new Set(fieldNames.map((value) => value.slice(0, 60))));
        await tx.field.deleteMany({ where: { venueId: venue.id } });
        if (uniqueFields.length > 0) {
          await tx.field.createMany({ data: uniqueFields.map((value) => ({ venueId: venue.id, name: value })) });
        }
      }

      await tx.profile.updateMany({ where: { userId }, data: { name } });
    });

    const fresh = await prisma.venue.findUnique({
      where: { id: venue.id },
      include: { fields: { select: { id: true, name: true } } },
    });

    return NextResponse.json({
      ok: true,
      venue: fresh
        ? {
            id: fresh.id,
            name: fresh.name,
            taxId: fresh.taxId,
            address: fresh.address,
            comuna: fresh.comuna,
            lat: fresh.lat,
            lng: fresh.lng,
            phone: fresh.phone,
            payoutEmail: fresh.payoutEmail,
            accountHolder: fresh.accountHolder,
            plan: fresh.plan,
            verified: fresh.verified,
            fields: fresh.fields,
            mpCollectorId: fresh.mpCollectorId,
            mpAccountType: fresh.mpAccountType,
          }
        : null,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[venue/profile] PATCH", error);
    return NextResponse.json({ error: "No pudimos guardar los cambios" }, { status: 500 });
  }
}
