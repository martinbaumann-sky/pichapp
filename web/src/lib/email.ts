import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

export const resend = apiKey ? new Resend(apiKey) : null;

export function assertResend() {
  if (!resend) throw new Error("Falta RESEND_API_KEY en variables de entorno");
  return resend;
}
