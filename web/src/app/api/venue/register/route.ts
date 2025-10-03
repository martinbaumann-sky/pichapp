import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { normalizeForStorage } from "@/lib/phone";
import { setPasswordHash, getPasswordHash } from "@/lib/auth-password";
import { sendVenueReviewEmail } from "@/lib/venue-review-email";
import { attachSessionCookie, createSession } from "@/lib/auth-core";
import { createRateLimiter, getClientIp } from "@/lib/ratelimit";




interface VenueRegistrationPayload {
  venueName?: string;
  taxId?: string;
  email?: string;
  phone?: string;
  password?: string;
  address?: string;
  comuna?: string;
  fields?: string;
  lat?: number | string;
  lng?: number | string;
  placeId?: string;
  accountHolder?: string;
  payoutEmail?: string;
  mpCollectorId?: string;
  mpAccountType?: string;
  acceptTerms?: boolean | string;
}

const rl = createRateLimiter({ name: "venue_register", limit: 4, windowSec: 300 });

function parseFields(raw: string | undefined): string[] {
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(/[\r\n,]+/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    ),
  ).slice(0, 12);
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request as any);
    const probe = await rl.check(`ip:${ip}`);
    if (!probe.allowed) {
      return NextResponse.json(
        { error: "Demasiados intentos. Intenta nuevamente en unos minutos." },
        { status: 429 },
      );
    }

    let payload: VenueRegistrationPayload = {};
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      payload = (await request.json().catch(() => ({}))) as VenueRegistrationPayload;
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      payload = Object.fromEntries(formData.entries()) as unknown as VenueRegistrationPayload;
    }

    const acceptTermsValue = payload.acceptTerms;
    const acceptTerms =
      acceptTermsValue === true ||
      acceptTermsValue === "true" ||
      acceptTermsValue === "on" ||
      acceptTermsValue === "1";

    const venueName = String(payload.venueName ?? "").trim();
    const taxId = String(payload.taxId ?? "").trim();
    const email = String(payload.email ?? "").trim().toLowerCase();
    const phoneRaw = String(payload.phone ?? "").trim();
    const password = String(payload.password ?? "");
    const address = String(payload.address ?? "").trim();
    const comuna = String(payload.comuna ?? "").trim();
    const fieldsRaw = typeof payload.fields === "string" ? payload.fields : "";
    const accountHolder = String(payload.accountHolder ?? "").trim();
    const payoutEmail = String(payload.payoutEmail ?? "").trim().toLowerCase();
    const mpCollectorId = String(payload.mpCollectorId ?? "").trim();
    const mpAccountType = String(payload.mpAccountType ?? "").trim();
    const placeId = payload.placeId ? String(payload.placeId).trim() : undefined;
    const latValue = typeof payload.lat === "string" ? Number(payload.lat) : payload.lat;
    const lngValue = typeof payload.lng === "string" ? Number(payload.lng) : payload.lng;
    const lat = typeof latValue === "number" && Number.isFinite(latValue) ? latValue : null;
    const lng = typeof lngValue === "number" && Number.isFinite(lngValue) ? lngValue : null;

    if (
      !venueName ||
      !taxId ||
      !email ||
      !phoneRaw ||
      !password ||
      !address ||
      !comuna ||
      !accountHolder ||
      !payoutEmail ||
      !mpCollectorId ||
      !mpAccountType
    ) {
      return NextResponse.json(
        { error: "Completa todos los campos obligatorios del registro." },
        { status: 400 },
      );
    }

    if (!acceptTerms) {
      return NextResponse.json(
        { error: "Debes aceptar los términos y condiciones para continuar." },
        { status: 400 },
      );
    }

    if (lat == null || lng == null) {
      return NextResponse.json(
        { error: "Necesitamos ubicar tu cancha en el mapa. Selecciona una dirección válida." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres." },
        { status: 400 },
      );
    }

    const normalizedPhone = normalizeForStorage(phoneRaw);
    const fallbackPhone = normalizeForStorage("+56 9 0000 0000") ?? "56900000000";
    const phoneForProfile = normalizedPhone ?? fallbackPhone;
    const userSelect = {
      id: true,
      email: true,
      role: true,
      profile: { select: { name: true, comuna: true, phone: true } },
    };
    const fieldNames = parseFields(fieldsRaw);

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        role: true,
        passwordHash: true,
        profile: { select: { id: true } },
        },
    });

    const existingVenue = existingUser ? await prisma.venue.findFirst({ where: { ownerId: existingUser.id }, select: { id: true } }) : null;

    if (existingUser && (existingUser.role === "VENUE_ADMIN" || existingUser.role === "SUPERADMIN" || !!existingVenue)) {
      return NextResponse.json(
        { error: "Este correo ya está registrado como cancha. Intenta iniciar sesión." },
        { status: 409 },
      );
    }

    let passwordHash: string;
    let userId: string;
    let result: { user: any; venue: any };

    if (existingUser) {
      let storedHash: string | null = null;
      try {
        storedHash = await getPasswordHash(existingUser.id);
      } catch (err) {
        console.warn("[venue/register] getPasswordHash failed", err);
      }
      if (!storedHash && existingUser.passwordHash) {
        storedHash = existingUser.passwordHash;
      }

      if (storedHash) {
        const matches = await bcrypt.compare(password, storedHash);
        if (!matches) {
          return NextResponse.json(
            { error: "La contraseña no coincide con tu cuenta. Inicia sesión e intenta nuevamente." },
            { status: 401 },
          );
        }
        passwordHash = storedHash;
      } else {
        passwordHash = await bcrypt.hash(password, 10);
      }

      result = await prisma.$transaction(async (tx) => {
        if (existingUser.profile) {
          await tx.profile.update({
            where: { id: existingUser.profile.id },
            data: {
              name: venueName,
              phone: phoneForProfile,
              comuna,
            },
          });
        } else {
          await tx.profile.create({
            data: {
              userId: existingUser.id,
              name: venueName,
              phone: phoneForProfile,
              comuna,
            },
          });
        }

        const user = await tx.user.update({
          where: { id: existingUser.id },
          data: {
            role: UserRole.VENUE_ADMIN,
            passwordHash,
          },
          select: userSelect,
        });

        const venue = await tx.venue.create({
          data: {
            ownerId: existingUser.id,
            name: venueName,
            taxId,
            address,
            comuna,
            lat,
            lng,
            phone: normalizedPhone ?? null,
            payoutEmail,
            accountHolder,
            plan: "gratis",
            verified: false,
            mpAccountId: null,
            mpCollectorId,
            mpAccountType,
            placeId: placeId ?? null,
          },
          select: {
            id: true,
            name: true,
            address: true,
            comuna: true,
            lat: true,
            lng: true,
            plan: true,
            verified: true,
            taxId: true,
            phone: true,
            payoutEmail: true,
            accountHolder: true,
            mpCollectorId: true,
            mpAccountType: true,
          },
        });

        if (fieldNames.length > 0) {
          await tx.field.createMany({
            data: fieldNames.map((name) => ({ venueId: venue.id, name })),
          });
        }

        return { user, venue };
      });

      userId = existingUser.id;
    } else {
      passwordHash = await bcrypt.hash(password, 10);

      result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            passwordHash,
            role: UserRole.VENUE_ADMIN,
            isAdmin: false,
            profile: {
              create: {
                name: venueName,
                phone: phoneForProfile,
                comuna,
              },
            },
          },
          select: userSelect,
        });

        const venue = await tx.venue.create({
          data: {
            ownerId: user.id,
            name: venueName,
            taxId,
            address,
            comuna,
            lat,
            lng,
            phone: normalizedPhone ?? null,
            payoutEmail,
            accountHolder,
            plan: "gratis",
            verified: false,
            mpAccountId: null,
            mpCollectorId,
            mpAccountType,
            placeId: placeId ?? null,
          },
          select: {
            id: true,
            name: true,
            address: true,
            comuna: true,
            lat: true,
            lng: true,
            plan: true,
            verified: true,
            taxId: true,
            phone: true,
            payoutEmail: true,
            accountHolder: true,
            mpCollectorId: true,
            mpAccountType: true,
          },
        });

        if (fieldNames.length > 0) {
          await tx.field.createMany({
            data: fieldNames.map((name) => ({ venueId: venue.id, name })),
          });
        }

        return { user, venue };
      });

      userId = result.user.id;
    }

    try {
      await setPasswordHash(userId, passwordHash);
    } catch (err) {
      console.warn("[venue/register] setPasswordHash failed", err);
    }

    const token = await createSession(userId);
    const responseStatus = existingUser ? 200 : 201;
    const res = NextResponse.json(
      {
        ok: true,
        venue: result.venue,
        user: {
          id: result.user.id,
          email: result.user.email,
          role: (result.user.role ?? "PLAYER").toLowerCase(),
          name: result.user.profile?.name ?? venueName,
          comuna: result.user.profile?.comuna ?? comuna,
          phone: result.user.profile?.phone ?? null,
        },
      },
      { status: responseStatus },
    );
    attachSessionCookie(res, token);

    sendVenueReviewEmail({
      venue: {
        id: result.venue.id,
        name: result.venue.name,
        taxId,
        address,
        comuna,
        phone: normalizedPhone ?? null,
        payoutEmail,
        accountHolder,
        mpCollectorId,
        mpAccountType,
        lat,
        lng,
        fields: fieldNames.map((name) => ({ name })),
      },
      owner: {
        id: result.user.id,
        email: result.user.email!,
        name: result.user.profile?.name ?? venueName,
      },
    }).catch((err) => {
      console.error("[venue/register] review email error", err);
    });
    return res;

  } catch (err) {
    console.error("[venue/register]", err);
    return NextResponse.json(
      { error: "No pudimos completar el registro. Inténtalo nuevamente." },
      { status: 500 },
    );
  }
}










