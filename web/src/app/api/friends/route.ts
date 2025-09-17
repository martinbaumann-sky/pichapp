import { NextRequest, NextResponse } from "next/server";
export const runtime = 'nodejs';
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { last9, normalizeForDisplay, normalizeForStorage } from "@/lib/phone";

function friendSelect() {
  return {
    id: true,
    status: true,
    requesterId: true,
    addresseeId: true,
    requester: { select: { id: true, email: true, isAdmin: true, profile: { select: { name: true, phone: true, comuna: true, position: true } } } },
    addressee: { select: { id: true, email: true, isAdmin: true, profile: { select: { name: true, phone: true, comuna: true, position: true } } } },
    createdAt: true,
  } as const;
}

function shapeFriend(currentUserId: string, rec: any) {
  const other = rec.requesterId === currentUserId ? rec.addressee : rec.requester;
  const otherProfile = other?.profile || {};
  return {
    id: rec.id,
    status: rec.status,
    user: {
      id: other?.id,
      name: otherProfile?.name || other?.email || 'Usuario',
      comuna: otherProfile?.comuna || '',
      position: otherProfile?.position || null,
      phone: otherProfile?.phone || null,
      phoneDisplay: otherProfile?.phone ? normalizeForDisplay(otherProfile.phone) : null,
    },
    isRequester: rec.requesterId === currentUserId,
    createdAt: rec.createdAt,
  };
}

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // ACCEPTED | PENDING | ... | all
    const pending = searchParams.get('pending'); // alias: incoming|outgoing

    // Base where for friendships where current user participates
    const whereAny = {
      OR: [
        { requesterId: userId },
        { addresseeId: userId },
      ],
      ...(status && status !== 'all' ? { status } : {}),
    } as any;

    const items = await prisma.friend.findMany({
      where: whereAny,
      orderBy: { createdAt: 'desc' },
      select: friendSelect(),
    });

    // Optional filter for pending direction
    let filtered = items;
    if (pending === 'incoming') filtered = items.filter((f) => f.status === 'PENDING' && f.addresseeId === userId);
    if (pending === 'outgoing') filtered = items.filter((f) => f.status === 'PENDING' && f.requesterId === userId);

    return NextResponse.json({
      items: filtered.map((r) => shapeFriend(userId, r)),
    });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error('[GET /api/friends] error', err);
    return NextResponse.json({ error: 'Error al listar amigos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const json = await req.json().catch(() => ({}));
    const rawPhone = String(json?.phone || '').trim();
    const targetId = String(json?.addresseeId || '').trim();
    if (!rawPhone && !targetId) {
      return NextResponse.json({ error: 'Falta número de teléfono o usuario' }, { status: 400 });
    }

    let userToAdd: any = null;
    if (targetId) {
      userToAdd = await prisma.user.findUnique({ where: { id: targetId }, include: { profile: true } });
    } else if (rawPhone) {
      const nine = last9(rawPhone);
      if (nine.length < 7) return NextResponse.json({ error: "Número inválido" }, { status: 400 });

      const normalized = normalizeForStorage(rawPhone);
      if (normalized) {
        userToAdd = await prisma.user.findFirst({
          where: { profile: { is: { phone: normalized } } },
          include: { profile: true },
        });
      }

      if (!userToAdd) {
        const lastDigits = nine.slice(-4) || nine;
        const candidates = await prisma.user.findMany({
          where: lastDigits
            ? { profile: { is: { phone: { contains: lastDigits } } } }
            : { profile: { isNot: null } },
          include: { profile: true },
          take: 25,
        });
        userToAdd = candidates.find((candidate) => {
          const stored = candidate.profile?.phone || "";
          return stored && last9(stored) === nine;
        }) || null;
      }
    }

    if (!userToAdd) return NextResponse.json({ error: 'No encontramos un usuario con ese teléfono' }, { status: 404 });
    if (userToAdd.id === userId) return NextResponse.json({ error: 'No puedes agregarte a ti mismo' }, { status: 400 });

    // Check any existing relation in either direction
    const existing = await prisma.friend.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: userToAdd.id },
          { requesterId: userToAdd.id, addresseeId: userId },
        ],
      },
      select: friendSelect(),
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        return NextResponse.json({ item: shapeFriend(userId, existing), message: 'Ya son amigos' }, { status: 200 });
      }
      // If incoming pending, accept
      if (existing.status === 'PENDING' && existing.requesterId === userToAdd.id && existing.addresseeId === userId) {
        const updated = await prisma.friend.update({ where: { id: existing.id }, data: { status: 'ACCEPTED' }, select: friendSelect() });
        return NextResponse.json({ item: shapeFriend(userId, updated), message: 'Solicitud aceptada automáticamente' }, { status: 200 });
      }
      // If outgoing pending or others, just return current state
      return NextResponse.json({ item: shapeFriend(userId, existing), message: 'Solicitud ya existe' }, { status: 200 });
    }

    const created = await prisma.friend.create({
      data: { requesterId: userId, addresseeId: userToAdd.id, status: 'PENDING' },
      select: friendSelect(),
    });
    return NextResponse.json({ item: shapeFriend(userId, created) }, { status: 201 });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error('[POST /api/friends] error', err);
    return NextResponse.json({ error: 'No se pudo enviar solicitud' }, { status: 500 });
  }
}

