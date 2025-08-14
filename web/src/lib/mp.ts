import { MercadoPagoConfig, Preference } from "mercadopago";

const accessToken = process.env.MP_ACCESS_TOKEN;
if (!accessToken) {
  // No arrojamos error al cargar el módulo para no romper build/local dev sin credenciales
  // Los endpoints de pago validarán la presencia de la credencial.
}

export function getMpPreferenceClient() {
  if (!accessToken) {
    throw new Error("Falta MP_ACCESS_TOKEN en variables de entorno");
  }
  const client = new MercadoPagoConfig({ accessToken });
  return new Preference(client);
}
