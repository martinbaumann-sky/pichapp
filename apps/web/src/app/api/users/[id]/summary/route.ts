import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth-core";
import { getPublicUserSummary } from "@/lib/user-summary";

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: userId } = await params;
    if (!userId) {
      return NextResponse.json({ error: 'id requerido' }, { status: 400 });
    }

    const viewerId = await getSessionUserId();
    const summary = await getPublicUserSummary(userId, viewerId);
    if (!summary) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json(summary, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'No se pudo obtener el perfil' }, { status: 500 });
  }
}