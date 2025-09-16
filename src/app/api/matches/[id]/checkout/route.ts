import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json({ error: "Los pagos estan deshabilitados para este lanzamiento." }, { status: 410 });
}
