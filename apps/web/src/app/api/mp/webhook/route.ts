import { NextRequest, NextResponse } from "next/server";
import { captureException } from "@sentry/nextjs";
import { getLogger, withRequestId } from "@/lib/logger";
import { getQueueClient } from "@/lib/queue";
import { isValidMercadoPagoSignature, processMercadoPagoWebhook, type MercadoPagoWebhookPayload } from "@/lib/mp/webhook-processor";

export const runtime = "nodejs";

const logger = getLogger({ module: "api.mp.webhook" });

function resolveJobUrl() {
  const explicit = process.env.MP_WEBHOOK_JOB_URL?.trim();
  if (explicit) {
    return explicit;
  }
  const base = process.env.WEB_APP_BASE_URL?.trim() || process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (!base) {
    return null;
  }
  try {
    const url = new URL(base);
    url.pathname = "/api/jobs/process-mp-webhook";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch (error) {
    logger.warn({ error, base }, "failed to build queue target URL");
    return null;
  }
}

export async function POST(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") || req.headers.get("upstash-trace-id");
  const scopedLogger = withRequestId(logger, requestId);

  const rawBody = await req.text();
  let parsedBody: any = {};
  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody);
    } catch (error) {
      scopedLogger.warn({ error }, "invalid JSON body for MercadoPago webhook");
      return NextResponse.json({ error: "invalid json" }, { status: 400 });
    }
  }

  const query = Object.fromEntries(req.nextUrl.searchParams.entries());
  const payload: MercadoPagoWebhookPayload = {
    body: parsedBody,
    query,
    mpUserId: parsedBody?.user_id ?? parsedBody?.data?.user_id ?? query?.user_id ?? null,
    signature: req.headers.get("x-signature"),
    requestId,
  };

  const secret = process.env.MP_WEBHOOK_SIGNATURE_SECRET;
  if (!isValidMercadoPagoSignature(payload, secret)) {
    scopedLogger.warn({ requestId }, "invalid MercadoPago signature");
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const queue = getQueueClient();
  const jobUrl = resolveJobUrl();

  if (queue && jobUrl) {
    try {
      await queue.publishJSON({
        url: jobUrl,
        body: payload,
        retries: 3,
      });
      return NextResponse.json({ ok: true, queued: true });
    } catch (error) {
      scopedLogger.error({ error }, "failed to enqueue MercadoPago webhook");
      captureException(error, { data: { reason: "enqueue_mp_webhook" } });
    }
  }

  try {
    await processMercadoPagoWebhook(payload);
    return NextResponse.json({ ok: true, queued: false });
  } catch (error) {
    scopedLogger.error({ error }, "failed to process MercadoPago webhook synchronously");
    captureException(error, { data: { reason: "sync_mp_webhook" } });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
