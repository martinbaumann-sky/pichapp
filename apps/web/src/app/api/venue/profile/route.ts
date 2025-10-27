import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth";
import { normalizeForStorage } from "@/lib/phone";
import { encryptSecret } from "@/lib/encryption";
import { hasModelField } from "@/lib/prismaCompat";

type PaymentProviderOption = "MP" | "FLOW";
type PayoutMethodOption = "MP_WALLET" | "FLOW" | "BANK_TRANSFER";

function parseFields(raw: unknown): string[] | null {
  if (Array.isArray(raw)) {
    return raw
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter((value) => value.length > 0)
      .slice(0, 12);
  }
  if (typeof raw === "string") {
    return raw
      .split(/[\n,]/)
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .slice(0, 12);
  }
  return null;
}

function normalizeProvider(raw: unknown, fallback: PaymentProviderOption): PaymentProviderOption {
  if (typeof raw !== "string") return fallback;
  const normalized = raw.trim().toUpperCase();
  if (normalized === "FLOW" || normalized === "MP") {
    return normalized;
  }
  return fallback;
}

function normalizePayoutMethod(raw: unknown, fallback: PayoutMethodOption): PayoutMethodOption {
  if (typeof raw !== "string") return fallback;
  const normalized = raw.trim().toUpperCase();
  if (normalized === "BANK_TRANSFER") return "BANK_TRANSFER";
  if (normalized === "FLOW") return "FLOW";
  return "MP_WALLET";
}

function normalizeFlowEnv(raw: unknown, fallback: string | null | undefined): "PROD" | "SANDBOX" {
  if (typeof raw !== "string") {
    return fallback === "PROD" ? "PROD" : "SANDBOX";
  }
  const normalized = raw.trim().toUpperCase();
  if (normalized === "PROD") return "PROD";
  return "SANDBOX";
}

