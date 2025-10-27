import { Redis } from "@upstash/redis";

let cachedRedis: Redis | null | undefined;

export function getRedis(): Redis | null {
  if (cachedRedis !== undefined) {
    return cachedRedis;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    cachedRedis = null;
    return cachedRedis;
  }

  cachedRedis = new Redis({ url, token });
  return cachedRedis;
}
