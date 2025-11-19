import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        await prisma.$connect();
        // const count = await prisma.user.count();
        const dbUrl = process.env.DATABASE_URL;
        const maskedUrl = dbUrl ? dbUrl.replace(/:[^:@]+@/, ":***@") : "NOT_SET";
        return NextResponse.json({
            status: "ok",
            count: -1,
            env_db_url: maskedUrl,
            env_keys: Object.keys(process.env).filter(k => k.includes("DB") || k.includes("POSTGRES") || k.includes("URL"))
        });
    } catch (e: any) {
        return NextResponse.json({ status: "error", message: e.message, stack: e.stack }, { status: 500 });
    }
}
