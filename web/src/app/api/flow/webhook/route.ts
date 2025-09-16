import { NextRequest, NextResponse } from "next/server";
import { approvePayment, rejectPayment } from "@/lib/payments/update";
import { createHmac } from "crypto";

function flowEnvBase() {
  return process.env.FLOW_ENV === "PROD" ? "https://www.flow.cl/api" : "https://sandbox.flow.cl/api";
}

function buildSignature(secret: string, data: Record<string, string>) {
  const toSign = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join("&");
  return createHmac("sha256", secret).update(toSign).digest("hex");
}

export async function POST(req: NextRequest) {
  return handle(req);
}

export async function GET(req: NextRequest) {
  return handle(req);
}

async function handle(req: NextRequest) {
  try {
    const apiKey = process.env.FLOW_API_KEY;
    const secret = process.env.FLOW_SECRET_KEY;
    if (!apiKey || !secret) {
      return NextResponse.json({ ok: true });
    }

    const url = new URL(req.url);
    const token = url.searchParams.get("token") || (await req.json().catch(() => ({ token: undefined }))).token;
    if (!token) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const params = { apiKey, token: String(token) };
    const form = new URLSearchParams({ ...params, s: buildSignature(secret, params) });
    const res = await fetch(`${flowEnvBase()}/payment/getStatus`, {
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
      await approvePayment(String(paymentId), data.flowOrder || token);
    } else if (status === 3) {
      await rejectPayment(String(paymentId), data.flowOrder || token);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
