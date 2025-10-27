import { NextRequest, NextResponse } from "next/server";
export const runtime = 'nodejs';
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { digitsOnly, last9, matchesByLastDigits, normalizeForDisplay } from "@/lib/phone";

function friendSelect() {
  return {
    id: true,
    status: true,
    requesterId: true,
    addresseeId: true,
    requester: {
      select: {
        id: true,
        email: true,
        isAdmin: true,
        profile: {
          select: {
            name: true,
            phone: true,
            comuna: true,
            position: true,
            skillLevel: true,
            bio: true,
            avatarUrl: true,
          },
        },
      },
    },
    addressee: {
      select: {
        id: true,
        email: true,
        isAdmin: true,
        profile: {
          select: {
            name: true,
            phone: true,
            comuna: true,
            position: true,
            skillLevel: true,
            bio: true,
            avatarUrl: true,
          },
        },
      },
    },
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
      skillLevel: otherProfile?.skillLevel || null,
      bio: otherProfile?.bio || null,
      avatarUrl: otherProfile?.avatarUrl || null,
    },
    isRequester: rec.requesterId === currentUserId,
    createdAt: rec.createdAt,
  };
}

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const pending = searchParams.get('pending');

    const whereAny = {
      OR: [{ requesterId: userId }, { addresseeId: userId }],
      ...(status && status !== 'all' ? { status } : {}),
    } as any;

    const items = await prisma.friend.findMany({
      where: whereAny,
      orderBy: { createdAt: 'desc' },
      select: friendSelect(),
    });

    let filtered = items;
    if (pending === 'incoming') {
      filtered = items.filter((f) => f.status === 'PENDING' && f.addresseeId === userId);
    }
    if (pending === 'outgoing') {
      filtered = items.filter((f) => f.status === 'PENDING' && f.requesterId === userId);
    }

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
    const rawPhone = typeof json?.phone === 'string' ? json.phone.trim() : '';
    const targetId = typeof json?.addresseeId === 'string' ? json.addresseeId.trim() : '';

    if (!rawPhone && !targetId) {
      return NextResponse.json({ error: 'Falta numero de telefono o usuario' }, { status: 400 });
    }

    let userToAdd: any = null;
    if (targetId) {
      userToAdd = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true, profile: { select: { phone: true } } } });
    } else if (rawPhone) {
      const digits = digitsOnly(rawPhone);
      const nine = last9(digits);
      if (nine.length < 7) {
        return NextResponse.json({ error: 'Numero invalido' }, { status: 400 });
      }

      userToAdd = await prisma.user.findFirst({
        where: { profile: { is: { phone: { endsWith: nine } } } },
        select: { id: true, profile: { select: { phone: true } } },
      });

      if (!userToAdd) {
        const last4 = nine.slice(-4);
        const candidates = await prisma.user.findMany({
          where: {
            profile: {
              is: {
                phone: {
                  not: null,
                  contains: last4,
                },
              },
            },
          },
          select: { id: true, profile: { select: { phone: true } } },
          orderBy: { createdAt: 'desc' },
          take: 25,
        });
        userToAdd = candidates.find((candidate) => matchesByLastDigits(candidate.profile?.phone, nine)) ?? null;
      }
    }

    if (!userToAdd) {
      return NextResponse.json({ error: 'No encontramos un usuario con ese telefono' }, { status: 404 });
    }

    if (userToAdd.id === userId) {
      return NextResponse.json({ error: 'No puedes agregarte a ti mismo' }, { status: 400 });
    }

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

      if (
        existing.status === 'PENDING' &&
        existing.requesterId === userToAdd.id &&
        existing.addresseeId === userId
      ) {
        const updated = await prisma.friend.update({
          where: { id: existing.id },
          data: { status: 'ACCEPTED' },
          select: friendSelect(),
        });
        return NextResponse.json({ item: shapeFriend(userId, updated), message: 'Solicitud aceptada automaticamente' }, { status: 200 });
      }

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
