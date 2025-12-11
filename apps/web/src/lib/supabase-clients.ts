// @ts-nocheck
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

type CookieHandler = {
  get(name: string): string | undefined;
  set(name: string, value: string, options?: { maxAge?: number; path?: string; domain?: string; sameSite?: "lax" | "strict" | "none"; secure?: boolean }): void;
  remove(name: string, options?: { maxAge?: number; path?: string; domain?: string; sameSite?: "lax" | "strict" | "none"; secure?: boolean }): void;
};

let serviceClient: SupabaseClient | null = null;
let anonClient: SupabaseClient | null = null;

function resolveSupabaseUrl() {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
}

function assertSupabaseUrl() {
  const url = resolveSupabaseUrl();
  if (!url) {
    throw new Error("Configura SUPABASE_URL o NEXT_PUBLIC_SUPABASE_URL");
  }
  return url;
}

export function getSupabaseServiceClient(): SupabaseClient {
  if (serviceClient) return serviceClient;

  const url = assertSupabaseUrl();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.Service_Role ||
    process.env.Secret_Keys ||
    process.env.SUPABASE_SERVICE_KEY;

  if (!key) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY para operaciones de servidor");
  }

  serviceClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return serviceClient;
}

export function getSupabaseAnonClient(): SupabaseClient {
  if (anonClient) return anonClient;
  const url = assertSupabaseUrl();
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.Anon_public ||
    process.env.Database_Publishable_key ||
    process.env.SUPABASE_ANON_KEY;

  if (!anonKey) {
    throw new Error("Falta NEXT_PUBLIC_SUPABASE_ANON_KEY para clientes p£blicos");
  }

  anonClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: true },
  });
  return anonClient;
}

export function createSupabaseRouteClient(cookieHandler: CookieHandler): SupabaseClient {
  const url = assertSupabaseUrl();
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.Anon_public ||
    process.env.Database_Publishable_key ||
    process.env.SUPABASE_ANON_KEY;

  if (!anonKey) {
    throw new Error("Falta NEXT_PUBLIC_SUPABASE_ANON_KEY para rutas");
  }

  return createServerClient(url, anonKey, {
    cookies: {
      get: cookieHandler.get,
      set: cookieHandler.set,
      remove: cookieHandler.remove,
    },
  });
}
