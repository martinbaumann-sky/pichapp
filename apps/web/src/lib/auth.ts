import { getSessionUserId } from "./auth-core";

export async function requireUserId(): Promise<string> {
  const uid = await getSessionUserId();
  if (uid) return uid;
  throw new Response(JSON.stringify({ error: "No autenticado" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

