import { getSupabaseServiceClient } from "../supabase-clients";

async function logPayment(action: string, payload: Record<string, any>) {
  const client = getSupabaseServiceClient();
  await client.from("payment_events").insert({ action, payload, created_at: new Date().toISOString() });
}

export async function approvePayment(paymentId: string, meta?: Record<string, any>) {
  await logPayment("approve", { paymentId, meta });
  return { id: paymentId, status: "approved" };
}

export async function rejectPayment(paymentId: string, meta?: Record<string, any>) {
  await logPayment("reject", { paymentId, meta });
  return { id: paymentId, status: "rejected" };
}

export async function confirmMatchAndCapturePayments(matchId: string, meta?: Record<string, any>) {
  await logPayment("confirm_match", { matchId, meta });
  return { matchId, status: "confirmed" };
}

export async function refundPayment(paymentId: string, meta?: Record<string, any>) {
  await logPayment("refund", { paymentId, meta });
  return { id: paymentId, status: "refunded" };
}
