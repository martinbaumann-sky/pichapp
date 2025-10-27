import { NextRequest, NextResponse } from "next/server";
export const runtime = 'nodejs';
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { normalizeForDisplay } from "@/lib/phone";

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const json = await req.json().catch(() => ({}));
    const action = String(json?.action || '').toLowerCase();

    const rec = await prisma.friend.findUnique({ where: { id }, select: friendSelect() });
    if (!rec) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    if (rec.requesterId !== userId && rec.addresseeId !== userId) return NextResponse.json({ error: 'Prohibido' }, { status: 403 });

    if (action === 'accept') {
      if (rec.addresseeId !== userId) return NextResponse.json({ error: 'Solo el destinatario puede aceptar' }, { status: 400 });
      if (rec.status !== 'PENDING') return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
      const upd = await prisma.friend.update({ where: { id }, data: { status: 'ACCEPTED' }, select: friendSelect() });
      return NextResponse.json({ item: shapeFriend(userId, upd) });
    }
    if (action === 'reject') {
      if (rec.addresseeId !== userId) return NextResponse.json({ error: 'Solo el destinatario puede rechazar' }, { status: 400 });
      const upd = await prisma.friend.update({ where: { id }, data: { status: 'REJECTED' }, select: friendSelect() });
      return NextResponse.json({ item: shapeFriend(userId, upd) });
    }
    if (action === 'cancel') {
      if (rec.requesterId !== userId) return NextResponse.json({ error: 'Solo quien envió puede cancelar' }, { status: 400 });
      await prisma.friend.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    }
    if (action === 'block') {
      const upd = await prisma.friend.update({ where: { id }, data: { status: 'BLOCKED' }, select: friendSelect() });
      return NextResponse.json({ item: shapeFriend(userId, upd) });
    }

    return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error('[PATCH /api/friends/[id]] error', err);
    return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const rec = await prisma.friend.findUnique({ where: { id } });
    if (!rec) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    if (rec.requesterId !== userId && rec.addresseeId !== userId) return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
    await prisma.friend.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error('[DELETE /api/friends/[id]] error', err);
    return NextResponse.json({ error: 'No se pudo eliminar' }, { status: 500 });
  }
}

