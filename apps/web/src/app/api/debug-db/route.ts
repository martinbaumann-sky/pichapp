import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-clients";

export async function GET() {
  try {
    const client = getSupabaseServiceClient();
    const { count, error } = await client.from("users").select("*", { count: "exact", head: true });
    const maskedUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "NOT_SET").replace(/(https?:\/\/)([^.]+)/, "$1***");
    return NextResponse.json({
      status: error ? "warn" : "ok",
      count: count ?? 0,
      env_db_url: maskedUrl,
      env_keys: Object.keys(process.env).filter((k) => k.toUpperCase().includes("SUPABASE")),
      error: error?.message ?? null,
    });
  } catch (e: any) {
    return NextResponse.json({ status: "error", message: e.message, stack: e.stack }, { status: 500 });
  }
}
