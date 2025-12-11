import { getSupabaseServiceClient } from "./supabase-clients";

export async function ensureUserInDatabase(userId: string, email?: string | null) {
  const client = getSupabaseServiceClient();
  const { data, error } = await client.from("users").select("id").eq("id", userId).maybeSingle();
  if (error && error.code !== "PGRST116") throw error;
  if (data?.id) return data;

  const insertPayload: Record<string, any> = { id: userId };
  if (email) insertPayload.email = email;
  await client.from("users").insert(insertPayload).throwOnError();
  return insertPayload;
}
