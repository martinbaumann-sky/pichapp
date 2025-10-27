import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, ctx: { params: { id: string } } | { params: Promise<{ id: string }> }) {
  try {
    const p: any = (ctx as any)?.params;
    const { id } = (p && typeof p.then === 'function') ? await p : p;
    const payment = await prisma.payment.findUnique({ where: { id }, include: { match: true, spot: true } });
    if (!payment) return NextResponse.json({ error: "not found" }, { status: 404 });

    return NextResponse.json({ payment });
  } catch (err) {
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}


