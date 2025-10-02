import { createHmac } from "crypto";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { prisma } from "@/lib/db";
import { decryptSecret, encryptSecret } from "@/lib/encryption";

const MP_API_BASE = "https://api.mercadopago.com";

type VenueCredentials = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  userId: string | null;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} no está configurado`);
  }
  return value;
}

export function buildMpOauthUrl({ state }: { state?: string } = {}) {
  const clientId = requireEnv("MP_CLIENT_ID");
  const redirectUri = requireEnv("MP_REDIRECT_URI");
  const scopes = ["offline_access", "read_preferences", "write_preferences", "read_payments", "write_payments"];
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    platform_id: "mp",
    state: state || "",
  });
  params.append("scope", scopes.join(" "));
  return `${MP_API_BASE}/authorization?${params.toString()}`;
}

type TokenExchangeResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  user_id?: string;
};

async function requestToken(params: URLSearchParams): Promise<TokenExchangeResponse> {
  const res = await fetch(`${MP_API_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Mercado Pago OAuth error (${res.status})`);
  }
  return (await res.json()) as TokenExchangeResponse;
}

export async function exchangeMpAuthorizationCode(code: string): Promise<TokenExchangeResponse> {
  const clientId = requireEnv("MP_CLIENT_ID");
  const clientSecret = requireEnv("MP_CLIENT_SECRET");
  const redirectUri = requireEnv("MP_REDIRECT_URI");
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
  });
  return requestToken(params);
}

async function refreshMpAccessToken(venueId: string, refreshToken: string) {
  const clientId = requireEnv("MP_CLIENT_ID");
  const clientSecret = requireEnv("MP_CLIENT_SECRET");
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });
  const response = await requestToken(params);
  const expiresAt = response.expires_in ? new Date(Date.now() + response.expires_in * 1000) : null;
  await prisma.venue.update({
    where: { id: venueId },
    data: {
      mpAccessToken: encryptSecret(response.access_token),
      mpRefreshToken: response.refresh_token ? encryptSecret(response.refresh_token) : null,
      mpTokenExpiresAt: expiresAt,
      mpUserId: response.user_id ? String(response.user_id) : undefined,
    },
  });
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token ?? refreshToken,
    expiresAt,
    userId: response.user_id ? String(response.user_id) : null,
  } satisfies VenueCredentials;
}

async function decryptVenueCredentials(venueId: string): Promise<VenueCredentials | null> {
  const venue = await prisma.venue.findUnique({
    where: { id: venueId },
    select: { mpAccessToken: true, mpRefreshToken: true, mpTokenExpiresAt: true, mpUserId: true },
  });
  if (!venue?.mpAccessToken) return null;
  const accessToken = decryptSecret(venue.mpAccessToken);
  if (!accessToken) return null;
  const refreshToken = decryptSecret(venue.mpRefreshToken ?? null);
  const expiresAt = venue.mpTokenExpiresAt ? new Date(venue.mpTokenExpiresAt) : null;
  const userId = venue.mpUserId ?? null;
  return { accessToken, refreshToken, expiresAt, userId };
}

export async function ensureVenueAccessToken(venueId: string): Promise<VenueCredentials> {
  const creds = await decryptVenueCredentials(venueId);
  if (!creds) {
    throw new Error("La cancha no tiene credenciales de Mercado Pago conectadas");
  }
  const now = Date.now();
  if (creds.expiresAt && creds.expiresAt.getTime() - now < 5 * 60 * 1000 && creds.refreshToken) {
    return refreshMpAccessToken(venueId, creds.refreshToken);
  }
  return creds;
}

type PreferenceArgs = {
  venueId?: string | null;
  title: string;
  priceCLP: number;
  externalReference: string;
  quantity?: number;
  baseUrl: string;
  payer?: { email?: string | null; name?: string | null } | null;
};

export async function createMarketplacePreference({
  venueId,
  title,
  priceCLP,
  externalReference,
  quantity = 1,
  baseUrl,
  payer,
}: PreferenceArgs) {
  // Prefer venue-scoped credentials (OAuth marketplace). Fall back to global MP_ACCESS_TOKEN when unavailable.
  const envToken = process.env.MP_ACCESS_TOKEN || null;
  let accessToken: string | null = null;

  if (venueId) {
    try {
      const creds = await ensureVenueAccessToken(venueId);
      accessToken = creds.accessToken;
    } catch (e) {
      if (!envToken) {
        throw e;
      }
    }
  }

  if (!accessToken) {
    if (!envToken) {
      throw new Error("Mercado Pago no está configurado para esta cancha");
    }
    accessToken = envToken;
  }

  const client = new MercadoPagoConfig({ accessToken });
  const preference = new Preference(client);
  const feeBps = Number(process.env.MP_FEE_BPS ?? "0");
  const marketplaceFee = Math.round((priceCLP * Math.max(feeBps, 0)) / 10000);
  const trimmedBase = (baseUrl || "").trim();
  const fallbackBase = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  let resolvedBase = trimmedBase || fallbackBase || "";
  if (!resolvedBase) {
    throw new Error("Mercado Pago requiere NEXT_PUBLIC_BASE_URL configurado");
  }
  try {
    const parsed = new URL(resolvedBase);
    resolvedBase = parsed.origin;
  } catch (e) {
    throw new Error(`Base URL inválida para Mercado Pago: ${resolvedBase}`);
  }

  const notificationUrl = process.env.MP_WEBHOOK_URL || `${resolvedBase.replace(/\/$/, "")}/api/mp/webhook`;
  const useSandbox = String(process.env.MP_USE_SANDBOX ?? "false").toLowerCase() === "true";
  const matchId = externalReference.split(":")[0];
  const base = resolvedBase.replace(/\/$/, "");
  const successUrl = `${base}/partidos/${matchId}/chat?paid=1`;
  const failureUrl = `${base}/partidos/${matchId}?paid=0`;
  const result = await preference.create({
    body: {
      items: [
        {
          id: externalReference,
          title,
          quantity,
          currency_id: "CLP",
          unit_price: priceCLP,
        },
      ],
      notification_url: notificationUrl,
      external_reference: externalReference,
      statement_descriptor: "PICHANGAPP",
      marketplace_fee: marketplaceFee,
      payer: payer?.email
        ? {
            email: payer.email,
            name: payer?.name ?? undefined,
          }
        : undefined,
      back_urls: {
        success: successUrl,
        pending: failureUrl,
        failure: failureUrl,
      },
      binary_mode: true,
    },
    requestOptions: {
      idempotencyKey: `create-pref-${externalReference}`,
    },
  });
  const id = (result as any)?.id ?? (result as any)?.response?.id;
  const initPoint = useSandbox
    ? (result as any)?.sandbox_init_point ?? (result as any)?.init_point ?? (result as any)?.response?.init_point
    : (result as any)?.init_point ?? (result as any)?.response?.init_point;
  if (!id || !initPoint) {
    throw new Error("Mercado Pago no entregó la preferencia de pago");
  }
  return { id: String(id), initPoint: String(initPoint) };
}

export function parseExternalReference(reference: string | null | undefined) {
  if (!reference) return null;
  const [matchId, reservationId] = reference.split(":");
  if (!matchId || !reservationId) return null;
  return { matchId, reservationId };
}

export async function fetchPaymentDetails(venueId: string, paymentId: string) {
  const { accessToken } = await ensureVenueAccessToken(venueId);
  const res = await fetch(`${MP_API_BASE}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Error al consultar pago ${paymentId}`);
  }
  return (await res.json()) as any;
}

export async function fetchMerchantOrder(venueId: string, orderId: string) {
  const { accessToken } = await ensureVenueAccessToken(venueId);
  const res = await fetch(`${MP_API_BASE}/merchant_orders/${orderId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Error al consultar orden ${orderId}`);
  }
  return (await res.json()) as any;
}

export async function createRefundForPayment({
  venueId,
  paymentId,
  idempotencyKey,
}: {
  venueId: string;
  paymentId: string;
  idempotencyKey: string;
}) {
  const { accessToken } = await ensureVenueAccessToken(venueId);
  const res = await fetch(`${MP_API_BASE}/v1/payments/${paymentId}/refunds`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({}),
  });
  if (!res.ok && res.status !== 409) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Error al crear reembolso (${res.status})`);
  }
  return res.status === 204 ? null : await res.json().catch(() => null);
}

export async function findVenueByMpUserId(mpUserId: string) {
  return prisma.venue.findFirst({
    where: { mpUserId },
    select: { id: true, mpUserId: true },
  });
}

export function verifyMpSignature({
  signature,
  requestId,
  secret,
}: {
  signature: string | null;
  requestId: string | null;
  secret: string;
}) {
  if (!signature || !requestId) return false;
  const parts = Object.fromEntries(
    signature
      .split(",")
      .map((segment) => segment.trim().split("=") as [string, string])
      .filter((pair) => pair.length === 2),
  );
  if (!parts.signature || !parts.ts || !parts.id) {
    return false;
  }
  const payload = `id:${parts.id};request-id:${requestId};ts:${parts.ts}`;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  return expected === parts.signature;
}
