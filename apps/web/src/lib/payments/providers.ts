import { createHmac } from "crypto";
import { createMarketplacePreference } from "@/lib/mp/marketplace";
import { createTbTransaction } from "@/lib/tb_sandbox";

export type ProviderKey = "MP" | "MP_QR" | "WEBPAY" | "KHIPU" | "FINTOC" | "FLOW";

export type PaymentInitResult = {
  type: "redirect" | "qr";
  url?: string;
  providerRef: string;
  qrUrl?: string;
  qrData?: string;
  extra?: Record<string, unknown>;
};

type FlowOverride = { apiKey: string; secret: string; env?: "PROD" | "SANDBOX" };

export type InitPaymentArgs = {
  provider: ProviderKey;
  payment: { id: string; amountCLP: number; spotId: string };
  match: { id: string; title?: string | null; comuna?: string | null; venueId?: string | null };
  baseUrl: string;
  user: { email: string | null; name?: string | null };
  venue?: { id?: string | null; flow?: FlowOverride };
};

export function getEnabledProviders() {
  const mpOauthReady = !!process.env.MP_CLIENT_ID && !!process.env.MP_CLIENT_SECRET && !!process.env.MP_REDIRECT_URI;
  const mpTokenReady = !!process.env.MP_ACCESS_TOKEN;
  const mpConnected = mpOauthReady || mpTokenReady;
  const tbEnabled = true;
  const khipuReady = !!process.env.KHIPU_RECEIVER_ID && !!process.env.KHIPU_SECRET_KEY;
  const flowReady = !!process.env.FLOW_API_KEY && !!process.env.FLOW_SECRET_KEY;
  const fintocReady = !!process.env.FINTOC_SECRET_KEY;
  const mpQrReady = !!process.env.MP_QR_USER_ID && !!process.env.MP_QR_POS_ID;
  return {
    MP: mpConnected,
    MP_QR: mpQrReady,
    WEBPAY: tbEnabled,
    KHIPU: khipuReady,
    FLOW: flowReady,
    FINTOC: fintocReady,
  };
}

export async function initPaymentSession({ provider, payment, match, baseUrl, user, venue }: InitPaymentArgs): Promise<PaymentInitResult> {
  switch (provider) {
    case "MP":
      return initMercadoPago({ payment, match, baseUrl, user, venueId: venue?.id ?? match.venueId ?? null });
    case "MP_QR":
      return initMercadoPagoQr({ payment, match, baseUrl, user });
    case "WEBPAY":
      return initWebpay({ payment, match, baseUrl });
    case "KHIPU":
      return initKhipu({ payment, match, baseUrl, user });
    case "FLOW":
      return initFlow({ payment, match, baseUrl, user, credentials: venue?.flow });
    case "FINTOC":
      return initFintoc({ payment, match, baseUrl, user });
    default:
      throw new Error(`Proveedor no soportado: ${provider}`);
  }
}

async function initMercadoPago({
  payment,
  match,
  baseUrl,
  user,
  venueId,
}: {
  payment: { id: string; amountCLP: number; spotId: string };
  match: { id: string; title?: string | null; venueId?: string | null };
  baseUrl: string;
  user: { email: string | null; name?: string | null };
  venueId: string | null;
}): Promise<PaymentInitResult> {
  const title = match.title || "Cupo PichangApp";
  const externalReference = `${match.id}:${payment.spotId}`;
  const preference = await createMarketplacePreference({
    venueId,
    title,
    priceCLP: payment.amountCLP,
    externalReference,
    baseUrl,
    payer: user,
  });
  return { type: "redirect", providerRef: preference.id, url: preference.initPoint };
}

