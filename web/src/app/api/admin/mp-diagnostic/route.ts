import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ensureVenueAccessToken } from "@/lib/mp/marketplace";

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    
    // Verificar que el usuario sea admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true, role: true }
    });
    
    if (!user?.isAdmin && user?.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const diagnostics = {
      environment: {
        MP_CLIENT_ID: !!process.env.MP_CLIENT_ID,
        MP_CLIENT_SECRET: !!process.env.MP_CLIENT_SECRET,
        MP_REDIRECT_URI: !!process.env.MP_REDIRECT_URI,
        MP_WEBHOOK_URL: !!process.env.MP_WEBHOOK_URL,
        MP_WEBHOOK_SIGNATURE_SECRET: !!process.env.MP_WEBHOOK_SIGNATURE_SECRET,
        MP_ACCESS_TOKEN: !!process.env.MP_ACCESS_TOKEN,
        MP_USE_SANDBOX: process.env.MP_USE_SANDBOX === "true",
      },
      venues: {
        total: 0,
        withMpConnection: 0,
        withValidTokens: 0,
        withExpiredTokens: 0,
        details: [] as any[]
      },
      recommendations: [] as string[]
    };

    // Obtener todas las canchas
    const venues = await prisma.venue.findMany({
      select: {
        id: true,
        name: true,
        mpAccessToken: true,
        mpRefreshToken: true,
        mpTokenExpiresAt: true,
        mpUserId: true,
        mpCollectorId: true,
        mpAccountType: true,
        paymentProvider: true,
        plan: true,
        verified: true
      }
    });

    diagnostics.venues.total = venues.length;

    for (const venue of venues) {
      const venueInfo = {
        id: venue.id,
        name: venue.name,
        hasAccessToken: !!venue.mpAccessToken,
        hasRefreshToken: !!venue.mpRefreshToken,
        hasExpiredToken: false,
        hasValidConnection: false,
        mpUserId: venue.mpUserId,
        mpCollectorId: venue.mpCollectorId,
        mpAccountType: venue.mpAccountType,
        paymentProvider: venue.paymentProvider,
        plan: venue.plan,
        verified: venue.verified
      };

      if (venue.mpAccessToken) {
        diagnostics.venues.withMpConnection++;
        
        try {
          // Intentar usar el token para verificar si es válido
          await ensureVenueAccessToken(venue.id);
          venueInfo.hasValidConnection = true;
          diagnostics.venues.withValidTokens++;
        } catch (error) {
          venueInfo.hasExpiredToken = true;
          diagnostics.venues.withExpiredTokens++;
        }
      }

      diagnostics.venues.details.push(venueInfo);
    }

    // Generar recomendaciones
    if (!diagnostics.environment.MP_CLIENT_ID) {
      diagnostics.recommendations.push("Configurar MP_CLIENT_ID en las variables de entorno");
    }
    if (!diagnostics.environment.MP_CLIENT_SECRET) {
      diagnostics.recommendations.push("Configurar MP_CLIENT_SECRET en las variables de entorno");
    }
    if (!diagnostics.environment.MP_REDIRECT_URI) {
      diagnostics.recommendations.push("Configurar MP_REDIRECT_URI con la URL de callback registrada en Mercado Pago");
    }
    if (!diagnostics.environment.MP_WEBHOOK_URL) {
      diagnostics.recommendations.push("Configurar MP_WEBHOOK_URL para recibir notificaciones de pagos");
    }
    if (!diagnostics.environment.MP_WEBHOOK_SIGNATURE_SECRET) {
      diagnostics.recommendations.push("Configurar MP_WEBHOOK_SIGNATURE_SECRET para validar webhooks");
    }
    
    if (diagnostics.venues.withExpiredTokens > 0) {
      diagnostics.recommendations.push(`${diagnostics.venues.withExpiredTokens} canchas tienen tokens expirados. Necesitan reconectar Mercado Pago.`);
    }
    
    if (diagnostics.venues.withMpConnection === 0) {
      diagnostics.recommendations.push("Ninguna cancha tiene Mercado Pago conectado. Las canchas necesitan autorizar su cuenta.");
    }

    return NextResponse.json(diagnostics);
  } catch (error) {
    console.error("[admin/mp-diagnostic]", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

