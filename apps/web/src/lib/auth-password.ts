import bcrypt from "bcrypt";
import { getSupabaseServiceClient } from "./supabase-clients";

const TABLE = "local_passwords";

export async function setPasswordHash(userId: string, password: string) {
  const client = getSupabaseServiceClient();
  const hash = await bcrypt.hash(password, 10);
  await client
    .from(TABLE)
    .upsert(
      { user_id: userId, hash, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    )
    .throwOnError();
  return hash;
}

export async function getPasswordHash(userId: string): Promise<string | null> {
  const client = getSupabaseServiceClient();
  const { data, error } = await client.from(TABLE).select("hash").eq("user_id", userId).maybeSingle();
  if (error && error.code !== "PGRST116") throw error;
  return data?.hash ?? null;
}

export async function deletePasswordHash(userId: string) {
  const client = getSupabaseServiceClient();
  await client.from(TABLE).delete().eq("user_id", userId);
}
