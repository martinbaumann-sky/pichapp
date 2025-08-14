import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "@/lib/supabase-server";
import { ensureUserInDatabase } from "@/lib/user";

export async function POST(req: NextRequest) {
	try {
		const { user } = await getServerSession();
		if (!user) return NextResponse.json({ error: "No auth" }, { status: 401 });
		await ensureUserInDatabase({ id: user.id, email: user.email });
		const body = await req.json();
		const name = (body?.name ?? "").toString();
		const comuna = body?.comuna ? String(body.comuna) : "";
		const position = body?.position ? String(body.position) : null;

		const profile = await prisma.profile.upsert({
			where: { userId: user.id },
			update: { name, comuna, position },
			create: { userId: user.id, name, comuna, position },
		});

		return NextResponse.json({ profile }, { status: 201 });
	} catch (err) {
		return NextResponse.json({ error: "Error al inicializar perfil" }, { status: 500 });
	}
}



