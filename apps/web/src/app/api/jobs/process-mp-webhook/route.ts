import { NextRequest, NextResponse } from "next/server";
import { captureException } from "@sentry/nextjs";
import { getQueueReceiver } from "@/lib/queue";
import { getLogger } from "@/lib/logger";
import { processMercadoPagoWebhook, type MercadoPagoWebhookPayload } from "@/lib/mp/webhook-processor";

export const runtime = "nodejs";

const logger = getLogger({ module: "api.jobs.process-mp-webhook" });

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const receiver = getQueueReceiver();

  if (receiver) {
    const signature = req.headers.get("Upstash-Signature");
    if (!signature) {
      logger.warn("missing Upstash signature");
      return NextResponse.json({ error: "missing signature" }, { status: 400 });
    }

    try {
      await receiver.verify({ signature, body: rawBody });
    } catch (error) {
      logger.warn({ error }, "invalid Upstash signature");
      captureException(error, { data: { reason: "invalid_qstash_signature" } });
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
  }

  let payload: MercadoPagoWebhookPayload;
  try {
    payload = rawBody ? (JSON.parse(rawBody) as MercadoPagoWebhookPayload) : { body: {}, query: {}, mpUserId: null };
  } catch (error) {
    logger.warn({ error }, "failed to parse MercadoPago webhook job payload");
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  try {
    await processMercadoPagoWebhook(payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error({ error }, "MercadoPago webhook job failed");
    captureException(error, { data: { reason: "job_mp_webhook" } });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
