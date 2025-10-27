import { createClient } from "@supabase/supabase-js";

type SupabaseVerificationSuccess = {
  ok: true;
  emailVerifiedAt: Date | null;
};

type SupabaseVerificationFailure = {
  ok: false;
  reason: "invalid_credentials" | "config" | "error";
  message?: string;
};

export type SupabaseVerificationResult = SupabaseVerificationSuccess | SupabaseVerificationFailure;

type SupabaseCredentials = {
  url: string;
  key: string;
  isService: boolean;
};

function resolveSupabaseCredentials(): SupabaseCredentials | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.Service_Role ||
    process.env.Secret_Keys;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.Database_Publishable_key ||
    process.env.Anon_public;
  const key = serviceKey || anonKey;
  if (!url || !key) {
    return null;
  }
  return { url, key, isService: Boolean(serviceKey) };
}

export function createSupabaseServiceClient() {
  const creds = resolveSupabaseCredentials();
  if (!creds || !creds.isService) {
    return null;
  }
  return createClient(creds.url, creds.key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function verifySupabasePassword(
  email: string,
  password: string,
): Promise<SupabaseVerificationResult> {
  const creds = resolveSupabaseCredentials();
  if (!creds) {
    return { ok: false, reason: "config" };
  }

  try {
    const supabase = createClient(creds.url, creds.key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const message = error.message || "Invalid credentials";
      const lowered = message.toLowerCase();
      if (lowered.includes("invalid login") || lowered.includes("invalid credentials")) {
        return { ok: false, reason: "invalid_credentials", message };
      }
      return { ok: false, reason: "error", message };
    }

    const confirmedAtRaw = data.user?.email_confirmed_at || data.user?.confirmed_at || null;
    const confirmedAt = confirmedAtRaw ? new Date(confirmedAtRaw) : null;

    try {
      await supabase.auth.signOut();
    } catch {
      // ignore cleanup error
    }

    return { ok: true, emailVerifiedAt: confirmedAt };
  } catch (err: any) {
    return { ok: false, reason: "error", message: err?.message || "Supabase auth failed" };
  }
}
