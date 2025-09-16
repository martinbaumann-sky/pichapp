import { NextResponse } from "next/server";
import { getEnabledProviders } from "@/lib/payments/providers";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const providers = getEnabledProviders();
    return NextResponse.json({ features: { payments: { providers } } });
  } catch {
    return NextResponse.json({ features: { payments: { providers: getEnabledProviders() } } });
  }
}
