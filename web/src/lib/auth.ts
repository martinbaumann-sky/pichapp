import { cookies } from "next/headers";
import { prisma } from "./db";
import { getSession } from "./auth-local";

export async function requireUserId(): Promise<string> {
    const cookieStore = await cookies();
	const sessionId = cookieStore.get("session_id")?.value || null;
	const uid = cookieStore.get("uid")?.value || null;

	// 1) Intentar recuperar desde sesión en memoria
	if (sessionId) {
		const s = getSession(sessionId);
		if (s) return s.id;
	}

	// 2) Fallback: cookie con uid persistente
	if (uid) {
		const user = await prisma.user.findUnique({ where: { id: uid } });
		if (user) return user.id;
	}

	throw new Response("No autenticado", { status: 401 });
}