async function initMercadoPagoQr(args: {
  payment: { id: string; amountCLP: number; spotId: string };
  match: { id: string; title?: string | null; venueId?: string | null };
  baseUrl: string;
  user: { email: string | null; name?: string | null };
}): Promise<PaymentInitResult> {
  const result = await initMercadoPago({
    ...args,
    venueId: args.match.venueId ?? null,
  });
  const encoded = encodeURIComponent(result.url!);
  const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=320x320&chl=${encoded}`;
  return { ...result, type: "qr", qrUrl };
}

async function initWebpay({ payment, match, baseUrl }: { payment: { id: string; amountCLP: number }; match: { id: string }; baseUrl: string; }): Promise<PaymentInitResult> {
  const resp = await createTbTransaction({
    paymentId: payment.id,
    amount: payment.amountCLP,
    matchId: match.id,
    spotId: payment.id,
    baseUrl,
  });
  return { type: "redirect", providerRef: resp.providerRef, url: resp.checkoutUrl };
}

async function initKhipu({ payment, match, baseUrl, user }: { payment: { id: string; amountCLP: number }; match: { id: string; title?: string | null }; baseUrl: string; user: { email: string | null; name?: string | null } }): Promise<PaymentInitResult> {
  const receiverId = process.env.KHIPU_RECEIVER_ID;
  const secret = process.env.KHIPU_SECRET_KEY;
  if (!receiverId || !secret) {
    throw new Error("Configura KHIPU_RECEIVER_ID y KHIPU_SECRET_KEY");
  }
  const auth = Buffer.from(`${receiverId}:${secret}`).toString("base64");
  const body = {
    subject: match.title || "Cupo PichangApp",
    currency: "CLP",
    amount: payment.amountCLP,
    transaction_id: payment.id,
    body: `Pago partido ${match.id}`,
    custom: JSON.stringify({ paymentId: payment.id, matchId: match.id }),
    return_url: `${baseUrl}/match/${match.id}/chat?paid=1`,
    cancel_url: `${baseUrl}/match/${match.id}?paid=0`,
    notify_url: `${baseUrl}/api/khipu/webhook`,
    payer_email: user.email || undefined,
  };
  const res = await fetch("https://khipu.com/api/2.0/payments", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "No se pudo crear pago en Khipu");
  }
  const data = await res.json();
  return { type: "redirect", providerRef: String(data.payment_id || data.id || payment.id), url: data.payment_url || data.url };
}

async function initFlow({
  payment,
  match,
  baseUrl,
  user,
  credentials,
}: {
  payment: { id: string; amountCLP: number };
  match: { id: string; title?: string | null };
  baseUrl: string;
  user: { email: string | null };
  credentials?: FlowOverride;
}): Promise<PaymentInitResult> {
  const apiKey = credentials?.apiKey ?? process.env.FLOW_API_KEY;
  const secret = credentials?.secret ?? process.env.FLOW_SECRET_KEY;
  if (!apiKey || !secret) {
    throw new Error("Configura las credenciales de Flow");
  }
  const envSetting = credentials?.env ?? process.env.FLOW_ENV;
  const env = envSetting === "PROD" ? "https://www.flow.cl/api" : "https://sandbox.flow.cl/api";
  const params: Record<string, string> = {
    apiKey,
    commerceOrder: payment.id,
    subject: match.title || "Cupo PichangApp",
    currency: "CLP",
    amount: String(payment.amountCLP),
    email: user.email || "sin-correo@pichangapp.cl",
    urlConfirmation: `${baseUrl}/api/flow/webhook`,
    urlReturn: `${baseUrl}/match/${match.id}/chat?paid=1`,
  };
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  const signature = createHmac("sha256", secret).update(toSign).digest("hex");
  const form = new URLSearchParams({ ...params, s: signature });
  const res = await fetch(`${env}/payment/create`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "No se pudo crear pago en Flow");
  }
  const data = await res.json();
  if (!data.url || !data.token) {
    throw new Error("Flow no entrego URL de pago");
  }
  return { type: "redirect", providerRef: String(data.token), url: data.url };
}

async function initFintoc({ payment, match, baseUrl, user }: { payment: { id: string; amountCLP: number }; match: { id: string; title?: string | null }; baseUrl: string; user: { email: string | null } }): Promise<PaymentInitResult> {
  const secret = process.env.FINTOC_SECRET_KEY;
  if (!secret) {
    throw new Error("Configura FINTOC_SECRET_KEY");
  }
  const res = await fetch("https://api.fintoc.com/v1/payments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({
      amount: payment.amountCLP,
      currency: "CLP",
      description: match.title || "Cupo PichangApp",
      subject: `Pago partido ${match.id}`,
      customer_email: user.email || undefined,
      callback_url: `${baseUrl}/api/fintoc/webhook`,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "No se pudo crear pago en Fintoc");
  }
  const data = await res.json();
  return { type: "redirect", providerRef: String(data.id || payment.id), url: data.link || data.url };
}
