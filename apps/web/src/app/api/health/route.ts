import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase-clients";
import { getRedis } from "@/lib/redis";
import { getLogger } from "@/lib/logger";

export const runtime = "nodejs";
export const revalidate = 0;

const logger = getLogger({ module: "api.health" });

export async function GET() {
  const startedAt = Date.now();
  const supabase = getSupabaseServiceClient();

  const database = await (async () => {
    const checkStart = Date.now();
    try {
      const { error } = await supabase.from("users").select("*", { head: true, count: "exact" });
      if (error) throw error;
      return { status: "up", latencyMs: Date.now() - checkStart };
    } catch (error) {
      logger.error({ error }, "database health check failed");
      return { status: "down", latencyMs: Date.now() - checkStart, error: (error as Error).message };
    }
  })();

  const redis = await (async () => {
    const client = getRedis();
    if (!client) {
      return { status: "disabled" };
    }
    const checkStart = Date.now();
    try {
      const pong = await client.ping();
      return { status: "up", latencyMs: Date.now() - checkStart, info: pong };
    } catch (error) {
      logger.error({ error }, "redis health check failed");
      return { status: "down", latencyMs: Date.now() - checkStart, error: (error as Error).message };
    }
  })();

  const payload = {
    ok: database.status === "up" && redis.status !== "down",
    database,
    redis,
    uptimeMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
  };

  return new NextResponse(JSON.stringify(payload), {
    status: payload.ok ? 200 : 503,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
