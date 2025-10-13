import { createHash, createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { decryptSecret } from "@/lib/encryption";
import { approvePayment, rejectPayment } from "@/lib/payments/update";

function flowEnvBase(env: "PROD" | "SANDBOX") {
  return env === "PROD" ? "https://www.flow.cl/api" : "https://sandbox.flow.cl/api";
}

function buildSignature(secret: string, data: Record<string, string>) {
  const toSign = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join("&");
  return createHmac("sha256", secret).update(toSign).digest("hex");
}

function normalizeKey(key: string) {
  return key.toLowerCase();
}

function extractValue(entries: Array<[string, string]>, target: string) {
  const normalized = target.toLowerCase();
  for (let i = entries.length - 1; i >= 0; i--) {
    const [key, value] = entries[i];
    if (normalizeKey(key) === normalized) {
      return value;
    }
  }
  return undefined;
}

async function parseEntries(req: NextRequest): Promise<Array<[string, string]>> {
  const entries: Array<[string, string]> = [];
  const search = new URL(req.url).searchParams;
  for (const [key, value] of search.entries()) {
    entries.push([key, value]);
  }
  if (req.method === "POST") {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = (await req.json().catch(() => ({}))) as Record<string, unknown>;
      for (const [key, value] of Object.entries(json)) {
        if (typeof value === "string") {
          entries.push([key, value]);
        }
      }
    } else {
      const bodyText = await req.text();
      const form = new URLSearchParams(bodyText);
      for (const [key, value] of form.entries()) {
        entries.push([key, value]);
      }
    }
  }
  return entries;
}

export async function POST(req: NextRequest) {
  return handle(req);
}

export async function GET(req: NextRequest) {
  return handle(req);
}

async function handle(req: NextRequest) {
  try {
    const entries = await parseEntries(req);
    const apiKey = extractValue(entries, "apiKey");
    const token = extractValue(entries, "token");
    const signature = extractValue(entries, "s");

    if (!apiKey || !token) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const apiKeyHash = createHash("sha256").update(apiKey).digest("hex");
    const venue = await prisma.venue.findFirst({
      where: { flowApiKeyHash: apiKeyHash },
      select: { id: true, flowSecretKey: true, flowEnv: true },
    });

    if (!venue) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    const secret = decryptSecret(venue.flowSecretKey);
    if (!secret) {
      return NextResponse.json({ ok: false }, { status: 503 });
    }

    if (signature) {
      const signaturePayload: Record<string, string> = {};
      for (const [key, value] of entries) {
        if (normalizeKey(key) === "s") continue;
        signaturePayload[key] = value;
      }
      const expected = buildSignature(secret, signaturePayload);
      if (expected !== signature) {
        return NextResponse.json({ ok: false }, { status: 401 });
      }
    }

    const params = { apiKey, token: String(token) };
    const form = new URLSearchParams({ ...params, s: buildSignature(secret, params) });
    const env = (venue.flowEnv ?? "SANDBOX").toUpperCase() === "PROD" ? "PROD" : "SANDBOX";
    const res = await fetch(`${flowEnvBase(env)}/payment/getStatus`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    if (!res.ok) {
      return NextResponse.json({ ok: false }, { status: res.status });
    }
    const data = await res.json();
    const paymentId = data.commerceOrder || data.reference || data.orderNumber;
    if (!paymentId) {
      return NextResponse.json({ ok: true });
    }

    const status = Number(data.status || data.paymentStatus);
    if (status === 2) {
      await approvePayment(String(paymentId), data.flowOrder || token, data);
    } else if (status === 3) {
      await rejectPayment(String(paymentId), data.flowOrder || token);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[flow/webhook]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
