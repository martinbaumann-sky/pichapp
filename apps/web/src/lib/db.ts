// @ts-nocheck
// Compat layer: expone un objeto "prisma" backed por Supabase (no usa Prisma real).
import type { PostgrestFilterBuilder, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServiceClient } from "./supabase-clients";

type Where = Record<string, unknown> | undefined;

function applyWhere<T>(query: PostgrestFilterBuilder<T, T[], unknown>, where?: Where) {
  if (!where) return query;
  for (const [key, value] of Object.entries(where)) {
    if (value === undefined) continue;
    if (value === null) {
      query.is(key as keyof T, null as any);
    } else {
      query.eq(key as keyof T, value as any);
    }
  }
  return query;
}

function toTableName(name: string) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
}

function createTableApi(client: SupabaseClient, table: string) {
  const tableName = toTableName(table);
  return {
    async findMany(options?: { where?: Where; orderBy?: Record<string, "asc" | "desc">; take?: number; skip?: number }) {
      let query = applyWhere(client.from(tableName), options?.where).select("*");
      if (options?.orderBy) {
        for (const [key, dir] of Object.entries(options.orderBy)) {
          query = query.order(key, { ascending: dir !== "desc" });
        }
      }
      if (options?.take !== undefined) query = query.limit(options.take);
      if (options?.skip !== undefined) query = query.range(options.skip, (options.skip + (options.take ?? 0)) || undefined);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    async findFirst(options?: { where?: Where; orderBy?: Record<string, "asc" | "desc"> }) {
      let query = applyWhere(client.from(tableName), options?.where).select("*").limit(1);
      if (options?.orderBy) {
        for (const [key, dir] of Object.entries(options.orderBy)) {
          query = query.order(key, { ascending: dir !== "desc" });
        }
      }
      const { data, error } = await query.single();
      if (error && error.code !== "PGRST116") throw error;
      return data ?? null;
    },
    async findUnique(options: { where: Where }) {
      const query = applyWhere(client.from(tableName), options.where).select("*").limit(1);
      const { data, error } = await query.single();
      if (error && error.code !== "PGRST116") throw error;
      return data ?? null;
    },
    async create(options: { data: Record<string, unknown> }) {
      const { data, error } = await client.from(tableName).insert(options.data).select("*").single();
      if (error) throw error;
      return data;
    },
    async createMany(options: { data: Record<string, unknown>[] }) {
      const { data, error } = await client.from(tableName).insert(options.data).select("*");
      if (error) throw error;
      return data ?? [];
    },
    async update(options: { where: Where; data: Record<string, unknown> }) {
      const { data, error } = await applyWhere(client.from(tableName), options.where).update(options.data).select("*").single();
      if (error) throw error;
      return data;
    },
    async updateMany(options: { where?: Where; data: Record<string, unknown> }) {
      const { data, error } = await applyWhere(client.from(tableName), options.where).update(options.data).select("*");
      if (error) throw error;
      return data ?? [];
    },
    async delete(options: { where: Where }) {
      const { data, error } = await applyWhere(client.from(tableName), options.where).delete().select("*").single();
      if (error) throw error;
      return data;
    },
    async deleteMany(options?: { where?: Where }) {
      const { data, error } = await applyWhere(client.from(tableName), options?.where).delete().select("*");
      if (error) throw error;
      return data ?? [];
    },
    async count(options?: { where?: Where }) {
      const { count, error } = await applyWhere(client.from(tableName), options?.where).select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  };
}

function createCompatClient(client: SupabaseClient) {
  const base: any = {
    $client: client,
    async $transaction<T>(cb: (tx: any) => Promise<T>) {
      // @ts-ignore - 'this' refers to the proxy in context
      return cb(this);
    },
    async $queryRaw<T = unknown>(_strings: TemplateStringsArray | string, ..._values: unknown[]): Promise<T> {
      throw new Error("Las consultas SQL crudas no son compatibles; usa funciones RPC en Supabase.");
    },
  };

  return new Proxy(base, {
    get(target, prop: string) {
      if (prop in target) return (target as any)[prop];
      return createTableApi(client, prop);
    },
  });
}

export function getDbClient(): SupabaseClient {
  return getSupabaseServiceClient();
}

export const prisma: any = createCompatClient(getSupabaseServiceClient());
