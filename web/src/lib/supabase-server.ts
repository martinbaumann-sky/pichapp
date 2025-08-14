import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ensureUserInDatabase } from "./user";

export async function getServerSupabase() {
    const cookieStore = await cookies();
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
	if (!url || !anon) {
		throw new Error("Supabase no configurado: faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY");
	}
  return createServerClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
		cookies: {
			get(name: string) {
				return cookieStore.get(name)?.value;
			},
			set(name: string, value: string, options: any) {
				try {
					cookieStore.set(name, value, options);
				} catch {}
			},
			remove(name: string, options: any) {
				try {
					cookieStore.set(name, "", { ...options, maxAge: 0 });
				} catch {}
			},
		},
	});
}

export async function getServerSession() {
    const supabase = await getServerSupabase();
	const {
		data: { session },
	} = await supabase.auth.getSession();
	if (session?.user) {
		// Asegurar reflejo en DB propia
		await ensureUserInDatabase({ id: session.user.id, email: session.user.email });
	}
	return { session, user: session?.user ?? null, supabase } as const;
}



