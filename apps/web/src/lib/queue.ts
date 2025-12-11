// @ts-nocheck
import { Client, Receiver } from "@upstash/qstash";

let queueClient: Client | null | undefined;
let queueReceiver: Receiver | null | undefined;

export function getQueueClient(): Client | null {
  if (queueClient !== undefined) {
    return queueClient;
  }

  const token = process.env.QSTASH_TOKEN;
  const url = process.env.QSTASH_URL;

  if (!token || !url) {
    queueClient = null;
    return queueClient;
  }

  queueClient = new Client({ token, baseUrl: url as string });
  return queueClient;
}

export function getQueueReceiver(): Receiver | null {
  if (queueReceiver !== undefined) {
    return queueReceiver;
  }

  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  if (!currentSigningKey) {
    queueReceiver = null;
    return queueReceiver;
  }

  queueReceiver = new Receiver({
    currentSigningKey,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
    signatureHeader: "Upstash-Signature",
  });

  return queueReceiver;
}
