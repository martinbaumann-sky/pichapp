import { NextResponse } from "next/server";

interface VenueRegistrationPayload {
  venueName: string;
  taxId: string;
  email: string;
  phone: string;
  address: string;
  comuna: string;
  geo: string;
  fields: string;
  accountHolder: string;
  payoutEmail: string;
  bankAccount?: string;
  acceptTerms: boolean;
}

export async function POST(request: Request) {
  let payload: Partial<VenueRegistrationPayload> = {};

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    payload = await request.json();
  } else if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    payload = Object.fromEntries(formData.entries()) as Partial<VenueRegistrationPayload>;
    if (typeof payload.acceptTerms !== "undefined") {
      payload.acceptTerms =
        payload.acceptTerms === true || payload.acceptTerms === "true" || payload.acceptTerms === "on";
    }
  }

  const requiredFields: Array<keyof VenueRegistrationPayload> = [
    "venueName",
    "taxId",
    "email",
    "phone",
    "address",
    "comuna",
    "geo",
    "fields",
    "accountHolder",
    "payoutEmail",
  ];

  for (const field of requiredFields) {
    if (!payload[field] || String(payload[field]).trim().length === 0) {
      return NextResponse.json(
        {
          error: "Faltan datos obligatorios en el registro de la cancha.",
          missingField: field,
        },
        { status: 400 },
      );
    }
  }

  if (!payload.acceptTerms) {
    return NextResponse.json(
      {
        error: "Debes aceptar los términos y condiciones para continuar.",
      },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();

  const venueDraft = {
    id: `venue_${Date.now()}`,
    name: payload.venueName,
    comuna: payload.comuna,
    createdAt: now,
    plan: "gratis",
    status: "pending_review",
  };

  return NextResponse.json({
    message: "Registro recibido. Revisaremos tu información y te contactaremos por correo electrónico.",
    venue: venueDraft,
  });
}
