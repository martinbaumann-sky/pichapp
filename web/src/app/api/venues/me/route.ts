import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { z } from "zod";
import { normalizeForStorage } from "@/lib/phone";

const bodySchema = z.object({
  name: z.string().min(3).max(120),
  address: z.string().min(5).max(200),
  comuna: z.string().min(3).max(80),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  contactName: z.string().min(3).max(120).optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  contactPhone: z.string().min(7).max(20).optional().nullable(),
});

function shapeVenue(venue: any) {
  if (!venue) return null;
  return {
    id: venue.id,
    name: venue.name,
    address: venue.address,
    comuna: venue.comuna,
    lat: venue.lat,
    lng: venue.lng,
    contactName: venue.contactName,
    contactEmail: venue.contactEmail,
    contactPhone: venue.contactPhone,
    status: venue.status,
    verifiedAt: venue.verifiedAt,
    updatedAt: venue.updatedAt,
  };
}

export async function GET() {
  try {
    const userId = await requireUserId();
    const venue = await prisma.venue.findUnique({
      where: { ownerId: userId },
    });
    return NextResponse.json({ venue: shapeVenue(venue) });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error("[GET /api/venues/me]", err);
    return NextResponse.json({ error: "No se pudo obtener la información de la cancha" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse({
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
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });

    const existing = await prisma.venue.findUnique({ where: { ownerId: userId } });

    const updated = existing
      ? await prisma.venue.update({
          where: { ownerId: userId },
          data: {
            name: data.name,
            address: data.address,
            comuna: data.comuna,
            lat: data.lat ?? null,
            lng: data.lng ?? null,
            contactName: data.contactName ?? null,
            contactEmail: data.contactEmail?.toLowerCase() ?? null,
            contactPhone: phone,
          },
        })
      : await prisma.venue.create({
          data: {
            ownerId: userId,
            name: data.name,
            address: data.address,
            comuna: data.comuna,
            lat: data.lat ?? null,
            lng: data.lng ?? null,
            contactName: data.contactName ?? null,
            contactEmail: data.contactEmail?.toLowerCase() ?? user.email ?? null,
            contactPhone: phone,
            status: "PENDING",
          },
        });

    return NextResponse.json({ venue: shapeVenue(updated) });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error("[PUT /api/venues/me]", err);
    return NextResponse.json({ error: "No se pudo actualizar la cancha" }, { status: 500 });
  }
}
