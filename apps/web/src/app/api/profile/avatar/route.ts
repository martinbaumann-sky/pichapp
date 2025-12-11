import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createSupabaseServiceClient } from "@/lib/supabase-admin";
import { PROFILE_PLACEHOLDER_COMUNA, PROFILE_PLACEHOLDER_PHONE } from "@/lib/profileCompletion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 1_200_000; // ~1.2MB after compresión
const ALLOWED_TYPES = new Set(["image/webp", "image/jpeg", "image/png"]);
const BUCKET_NAME = process.env.NEXT_PUBLIC_SUPABASE_AVATAR_BUCKET || "profile-avatars";

function resolveExtension(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/jpeg") return "jpg";
  return "webp";
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Formato no soportado" }, { status: 400 });
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "Imagen muy pesada. Comprime un poco más." }, { status: 400 });
    }

    const supabase = createSupabaseServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Configura Supabase antes de subir imágenes" }, { status: 500 });
    }

    try {
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: `${MAX_FILE_BYTES}`,
        allowedMimeTypes: Array.from(ALLOWED_TYPES),
      });
    } catch (err: any) {
      const message = String(err?.message || "");
      if (!message.includes("Bucket already exists")) {
        console.warn("[profile/avatar] bucket creation", message);
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = resolveExtension(file.type);
    const objectPath = `${userId}/avatar.${ext}`;

    const upload = await supabase.storage
      .from(BUCKET_NAME)
      .upload(objectPath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (upload.error) {
      return NextResponse.json({ error: "No se pudo subir la imagen" }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(objectPath);

    const avatarUrl = publicUrlData?.publicUrl || null;
    const profile = await prisma.profile.upsert({
      where: { userId },
      update: { avatarUrl },
      create: {
        userId,
        name: "Jugador Pichanga",
        phone: PROFILE_PLACEHOLDER_PHONE,
        comuna: PROFILE_PLACEHOLDER_COMUNA,
        avatarUrl,
      },
    });

    return NextResponse.json({ avatarUrl: profile.avatarUrl });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: "Error al subir imagen" }, { status: 500 });
  }
}
