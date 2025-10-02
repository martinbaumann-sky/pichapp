import Link from "next/link";

const ERROR_MESSAGES: Record<string, string> = {
  config: "Faltan credenciales de Google. Informa al equipo para resolverlo.",
  invalid_state: "La sesión de Google expiró. Intenta nuevamente.",
  missing_code: "No recibimos la autorización de Google. Vuelve a intentarlo.",
  missing_id_token: "No pudimos validar tu identidad con Google.",
  invalid_id_token: "Google devolvió un token inválido. Intenta nuevamente.",
  incomplete_profile: "Google no entregó los datos mínimos para crear tu cuenta.",
  exchange_failed: "No pudimos conectarnos con Google. Revisa tu conexión e intenta otra vez.",
  account_disabled: "Tu cuenta está bloqueada. Contáctanos para ayudarte.",
};

function normalize(param: string | string[] | undefined) {
  if (Array.isArray(param)) return param[0];
  return param ?? null;
}

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const provider = normalize(searchParams.provider) ?? "";
  const code = normalize(searchParams.code) ?? "unknown";
  const rawMessage = normalize(searchParams.message);
  const message = rawMessage || ERROR_MESSAGES[code] || "No se pudo completar la autenticación. Intenta nuevamente.";

  const title = provider === "google" ? "Error con Google" : "Error de autenticación";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p className="text-slate-300">{message}</p>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 font-medium text-white hover:bg-emerald-600"
          >
            Volver al inicio
          </Link>
          <Link
            href="/ayuda"
            className="inline-flex items-center justify-center rounded-lg border border-white/20 px-4 py-2 font-medium text-white/80 hover:bg-white/10"
          >
            Necesito ayuda
          </Link>
        </div>
      </div>
    </div>
  );
}
