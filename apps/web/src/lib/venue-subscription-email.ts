import { assertResend, resend } from "@/lib/email";
import { VENUE_PLANS, type VenuePlanSlug } from "@/lib/venuePlans";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "PichangApp <no-reply@pichangapp.cl>";

function isEmailEnabled() {
  return Boolean(resend);
}

export async function sendVenuePlanActivatedEmail(args: {
  to: string;
  venueName: string;
  plan: VenuePlanSlug;
  dashboardUrl?: string;
}) {
  if (!isEmailEnabled()) return;
  const resendClient = assertResend();
  const planInfo = VENUE_PLANS[args.plan];
  await resendClient.emails.send({
    from: FROM_EMAIL,
    to: args.to,
    subject: `Plan ${planInfo.name} activado en PichangApp`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h1 style="font-size: 20px; font-weight: 600;">${args.venueName}, ¡bienvenido al plan ${planInfo.name}! 🎉</h1>
        <p>Tu suscripción mensual quedó activa. Desde ahora tu comisión es ${planInfo.commissionLabel}.</p>
        <p>La próxima renovación automática se procesará según la fecha indicada en tu panel de facturación.</p>
        ${args.dashboardUrl ? `<p><a href="${args.dashboardUrl}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:#10b981;color:#fff;font-weight:600;text-decoration:none;">Ir al panel de facturación</a></p>` : ""}
        <p style="font-size: 13px; color: #64748b;">Si tienes preguntas, escribe a soporte@pichangapp.cl.</p>
      </div>
    `,
    text:
      `${args.venueName}, tu plan ${planInfo.name} quedó activo. Tu comisión ahora es ${planInfo.commissionLabel}. ` +
      (args.dashboardUrl ? `Revisa los detalles en ${args.dashboardUrl}. ` : "") +
      "Si tienes preguntas contáctanos en soporte@pichangapp.cl.",
  });
}

export async function sendVenuePlanCancelledEmail(args: {
  to: string;
  venueName: string;
  plan: VenuePlanSlug;
  dashboardUrl?: string;
}) {
  if (!isEmailEnabled()) return;
  const resendClient = assertResend();
  const planInfo = VENUE_PLANS[args.plan];
  await resendClient.emails.send({
    from: FROM_EMAIL,
    to: args.to,
    subject: `Plan ${planInfo.name} cancelado en PichangApp`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h1 style="font-size: 20px; font-weight: 600;">Cancelaste el plan ${planInfo.name}</h1>
        <p>Tu suscripción fue marcada como cancelada. El plan volverá a Gratis al terminar el ciclo vigente.</p>
        ${args.dashboardUrl ? `<p><a href="${args.dashboardUrl}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:#0f172a;color:#fff;font-weight:600;text-decoration:none;">Revisar facturación</a></p>` : ""}
        <p style="font-size: 13px; color: #64748b;">¿Necesitas ayuda? Escríbenos a soporte@pichangapp.cl.</p>
      </div>
    `,
    text:
      `${args.venueName}, tu plan ${planInfo.name} fue cancelado. El plan volverá a Gratis al terminar el ciclo vigente. ` +
      (args.dashboardUrl ? `Revisa los detalles en ${args.dashboardUrl}. ` : "") +
      "Si necesitas ayuda escribe a soporte@pichangapp.cl.",
  });
}
