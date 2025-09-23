import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/supabase-js";
import { clearSessionCookie } from "@/lib/auth-core";

async function signOutSupabase(res: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return;
  }

  try {
    const cookieStore = cookies();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options?: CookieOptions) {
          res.cookies.set(name, value, options);
        },
        remove(name: string, options?: CookieOptions) {
          res.cookies.set(name, "", { ...(options ?? {}), maxAge: 0 });
        },
      },
    });

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn("[auth/signout] Supabase signOut returned error", error.message || error.name);
    }
  } catch (err) {
    console.warn("[auth/signout] Failed to sign out from Supabase", err instanceof Error ? err.message : err);
  }
}

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);

  await signOutSupabase(response);

  const cookieNames = ["sb-access-token", "sb-refresh-token", "supabase-auth-token"] as const;
  for (const name of cookieNames) {
    response.cookies.set(name, "", { path: "/", maxAge: 0 });
  }

  return response;
}
