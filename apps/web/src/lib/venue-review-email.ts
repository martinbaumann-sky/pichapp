import { assertResend } from "@/lib/email";
import { getLogger } from "@/lib/logger";
import { createVenueReviewToken } from "@/lib/venue-approval-token";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "PichangApp <no-reply@pichangapp.cl>";
const REVIEW_INBOX = process.env.VENUE_REVIEW_EMAIL ?? "contacto.pichapp@gmail.com";
const logger = getLogger({ module: "email.venue-review" });
interface VenueReviewEmailOptions {
  venue: {
    id: string;
    name: string;
    taxId: string;
    address: string;
    comuna: string;
    phone?: string | null;
  payoutEmail: string;
  accountHolder: string;
  mpCollectorId?: string;
  mpAccountType?: string;
  lat?: number | null;
  lng?: number | null;
  fields?: Array<{ name: string }>;
  };
  owner: {
    id: string;
    email: string;
    name?: string | null;
  };
}

function resolveBaseUrl() {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export async function sendVenueReviewEmail(opts: VenueReviewEmailOptions) {
  try {
    const resend = assertResend();
    const baseUrl = resolveBaseUrl();
    const approveToken = await createVenueReviewToken(opts.venue.id, "approve");
    const blockToken = await createVenueReviewToken(opts.venue.id, "block");
    const approveUrl = `${baseUrl}/api/venue/review?token=${encodeURIComponent(approveToken)}&decision=approve`;
    const blockUrl = `${baseUrl}/api/venue/review?token=${encodeURIComponent(blockToken)}&decision=block`;
    const fieldList = Array.isArray(opts.venue.fields) && opts.venue.fields.length > 0
      ? opts.venue.fields.map((f) => f.name).join(", ")
      : "Sin información";
    const mapLink = opts.venue.lat && opts.venue.lng
      ? `https://www.google.com/maps/search/?api=1&query=${opts.venue.lat},${opts.venue.lng}`
      : null;

    const ownerName = opts.owner.name ? ` (${opts.owner.name})` : "";

    const html = `
      <div style="font-family: Inter, Arial, sans-serif; line-height: 1.6; color: #0f172a;">
        <h1 style="font-size: 20px; font-weight: 700; margin-bottom: 12px;">Nueva cancha pendiente de verificación</h1>
        <p style="margin-bottom: 16px;">Revisa la información y decide si apruebas o bloqueas esta cuenta.</p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
          <tbody>
            <tr>
              <td style="padding: 6px 8px; font-weight: 600; width: 160px;">Nombre</td>
              <td style="padding: 6px 8px;">${opts.venue.name}</td>
            </tr>
            <tr>
              <td style="padding: 6px 8px; font-weight: 600;">RUT / Tax ID</td>
              <td style="padding: 6px 8px;">${opts.venue.taxId}</td>
            </tr>
            <tr>
              <td style="padding: 6px 8px; font-weight: 600;">Dirección</td>
              <td style="padding: 6px 8px;">${opts.venue.address}${mapLink ? ` · <a href="${mapLink}" target="_blank">Ver mapa</a>` : ""}</td>
            </tr>
            <tr>
              <td style="padding: 6px 8px; font-weight: 600;">Comuna</td>
              <td style="padding: 6px 8px;">${opts.venue.comuna}</td>
            </tr>
            <tr>
              <td style="padding: 6px 8px; font-weight: 600;">Teléfono</td>
              <td style="padding: 6px 8px;">${opts.venue.phone || "Sin información"}</td>
            </tr>
            <tr>
              <td style="padding: 6px 8px; font-weight: 600;">Correo pagos</td>
              <td style="padding: 6px 8px;">${opts.venue.payoutEmail}</td>
            </tr>
            <tr>
              <td style="padding: 6px 8px; font-weight: 600;">Titular cuenta</td>
              <td style="padding: 6px 8px;">${opts.venue.accountHolder}</td>
            </tr>
            <tr>
              <td style="padding: 6px 8px; font-weight: 600;">Tipo cuenta MP</td>
              <td style="padding: 6px 8px;">${opts.venue.mpAccountType || "Sin información"}</td>
            </tr>
            <tr>
              <td style="padding: 6px 8px; font-weight: 600;">Collector ID</td>
              <td style="padding: 6px 8px;">${opts.venue.mpCollectorId || "Sin información"}</td>
            </tr>
            <tr>
              <td style="padding: 6px 8px; font-weight: 600;">Tipos de cancha</td>
              <td style="padding: 6px 8px;">${fieldList}</td>
            </tr>
            <tr>
              <td style="padding: 6px 8px; font-weight: 600;">Usuario</td>
              <td style="padding: 6px 8px;">${opts.owner.email}${ownerName}</td>
            </tr>
          </tbody>
        </table>
        <div style="display: flex; gap: 12px;">
          <a href="${approveUrl}" style="background: #16a34a; color: #ffffff; padding: 10px 18px; border-radius: 999px; text-decoration: none; font-weight: 600;">Aprobar cuenta</a>
          <a href="${blockUrl}" style="background: #dc2626; color: #ffffff; padding: 10px 18px; border-radius: 999px; text-decoration: none; font-weight: 600;">Bloquear cuenta</a>
        </div>
      </div>
    `;

    const text = [
      "Nueva cancha pendiente de verificación",
      `Nombre: ${opts.venue.name}`,
      `RUT: ${opts.venue.taxId}`,
      `Dirección: ${opts.venue.address}`,
      `Comuna: ${opts.venue.comuna}`,
      `Teléfono: ${opts.venue.phone || "Sin información"}`,
      `Correo pagos: ${opts.venue.payoutEmail}`,
      `Titular: ${opts.venue.accountHolder}`,
      `Tipo cuenta MP: ${opts.venue.mpAccountType || "Sin información"}`,
      `Collector ID: ${opts.venue.mpCollectorId || "Sin información"}`,
      `Tipos de cancha: ${fieldList}`,
      `Usuario: ${opts.owner.email}${ownerName}`,
      "",
      `Aprobar: ${approveUrl}`,
      `Bloquear: ${blockUrl}`,
    ].join("\n");

    await resend.emails.send({
      from: FROM_EMAIL,
      to: REVIEW_INBOX,
      subject: `Nueva cancha a revisar: ${opts.venue.name}`,
      html,
      text,
    });
  } catch (error) {
    logger.error({ error }, "Error enviando revisión de cancha");
  }
}
