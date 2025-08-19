import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: any) {
  try {
    const id = params.id as string;
    const payment = await prisma.payment.findUnique({ where: { id }, include: { match: true, spot: true } });
    if (!payment) return NextResponse.json({ error: "not found" }, { status: 404 });

    return NextResponse.json({ payment });
  } catch (err) {
    return NextResponse.json({ error: "error" }, { status: 500 });
  }
}


