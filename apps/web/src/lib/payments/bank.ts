type BankDetails = {
  provider: string;
  connected: boolean;
  info?: Record<string, any>;
};

export function summarizeBankDetails(): BankDetails[] {
  return [
    {
      provider: "mercadopago",
      connected: Boolean(process.env.MP_CLIENT_ID && process.env.MP_CLIENT_SECRET),
      info: {
        redirect: process.env.MP_REDIRECT_URI,
      },
    },
    {
      provider: "flow",
      connected: Boolean(process.env.FLOW_API_KEY && process.env.FLOW_SECRET_KEY),
    },
    {
      provider: "khipu",
      connected: Boolean(process.env.KHIPU_SECRET_KEY && process.env.KHIPU_RECEIVER_ID),
    },
    {
      provider: "transbank",
      connected: Boolean(process.env.TRANSBANK_API_KEY && process.env.TRANSBANK_COMMERCE_CODE),
    },
  ];
}
