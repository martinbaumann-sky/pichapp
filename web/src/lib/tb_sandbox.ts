// Helpers para Transbank sandbox / simulador mínimo
import { randomUUID } from "crypto";

type CreateTbOpts = { paymentId: string; amount: number; matchId: string; spotId: string; baseUrl: string };

export async function createTbTransaction(opts: CreateTbOpts) {
  // Intentar usar SDK real si hay variables de entorno que lo indiquen.
  const commerceCode = process.env.TRANSBANK_COMMERCE_CODE;
  const apiKey = process.env.TRANSBANK_API_KEY;
  if (commerceCode && apiKey) {
    try {
      // Intento de import dinámico; si falla, caer al sandbox.
      // Nota: para soporte real, instala `transbank-sdk` o el paquete oficial requerido.
      // Aquí devolvemos un error instructivo si no está disponible.
      // Use require via eval to avoid bundler static analysis
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const req: any = (0, eval)("require");
      const sdk = req("transbank-sdk");
      if (sdk && sdk.Webpay) {
        // Integración mínima (requiere ajustar según la versión del SDK instalado).
        try {
          const Webpay = sdk.Webpay;
          const options = { commerceCode, apiKey, environment: sdk.Environment.SANDBOX };
          const webpay = new Webpay(options);
          // Dependiendo del SDK la creación del checkout puede variar; mantenemos fallback instructivo.
          const providerRef = `TB_${randomUUID()}`;
          const checkoutUrl = `${opts.baseUrl}/api/tb/simulate?paymentId=${encodeURIComponent(opts.paymentId)}&providerRef=${encodeURIComponent(providerRef)}`;
          return { providerRef, checkoutUrl };
        } catch (err) {
          console.warn("Transbank SDK detected but failed to create transaction, falling back to sandbox", err);
        }
      }
    } catch (err) {
      console.warn("Transbank SDK not installed or import failed, usando sandbox", err);
    }
  }

  // Fallback sandbox: generamos providerRef y URL a simulador interno
  const providerRef = `TB_${randomUUID()}`;
  const checkoutUrl = `${opts.baseUrl}/api/tb/simulate?paymentId=${encodeURIComponent(opts.paymentId)}&providerRef=${encodeURIComponent(providerRef)}&matchId=${encodeURIComponent(opts.matchId)}`;
  return { providerRef, checkoutUrl };
}



