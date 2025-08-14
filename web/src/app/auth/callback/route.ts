import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { event, session } = await req.json();
    const supabase = await getServerSupabase();
    if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
      if (session) {
        await supabase.auth.setSession({ access_token: session.access_token!, refresh_token: session.refresh_token! });
      }
    }
    if (event === "SIGNED_OUT") {
      await supabase.auth.signOut();
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false });
  }
}


