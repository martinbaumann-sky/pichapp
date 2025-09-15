import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const mpEnabled = !!process.env.MP_ACCESS_TOKEN;
    // TB sandbox siempre disponible (simulado), pero marca enabled=true para UI
    const tbEnabled = true;
    return NextResponse.json({ features: { payments: { mpEnabled, tbEnabled } } });
  } catch {
    return NextResponse.json({ features: { payments: { mpEnabled: false, tbEnabled: true } } });
  }
}