export async function GET() {
  try {
    const userId = await requireUserId();
    const venue = await prisma.venue.findFirst({
      where: { ownerId: userId },
      include: { fields: { select: { id: true, name: true } } },
    });
    if (!venue) {
      return NextResponse.json({ error: "No encontramos una cancha asociada" }, { status: 404 });
    }
    return NextResponse.json({
      venue: {
        id: venue.id,
        name: venue.name,
        taxId: venue.taxId,
        address: venue.address,
        comuna: venue.comuna,
        lat: venue.lat,
        lng: venue.lng,
        phone: venue.phone,
        payoutEmail: venue.payoutEmail,
        payoutMethod: venue.payoutMethod,
        accountHolder: venue.accountHolder,
        bankName: venue.bankName,
        bankAccountType: venue.bankAccountType,
        bankAccountNumber: venue.bankAccountNumber,
        bankAccountRut: venue.bankAccountRut,
        mpCollectorId: venue.mpCollectorId,
        mpAccountType: venue.mpAccountType,
        paymentProvider: venue.paymentProvider,
        flowConfigured: Boolean(venue.flowApiKey && venue.flowSecretKey),
        flowEnv: venue.flowEnv ?? "SANDBOX",
        plan: venue.plan,
        verified: venue.verified,
        fields: venue.fields,
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[venue/profile] GET", error);
    return NextResponse.json({ error: "No se pudo cargar la información" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const payload = await req.json().catch(() => ({}));
    const venue = await prisma.venue.findFirst({ where: { ownerId: userId } });
    if (!venue) {
      return NextResponse.json({ error: "No encontramos una cancha asociada" }, { status: 404 });
    }

    const name = typeof payload?.name === "string" ? payload.name.trim() : venue.name;
    const address = typeof payload?.address === "string" ? payload.address.trim() : venue.address;
    const comuna = typeof payload?.comuna === "string" ? payload.comuna.trim() : venue.comuna;
    const payoutEmail = typeof payload?.payoutEmail === "string" ? payload.payoutEmail.trim().toLowerCase() : venue.payoutEmail;
    const accountHolder = typeof payload?.accountHolder === "string" ? payload.accountHolder.trim() : venue.accountHolder;
    const taxId = typeof payload?.taxId === "string" ? payload.taxId.trim() : venue.taxId;
    const phoneRaw = typeof payload?.phone === "string" ? payload.phone.trim() : venue.phone ?? "";
    const mpCollectorIdRaw =
      typeof payload?.mpCollectorId === "string" ? payload.mpCollectorId.trim() : venue.mpCollectorId ?? "";
    const mpAccountTypeRaw =
      typeof payload?.mpAccountType === "string" ? payload.mpAccountType.trim() : venue.mpAccountType ?? "";
    const fieldNames = parseFields(payload?.fields);

    const supportsPaymentProvider = hasModelField(venue, "paymentProvider");
    const supportsFlowApiKey = hasModelField(venue, "flowApiKey");
    const supportsFlowSecretKey = hasModelField(venue, "flowSecretKey");
    const supportsFlowEnv = hasModelField(venue, "flowEnv");
    const supportsFlowApiKeyHash = hasModelField(venue, "flowApiKeyHash");
    const supportsMpAccountType = hasModelField(venue, "mpAccountType");
    const supportsPayoutMethod = hasModelField(venue, "payoutMethod");
    const supportsBankName = hasModelField(venue, "bankName");
    const supportsBankAccountType = hasModelField(venue, "bankAccountType");
    const supportsBankAccountNumber = hasModelField(venue, "bankAccountNumber");
    const supportsBankAccountRut = hasModelField(venue, "bankAccountRut");

    let paymentProvider = supportsPaymentProvider
      ? normalizeProvider(payload?.paymentProvider, (venue.paymentProvider as PaymentProviderOption) ?? "MP")
      : "MP";
    const flowEnv = supportsFlowEnv ? normalizeFlowEnv(payload?.flowEnv, venue.flowEnv) : "SANDBOX";
    const payoutMethod = supportsPayoutMethod
      ? normalizePayoutMethod(payload?.payoutMethod, (venue.payoutMethod as PayoutMethodOption) ?? "MP_WALLET")
      : "MP_WALLET";
    const bankName = supportsBankName
      ? typeof payload?.bankName === "string"
        ? payload.bankName.trim()
        : venue.bankName ?? ""
      : "";
    const bankAccountType = supportsBankAccountType
      ? typeof payload?.bankAccountType === "string"
        ? payload.bankAccountType.trim()
        : venue.bankAccountType ?? ""
      : "";
    const bankAccountNumber = supportsBankAccountNumber
      ? typeof payload?.bankAccountNumber === "string"
        ? payload.bankAccountNumber.trim()
        : venue.bankAccountNumber ?? ""
      : "";
    const bankAccountRut = supportsBankAccountRut
      ? typeof payload?.bankAccountRut === "string"
        ? payload.bankAccountRut.trim()
        : venue.bankAccountRut ?? ""
      : "";
    const flowApiKeyRaw =
      supportsFlowApiKey && typeof payload?.flowApiKey === "string" ? payload.flowApiKey.trim() : undefined;
    const flowSecretKeyRaw =
      supportsFlowSecretKey && typeof payload?.flowSecretKey === "string" ? payload.flowSecretKey.trim() : undefined;

    if (!name || !address || !comuna || !payoutEmail || !accountHolder || !taxId) {
      return NextResponse.json({ error: "Completa todos los campos obligatorios." }, { status: 400 });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
    if (!emailPattern.test(payoutEmail)) {
      return NextResponse.json({ error: "Ingresa un correo de contacto válido." }, { status: 400 });
    }

    if (accountHolder.length < 3) {
      return NextResponse.json({ error: "Ingresa el nombre completo del titular de la cuenta." }, { status: 400 });
    }

    const collectorIdDigits = mpCollectorIdRaw.replace(/\D+/g, "");
    const mpConnected = Boolean((venue as any).mpAccessToken);
    const hasCollectorId = collectorIdDigits.length >= 5;
    const mpAccountType = mpAccountTypeRaw
      ? (() => {
          const normalized = mpAccountTypeRaw.toLowerCase();
          if (normalized.includes("persona")) return "Persona";
          if (normalized.includes("empresa") || normalized.includes("sociedad")) return "Empresa";
          if (normalized.includes("fund")) return "Fundación";
          return mpAccountTypeRaw;
        })()
      : null;

    const normalizedPhone = phoneRaw ? normalizeForStorage(phoneRaw) : null;

    const hasExistingFlowCreds =
      supportsFlowApiKey && supportsFlowSecretKey ? Boolean(venue.flowApiKey && venue.flowSecretKey) : false;
    const willStoreFlowApiKey = supportsFlowApiKey
      ? flowApiKeyRaw !== undefined
        ? flowApiKeyRaw.length > 0
        : hasExistingFlowCreds
      : false;
    const willStoreFlowSecret = supportsFlowSecretKey
      ? flowSecretKeyRaw !== undefined
        ? flowSecretKeyRaw.length > 0
        : hasExistingFlowCreds
      : false;

    if (paymentProvider === "FLOW" && (!supportsFlowApiKey || !supportsFlowSecretKey)) {
      paymentProvider = "MP";
    }

    if (paymentProvider === "FLOW" && (!willStoreFlowApiKey || !willStoreFlowSecret)) {
      return NextResponse.json(
        { error: "Ingresa las credenciales de Flow para poder cobrar los cupos directamente en tu cuenta." },
        { status: 400 },
      );
    }

    if (payoutMethod === "BANK_TRANSFER") {
      if (!bankName || !bankAccountType || !bankAccountNumber || !bankAccountRut) {
        return NextResponse.json(
          { error: "Completa los datos bancarios para poder transferir tus liquidaciones." },
          { status: 400 },
        );
      }
      if (bankAccountNumber.length < 5) {
        return NextResponse.json({ error: "Ingresa un número de cuenta válido." }, { status: 400 });
      }
      if (bankAccountRut.length < 7) {
        return NextResponse.json({ error: "Ingresa un RUT válido para el titular de la cuenta." }, { status: 400 });
      }
    }

    const updates: Record<string, unknown> = {
      name,
      address,
      comuna,
      payoutEmail,
      accountHolder,
      taxId,
      phone: normalizedPhone,
    };

    if (supportsPaymentProvider) {
      updates.paymentProvider = paymentProvider;
    }
    if (supportsFlowEnv) {
      updates.flowEnv = flowEnv;
    }
    if (supportsPayoutMethod) {
      updates.payoutMethod = payoutMethod;
    }
    if (supportsBankName) {
      updates.bankName = payoutMethod === "BANK_TRANSFER" ? bankName : null;
    }
    if (supportsBankAccountType) {
      updates.bankAccountType = payoutMethod === "BANK_TRANSFER" ? bankAccountType : null;
    }
    if (supportsBankAccountNumber) {
      updates.bankAccountNumber = payoutMethod === "BANK_TRANSFER" ? bankAccountNumber : null;
    }
    if (supportsBankAccountRut) {
      updates.bankAccountRut = payoutMethod === "BANK_TRANSFER" ? bankAccountRut : null;
    }

    if (paymentProvider === "MP") {
      if (hasCollectorId) {
        updates.mpCollectorId = collectorIdDigits;
      } else if (!mpConnected) {
        updates.mpCollectorId = null;
      } else {
        return NextResponse.json(
          {
            error: "No pudimos sincronizar tu Collector ID desde Mercado Pago. Vuelve a conectar tu cuenta desde el panel.",
          },
          { status: 400 },
        );
      }

      if (supportsMpAccountType) {
        if (mpAccountType) {
          updates.mpAccountType = mpAccountType;
        } else if (!mpConnected) {
          updates.mpAccountType = null;
        } else {
          return NextResponse.json(
            {
              error:
                "No pudimos detectar el tipo de cuenta de Mercado Pago. Renueva la conexión desde el panel para sincronizarlo automáticamente.",
            },
            { status: 400 },
          );
        }
      }
    }

    if (supportsFlowApiKey && flowApiKeyRaw !== undefined) {
      if (!flowApiKeyRaw) {
        updates.flowApiKey = null;
        if (supportsFlowApiKeyHash) {
          updates.flowApiKeyHash = null;
        }
      } else {
        updates.flowApiKey = encryptSecret(flowApiKeyRaw, { context: `venue:${venue.id}` });
        if (supportsFlowApiKeyHash) {
          updates.flowApiKeyHash = createHash("sha256").update(flowApiKeyRaw).digest("hex");
        }
      }
    }

    if (supportsFlowSecretKey && flowSecretKeyRaw !== undefined) {
      if (!flowSecretKeyRaw) {
        updates.flowSecretKey = null;
      } else {
        updates.flowSecretKey = encryptSecret(flowSecretKeyRaw, { context: `venue:${venue.id}` });
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.venue.update({
        where: { id: venue.id },
        data: updates,
      });

      if (Array.isArray(fieldNames)) {
        const uniqueFields = Array.from(new Set(fieldNames.map((value) => value.slice(0, 60))));
        await tx.field.deleteMany({ where: { venueId: venue.id } });
        if (uniqueFields.length > 0) {
          await tx.field.createMany({ data: uniqueFields.map((value) => ({ venueId: venue.id, name: value })) });
        }
      }

      await tx.profile.updateMany({ where: { userId }, data: { name } });
    });

    const fresh = await prisma.venue.findUnique({
      where: { id: venue.id },
      include: { fields: { select: { id: true, name: true } } },
    });

    return NextResponse.json({
      ok: true,
      venue: fresh
        ? {
            id: fresh.id,
            name: fresh.name,
            taxId: fresh.taxId,
            address: fresh.address,
            comuna: fresh.comuna,
            lat: fresh.lat,
            lng: fresh.lng,
            phone: fresh.phone,
            payoutEmail: fresh.payoutEmail,
            payoutMethod: fresh.payoutMethod,
            accountHolder: fresh.accountHolder,
            bankName: fresh.bankName,
            bankAccountType: fresh.bankAccountType,
            bankAccountNumber: fresh.bankAccountNumber,
            bankAccountRut: fresh.bankAccountRut,
            plan: fresh.plan,
            verified: fresh.verified,
            fields: fresh.fields,
            mpCollectorId: fresh.mpCollectorId,
            mpAccountType: fresh.mpAccountType,
            paymentProvider: fresh.paymentProvider,
            flowConfigured: Boolean(fresh.flowApiKey && fresh.flowSecretKey),
            flowEnv: fresh.flowEnv ?? "SANDBOX",
          }
        : null,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[venue/profile] PATCH", error);
    return NextResponse.json({ error: "No pudimos guardar los cambios" }, { status: 500 });
  }
}
