import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMarketplaceFee, ensureVenueAccessToken } from "@/lib/mp/marketplace";
import { approvePayment } from "@/lib/payments/update";

export async function POST(req: NextRequest) {
    try {
        const userId = await requireUserId();
        const body = await req.json();
        const { token, issuer_id, payment_method_id, transaction_amount, installments, payer, matchId, spotId, team, position } = body;

        if (!matchId || !spotId || !token) {
            return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
        }

        const match = await prisma.match.findUnique({
            where: { id: matchId },
            select: { id: true, venueId: true, title: true },
        });

        if (!match) {
            return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
        }

        // Determinar token de acceso (Cancha o Plataforma)
        let accessToken = process.env.MP_ACCESS_TOKEN;
        if (match.venueId) {
            try {
                const creds = await ensureVenueAccessToken(match.venueId);
                accessToken = creds.accessToken;
            } catch (e) {
                console.error("No se pudo obtener credenciales de la cancha, usando token de plataforma como fallback (si existe)", e);
                // Si falla la cancha, podríamos fallar o intentar con la plataforma (pero entonces no se divide el pago igual)
                // Por consistencia con marketplace.ts, si falla ensureVenueAccessToken, fallamos.
                return NextResponse.json({ error: "La cancha no tiene configurado Mercado Pago correctamente." }, { status: 400 });
            }
        }

        if (!accessToken) {
            return NextResponse.json({ error: "Error de configuración de pago en el servidor" }, { status: 500 });
        }

        const client = new MercadoPagoConfig({ accessToken });
        const paymentClient = new Payment(client);

        const marketplaceFee = await getMarketplaceFee(match.venueId, transaction_amount);

        const paymentData: any = {
            token,
            issuer_id,
            payment_method_id,
            transaction_amount,
            installments,
            description: match.title || "Cupo PichangApp",
            payer: {
                email: payer.email,
                identification: payer.identification,
            },
            capture: false, // AUTH ONLY
            application_fee: marketplaceFee,
            external_reference: `${matchId}:${spotId}`,
            statement_descriptor: "PICHANGAPP",
            binary_mode: true, // No pending payments
        };

        const result = await paymentClient.create({ body: paymentData });

        if (result.status === "authorized" || result.status === "approved") {
            // Crear registro de pago
            // Primero verificamos si ya existe un pago para este spot (reintento)
            const existingPayment = await prisma.payment.findUnique({ where: { spotId } });
            let paymentId = existingPayment?.id;

            if (existingPayment) {
                await prisma.payment.update({
                    where: { id: paymentId },
                    data: {
                        amountCLP: transaction_amount,
                        userId,
                        provider: "MP",
                        providerRef: String(result.id),
                        status: "PENDING",
                        raw: result as any,
                        team,
                        position
                    }
                });
            } else {
                const newPayment = await prisma.payment.create({
                    data: {
                        amountCLP: transaction_amount,
                        userId,
                        matchId,
                        spotId,
                        provider: "MP",
                        providerRef: String(result.id),
                        status: "PENDING",
                        raw: result as any,
                        team,
                        position
                    }
                });
                paymentId = newPayment.id;
            }

            // Aprobar (Authorizar) el pago y reservar el cupo
            await approvePayment(paymentId!, String(result.id), result, { status: "AUTHORIZED" });

            return NextResponse.json({ status: result.status, id: result.id });
        } else {
            return NextResponse.json({
                error: "Pago no autorizado",
                status: result.status,
                detail: result.status_detail
            }, { status: 400 });
        }

    } catch (e: any) {
        console.error("[api/payments/process]", e);
        return NextResponse.json({ error: e.message || "Error al procesar el pago" }, { status: 500 });
    }
}
