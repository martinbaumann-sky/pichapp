import crypto from "crypto";
import { getSupabaseServiceClient } from "../supabase-clients";

const MP_TABLE = "mp_venue_tokens";

export type MarketplacePreferenceInput = {
  title: string;
  description?: string | null;
  externalReference?: string | null;
  payerEmail?: string | null;
  amount: number;
  currency?: string;
  successUrl: string;
  failureUrl: string;
  notificationUrl?: string | null;
};

export function getMarketplaceFee(): number {
  return Number(process.env.MP_FEE_BPS ?? "300");
}

export function buildMpOauthUrl(state: string) {
  const clientId = process.env.MP_CLIENT_ID;
  const redirect = process.env.MP_REDIRECT_URI;
  if (!clientId || !redirect) {
    throw new Error("Configura MP_CLIENT_ID y MP_REDIRECT_URI para iniciar OAuth");
  }
  const base = "https://auth.mercadopago.com/authorization";
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirect,
    state,
  });
  return `${base}?${params.toString()}`;
}

export async function ensureVenueAccessToken(venueId: string) {
  const client = getSupabaseServiceClient();
  const { data } = await client.from(MP_TABLE).select("*").eq("venue_id", venueId).maybeSingle();
  return data ?? null;
}

export async function createMarketplacePreference(input: MarketplacePreferenceInput) {
  // Placeholder: this should call Mercado Pago SDK; we only persist intent data for now.
  const client = getSupabaseServiceClient();
  const ref = input.externalReference || crypto.randomUUID();
  await client
    .from("mp_preferences")
    .insert({
      reference: ref,
      title: input.title,
      description: input.description,
      payer_email: input.payerEmail,
      amount: input.amount,
      currency: input.currency || "CLP",
      success_url: input.successUrl,
      failure_url: input.failureUrl,
      notification_url: input.notificationUrl,
    })
    .throwOnError();
  return {
    id: ref,
    init_point: input.successUrl,
    sandbox_init_point: input.successUrl,
    preference: input,
  };
}

export async function testMpConnection(venueId: string) {
  const token = await ensureVenueAccessToken(venueId);
  return { ok: Boolean(token), venueId };
}

export function parseExternalReference(reference: string | null | undefined) {
  if (!reference) return null;
  try {
    const obj = JSON.parse(reference);
    return obj;
  } catch {
    return { reference };
  }
}

export function verifyMpSignature(payload: string, signature: string, secret?: string) {
  if (!secret) return false;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  const digest = hmac.digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export async function createRefundForPayment(_paymentId: string) {
  // Placeholder: in a real implementation, call Mercado Pago refunds endpoint.
  return { id: _paymentId, status: "refunded" };
}
