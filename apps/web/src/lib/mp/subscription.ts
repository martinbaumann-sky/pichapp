const MP_API_BASE = "https://api.mercadopago.com";

function requireAccessToken(): string {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Falta MP_ACCESS_TOKEN para gestionar suscripciones de canchas");
  }
  return token;
}

interface PreapprovalArgs {
  payerEmail: string;
  reason: string;
  externalReference: string;
  backUrl: string;
  priceCLP: number;
  notificationUrl?: string | null;
}

export interface PreapprovalResponse {
  id: string;
  initPoint: string;
  status: string;
  nextPaymentDate?: string | null;
  lastChargedDate?: string | null;
}

export async function createPreapproval(args: PreapprovalArgs): Promise<PreapprovalResponse> {
  const token = requireAccessToken();
  const payload = {
    payer_email: args.payerEmail,
    back_url: args.backUrl,
    reason: args.reason,
    external_reference: args.externalReference,
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: args.priceCLP,
      currency_id: "CLP",
    },
    status: "pending",
    notification_url: args.notificationUrl ?? undefined,
  };

  const res = await fetch(`${MP_API_BASE}/preapproval`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Mercado Pago preapproval error (${res.status})`);
  }

  const data = (await res.json()) as any;
  const id = data?.id ? String(data.id) : null;
  const initPoint = data?.init_point || data?.sandbox_init_point || data?.back_url || null;
  if (!id || !initPoint) {
    throw new Error("Mercado Pago no entregó la suscripción correctamente");
  }

  return {
    id,
    initPoint: String(initPoint),
    status: data?.status ? String(data.status) : "",
    nextPaymentDate: data?.next_payment_date ?? null,
    lastChargedDate: data?.last_charged_date ?? null,
  };
}

export async function getPreapproval(preapprovalId: string) {
  const token = requireAccessToken();
  const res = await fetch(`${MP_API_BASE}/preapproval/${preapprovalId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Error al consultar suscripción ${preapprovalId}`);
  }
  return (await res.json()) as any;
}

export async function cancelPreapproval(preapprovalId: string) {
  const token = requireAccessToken();
  const res = await fetch(`${MP_API_BASE}/preapproval/${preapprovalId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "cancelled" }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Error al cancelar suscripción ${preapprovalId}`);
  }
  return (await res.json().catch(() => null)) as any;
}
