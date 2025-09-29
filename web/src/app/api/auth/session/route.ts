import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUserId } from "@/lib/auth-core";
import { normalizeForDisplay } from "@/lib/phone";
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const uid = await getSessionUserId();
    if (!uid) return NextResponse.json({ user: null });
    const user = await prisma.user.findUnique({
      where: { id: uid },
      select: {
        id: true,
        email: true,
        isAdmin: true,
        role: true,
        status: true,
        profile: { select: { name: true, comuna: true, position: true, phone: true } },
        venue: {
          select: {
            id: true,
            name: true,
            address: true,
            comuna: true,
            lat: true,
            lng: true,
            contactName: true,
            contactEmail: true,
            contactPhone: true,
            status: true,
            verifiedAt: true,
          },
        },
      },
    });
    if (!user || user.status !== "ACTIVE") return NextResponse.json({ user: null });
    const role = user.role === "VENUE" ? "venue" : user.role === "ADMIN" || user.isAdmin ? "venue" : "player";

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        isAdmin: !!user.isAdmin,
        role,
        status: user.status,
        emailVerified: false,
        name: user.profile?.name || null,
        comuna: user.profile?.comuna || null,
        position: user.profile?.position || null,
        phone: user.profile?.phone || null,
        phoneDisplay: user.profile?.phone ? normalizeForDisplay(user.profile.phone) : null,
        venue: user.venue
          ? {
              id: user.venue.id,
              name: user.venue.name,
              address: user.venue.address,
              comuna: user.venue.comuna,
              lat: user.venue.lat,
              lng: user.venue.lng,
              contactName: user.venue.contactName,
              contactEmail: user.venue.contactEmail,
              contactPhone: user.venue.contactPhone,
              status: user.venue.status,
              verifiedAt: user.venue.verifiedAt,
            }
          : null,
      },
    });
  } catch (err) {
    return NextResponse.json({ user: null });
  }
}
