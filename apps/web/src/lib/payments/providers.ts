type Provider = "mercadopago" | "flow" | "khipu" | "tb";

export function getEnabledProviders(): Provider[] {
  const providers: Provider[] = [];
  if (process.env.MP_CLIENT_ID && process.env.MP_CLIENT_SECRET) providers.push("mercadopago");
  if (process.env.FLOW_API_KEY && process.env.FLOW_SECRET_KEY) providers.push("flow");
  if (process.env.KHIPU_SECRET_KEY && process.env.KHIPU_RECEIVER_ID) providers.push("khipu");
  if (process.env.TRANSBANK_API_KEY && process.env.TRANSBANK_COMMERCE_CODE) providers.push("tb");
  return providers;
}

export function initPaymentSession(matchId: string, provider: Provider, amount: number, currency = "CLP") {
  return {
    id: `${provider}-${matchId}`,
    provider,
    amount,
    currency,
    redirectUrl: `/pagos/${provider}/session/${matchId}`,
  };
}
