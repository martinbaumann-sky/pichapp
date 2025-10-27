"use client";

import React from "react";
import { Mail, Eye, EyeOff, ChevronLeft, AlertTriangle } from "lucide-react";
import { comunasRM } from "@/lib/comunas-rm";

type AuthPhase = "auth" | "verify" | "suspended";

type Props = {
  tab: "login" | "signup";
  setTab: (t: "login" | "signup") => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  comuna: string;
  setComuna: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  onClose?: () => void;
  next?: string;
  isOpen: boolean;
};

export default function FrostedAuthCard({
  tab,
  setTab,
  email,
  setEmail,
  password,
  setPassword,
  name,
  setName,
  lastName,
  setLastName,
  comuna,
  setComuna,
  showPassword,
  setShowPassword,
  onClose,
  next,
  isOpen,
}: Props) {
  const [localLoading, setLocalLoading] = React.useState(false);
  const [phone, setPhone] = React.useState("");
  const [phase, setPhase] = React.useState<AuthPhase>("auth");
  const [pendingEmail, setPendingEmail] = React.useState<string | null>(null);
  const [verifyCode, setVerifyCode] = React.useState("");
  const [verifyLoading, setVerifyLoading] = React.useState(false);
  const [verificationError, setVerificationError] = React.useState<string | null>(null);
  const [resendMessage, setResendMessage] = React.useState<string | null>(null);
  const [resendLoading, setResendLoading] = React.useState(false);
  const [lastExpiresAt, setLastExpiresAt] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [oauthHints, setOauthHints] = React.useState<string[] | null>(null);
  const [suspendedEmail, setSuspendedEmail] = React.useState<string | null>(null);
  const [suspensionMessage, setSuspensionMessage] = React.useState<string | null>(null);

  const loginEmailRef = React.useRef<HTMLInputElement>(null);
  const loginPasswordRef = React.useRef<HTMLInputElement>(null);
  const signupNameRef = React.useRef<HTMLInputElement>(null);
  const signupLastNameRef = React.useRef<HTMLInputElement>(null);
  const signupPhoneRef = React.useRef<HTMLInputElement>(null);
  const signupEmailRef = React.useRef<HTMLInputElement>(null);
  const signupPasswordRef = React.useRef<HTMLInputElement>(null);
  const verifyCodeRef = React.useRef<HTMLInputElement>(null);

  const focusField = React.useCallback((input: HTMLInputElement | null, opts?: { selectAll?: boolean }) => {
    if (!input) return false;
    if (input.readOnly) {
      input.readOnly = false;
    }
    try {
      input.focus({ preventScroll: true });
    } catch {
      input.focus();
    }
    try {
      if (opts?.selectAll) {
        input.select?.();
      } else {
        const length = input.value.length;
        input.setSelectionRange?.(length, length);
      }
    } catch {}
    return document.activeElement === input;
  }, []);

  const ensureKeyboard = React.useCallback(() => {
    if (!isOpen || phase !== "auth") return;

    const focusInOrder = (inputs: HTMLInputElement[]) => {
      if (inputs.length === 0) return;
      const empty = inputs.find((input) => !input.value.trim());
      const ordered = empty ? [empty, ...inputs.filter((i) => i !== empty)] : inputs;
      for (const input of ordered) {
        if (focusField(input)) break;
      }
    };

    if (tab === "login") {
      const inputs = [loginEmailRef.current, loginPasswordRef.current].filter(Boolean) as HTMLInputElement[];
      focusInOrder(inputs);
    } else {
      const inputs = [
        signupNameRef.current,
        signupLastNameRef.current,
        signupPhoneRef.current,
        signupEmailRef.current,
        signupPasswordRef.current,
      ].filter(Boolean) as HTMLInputElement[];
      focusInOrder(inputs);
    }
  }, [focusField, isOpen, phase, tab]);

  React.useEffect(() => {
    if (!isOpen || phase !== "auth") return;
    const handle = window.setTimeout(() => {
      ensureKeyboard();
    }, 120);
    return () => window.clearTimeout(handle);
  }, [ensureKeyboard, isOpen, phase, tab]);

  React.useEffect(() => {
    if (!isOpen || phase !== "verify") return;
    const handle = window.setTimeout(() => {
      focusField(verifyCodeRef.current, { selectAll: true });
    }, 120);
    return () => window.clearTimeout(handle);
  }, [focusField, isOpen, phase]);
  const resetVerificationState = React.useCallback(() => {
    setPhase("auth");
    setPendingEmail(null);
    setVerifyCode("");
    setVerificationError(null);
    setResendMessage(null);
    setResendLoading(false);
    setLastExpiresAt(null);
  }, []);

  const resetSuspendedState = React.useCallback(() => {
    setSuspendedEmail(null);
    setSuspensionMessage(null);
    if (phase === "suspended") {
      setPhase("auth");
    }
  }, [phase]);

  React.useEffect(() => {
    setOauthHints(null);
  }, [email, tab, phase]);

  React.useEffect(() => {
    if (!isOpen) {
      resetVerificationState();
      resetSuspendedState();
    }
  }, [isOpen, resetSuspendedState, resetVerificationState]);

  React.useEffect(() => {
    if (phase === "verify" && !pendingEmail) {
      resetVerificationState();
    }
  }, [phase, pendingEmail, resetVerificationState]);

  const beginVerification = React.useCallback(
    (targetEmail: string, expiresAt?: string | null) => {
      setPendingEmail(targetEmail);
      setPhase("verify");
      setVerifyCode("");
      setVerificationError(null);
      setResendMessage(null);
      if (expiresAt) {
        setLastExpiresAt(expiresAt);
      }
    },
    []
  );

  const navigateAfterAuth = React.useCallback(() => {
    if (onClose) onClose();
    if (next) {
      window.location.href = next;
    } else {
      window.location.reload();
    }
  }, [next, onClose]);

  const googleUrl = React.useMemo(() => {
    const params = new URLSearchParams();
    if (next) params.set("next", next);
    return `/api/auth/oauth/google/start${params.toString() ? `?${params.toString()}` : ""}`;
  }, [next]);

  const handleGoogleAuth = React.useCallback(() => {
    window.location.href = googleUrl;
  }, [googleUrl]);

  const doSignup = async () => {
    try {
      setLocalLoading(true);
      setVerificationError(null);
      setResendMessage(null);
      setFormError(null);
      const payload: Record<string, unknown> = { email, password, name, lastName, comuna, phone };
      const r = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (r.status === 409) {
          setTab("login");
          setFormError("Ya tienes una cuenta con este correo. Inicia sesión para continuar.");
          return;
        }
        throw new Error(d?.error || "Error al crear cuenta");
      }
      if (d?.requiresVerification) {
        beginVerification(email, d?.expiresAt);
        return;
      }
      navigateAfterAuth();
    } catch (e: any) {
      setFormError(e?.message || "No se pudo crear la cuenta");
    } finally {
      setLocalLoading(false);
    }
  };

  const doLogin = async () => {
    try {
      setLocalLoading(true);
      setVerificationError(null);
      setResendMessage(null);
      setFormError(null);
      setOauthHints(null);
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (d?.requiresVerification && d?.email) {
          beginVerification(d.email as string, d?.expiresAt);
          setVerificationError(d?.error || "Debes verificar tu correo para continuar.");
          return;
        }
        if (d?.requiresOAuth) {
          if (Array.isArray(d?.providers)) {
            setOauthHints(d.providers as string[]);
          }
          setFormError(d?.error || "Tu cuenta fue creada con Google. Usa \"Continuar con Google\".");
          return;
        }
        if (r.status === 403 && typeof d?.error === "string") {
          setSuspendedEmail(email);
          setSuspensionMessage(d.error);
          setPhase("suspended");
          return;
        }
        throw new Error(d?.error || "Credenciales inválidas");
      }
      navigateAfterAuth();
    } catch (e: any) {
      setFormError(e?.message || "Credenciales inválidas");
    } finally {
      setLocalLoading(false);
    }
  };


  const handleVerify = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!pendingEmail) return;
    if (!verifyCode.trim()) {
      setVerificationError("Ingresa el código que recibiste por correo");
      return;
    }
    try {
      setVerifyLoading(true);
      setVerificationError(null);
      const r = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, code: verifyCode.trim() }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setVerificationError(d?.error || "Código inválido");
        return;
      }
      navigateAfterAuth();
    } catch (e: any) {
      setVerificationError(e?.message || "No se pudo verificar el código");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResend = async () => {
    if (!pendingEmail) return;
    try {
      setResendLoading(true);
      setVerificationError(null);
      const r = await fetch("/api/auth/verification/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setVerificationError(d?.error || "No se pudo reenviar el código");
        return;
      }
      setResendMessage(`Enviamos un nuevo código a ${pendingEmail}.`);
      if (d?.expiresAt) {
        setLastExpiresAt(d.expiresAt as string);
      }
    } catch (e: any) {
      setVerificationError(e?.message || "No se pudo reenviar el código");
    } finally {
      setResendLoading(false);
    }
  };

  const minutesLeft = React.useMemo(() => {
    if (!lastExpiresAt) return null;
    const ms = new Date(lastExpiresAt).getTime() - Date.now();
    if (Number.isNaN(ms) || ms <= 0) return null;
    return Math.max(1, Math.round(ms / 60000));
  }, [lastExpiresAt]);

  const verifyView = phase === "verify" && pendingEmail ? (
    <div className="w-full">
      <div
        className="relative overflow-hidden rounded-3xl p-6"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          className="absolute -inset-1 blur-lg opacity-30 pointer-events-none"
          style={{ background: "linear-gradient(90deg, rgba(6,182,212,0.08), rgba(11,143,61,0.06))" }}
        />
        <div className="relative z-10 space-y-5 text-white">
          <button
            type="button"
            onClick={resetVerificationState}
            className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" /> Volver
          </button>

          <div className="space-y-2">
            <h3 className="text-2xl font-semibold">Verifica tu correo</h3>
            <p className="text-white/80">
              Enviamos un código a <span className="font-semibold">{pendingEmail}</span>. Ingresa los 6 dígitos para confirmar tu cuenta.
            </p>
            {minutesLeft && (
              <p className="text-xs text-white/60">El código vence en aproximadamente {minutesLeft} minuto{minutesLeft === 1 ? "" : "s"}.</p>
            )}
            {resendMessage && <div className="text-xs text-emerald-200">{resendMessage}</div>}
            {verificationError && <div className="text-xs text-red-200">{verificationError}</div>}
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              ref={verifyCodeRef}
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="Ingresa el código"
              className="input-field bg-white text-black text-center tracking-[0.6em] text-lg"
            />
            <button
              type="submit"
              disabled={verifyLoading || verifyCode.length < 4}
              className="btn-primary w-full"
            >
              {verifyLoading ? "Verificando..." : "Confirmar código"}
            </button>
          </form>

          <div className="flex flex-col gap-2 text-sm text-white/80">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              className="underline underline-offset-4 decoration-white/30 hover:decoration-white"
            >
              {resendLoading ? "Enviando..." : "Reenviar código"}
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("signup");
                resetVerificationState();
              }}
              className="underline underline-offset-4 decoration-white/30 hover:decoration-white"
            >
              Usar otro correo
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  const suspendedView = phase === "suspended" ? (
    <div className="w-full">
      <div
        className="relative overflow-hidden rounded-3xl p-6"
        style={{
          background: "linear-gradient(135deg, rgba(248,113,113,0.16), rgba(248,113,113,0.05))",
          border: "1px solid rgba(248,113,113,0.2)",
        }}
      >
        <div className="absolute -inset-1 blur-lg opacity-30 pointer-events-none" style={{ background: "linear-gradient(90deg, rgba(248,113,113,0.12), rgba(239,68,68,0.16))" }} />
        <div className="relative z-10 space-y-5 text-white">
          <button
            type="button"
            onClick={() => {
              resetSuspendedState();
              setFormError(null);
            }}
            className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" /> Volver al inicio
          </button>
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              <AlertTriangle className="h-4 w-4" /> Cuenta suspendida
            </div>
            <h3 className="text-2xl font-semibold">No pudimos habilitar tu acceso</h3>
            <p className="text-white/80">
              {suspensionMessage ?? "Tu cuenta está temporalmente suspendida por el equipo administrador."}
            </p>
            {suspendedEmail ? (
              <p className="text-xs text-white/60">Correo asociado: {suspendedEmail}</p>
            ) : null}
            <p className="text-xs text-white/60">
              Si crees que se trata de un error, escríbenos a <a href="mailto:contacto@pichangapp.cl" className="underline">contacto@pichangapp.cl</a> o comunícate con soporte interno.
            </p>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  if (suspendedView) {
    return suspendedView;
  }

  if (verifyView) {
    return verifyView;
  }

  return (
    <div className="w-full">
      <div
        className="relative overflow-hidden rounded-3xl p-6"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          className="absolute -inset-1 blur-lg opacity-30 pointer-events-none"
          style={{ background: "linear-gradient(90deg, rgba(6,182,212,0.08), rgba(11,143,61,0.06))" }}
        />
        <div className="relative z-10">
          <div className="mb-3">
            <button type="button" onClick={onClose} className="p-2 rounded-md bg-white/10 hover:bg-white/20 text-white">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex bg-white/8 rounded-full p-1">
              <button
                onClick={() => {
                  setFormError(null);
                  setTab("signup");
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  tab === "signup" ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/5"
                }`}
              >
                Crear cuenta
              </button>
              <button
                onClick={() => {
                  setFormError(null);
                  setTab("login");
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  tab === "login" ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/5"
                }`}
              >
                Iniciar sesión
              </button>
            </div>
          </div>

              <h3 className="text-2xl font-semibold text-white mb-3">{tab === "signup" ? "Únete a PichangApp" : "Bienvenido"}</h3>

          {formError ? (
            <div className="mb-4 rounded-2xl border border-red-200/70 bg-red-50/90 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
              {formError}
            </div>
          ) : null}

          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleAuth}
              className={`w-full inline-flex items-center justify-center gap-3 rounded-xl bg-white text-slate-900 px-4 py-3 font-medium shadow-lg shadow-emerald-900/20 hover:bg-white/90 transition ${
                oauthHints?.includes("google")
                  ? "ring-2 ring-cyan-300 ring-offset-2 ring-offset-slate-900"
                  : ""
              }`}
            >
              <GoogleIcon className="h-5 w-5" />
              Continuar con Google
            </button>
            {oauthHints?.includes("google") ? (
              <p className="text-xs text-cyan-100 text-center">
                Usa el botón “Continuar con Google” para entrar a tu cuenta.
              </p>
            ) : null}
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-white/50">
              <span className="flex-1 h-px bg-white/10" />
              <span>o usa tu correo</span>
              <span className="flex-1 h-px bg-white/10" />
            </div>
            {tab === "login" && (
              <div className="space-y-3">
                <label className="text-sm text-white/80">Correo</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="signup_email"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    readOnly
                    onFocus={(e) => {
                      e.currentTarget.readOnly = false;
                    }}
                    ref={loginEmailRef}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="input-field pl-12 bg-white text-black input-mobile"
                  />
                </div>
                <label className="text-sm text-white/80">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="new-password"
                    autoComplete="new-password"
                    readOnly
                    onFocus={(e) => {
                      e.currentTarget.readOnly = false;
                    }}
                    ref={loginPasswordRef}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    className="input-field pr-12 bg-white text-black input-mobile"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <button
                  disabled={localLoading || !email || !password}
                  onClick={doLogin}
                  className="btn-primary w-full"
                >
                  {localLoading ? "Procesando..." : "Iniciar sesión"}
                </button>
              </div>
            )}

            {tab === "signup" && (
              <div className="space-y-3">
                <label className="text-sm text-white/80">Nombre y Apellido</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    ref={signupNameRef}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre"
                    className="input-field bg-white text-black input-mobile"
                  />
                  <input
                    ref={signupLastNameRef}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Apellido"
                    className="input-field bg-white text-black input-mobile"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/80">Comuna</label>
                  <select
                    value={comuna}
                    onChange={(e) => setComuna(e.target.value)}
                    className="input-field bg-white text-black input-mobile"
                  >
                    <option value="">Selecciona tu comuna</option>
                    {comunasRM.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-sm text-white/80">Celular</label>
                  <input
                    ref={signupPhoneRef}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+569..."
                    className="input-field bg-white text-black input-mobile"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="signup_email"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    readOnly
                    onFocus={(e) => {
                      e.currentTarget.readOnly = false;
                    }}
                    ref={signupEmailRef}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="input-field pl-12 bg-white text-black input-mobile"
                  />
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="new-password"
                    autoComplete="new-password"
                    readOnly
                    onFocus={(e) => {
                      e.currentTarget.readOnly = false;
                    }}
                    ref={signupPasswordRef}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Crea una contraseña"
                    className="input-field pr-12 bg-white text-black input-mobile"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <button
                  disabled={localLoading || !name || !comuna || !email || !password}
                  onClick={doSignup}
                  className="btn-primary w-full"
                >
                  {localLoading ? "Procesando..." : "Crear cuenta"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="#EA4335"
        d="M12 11.988v3.912h5.458c-.24 1.248-.96 2.304-2.048 3.024l3.296 2.544C20.587 19.535 22 16.94 22 13.5c0-.744-.067-1.458-.192-2.144H12z"
      />
      <path fill="#34A853" d="M5.304 14.296a6.01 6.01 0 0 1 0-4.608L1.848 6.976C.984 8.66.5 10.524.5 12.5s.484 3.84 1.348 5.524z" />
      <path
        fill="#4285F4"
        d="M12 4.708c1.62 0 3.066.56 4.212 1.656l3.154-3.154C17.652 1.62 15.26.5 12 .5 7.848.5 4.256 2.832 2.148 6.976l3.156 2.712C5.968 6.256 8.732 4.708 12 4.708z"
      />
      <path
        fill="#FBBC05"
        d="M12 20.292c-3.268 0-6.032-1.548-6.696-4.98L2.148 18.024C4.256 22.168 7.848 24.5 12 24.5c3.168 0 5.828-1.048 7.68-2.832l-3.27-2.544C15.053 19.512 13.62 20.292 12 20.292z"
      />
      <path fill="none" d="M.5.5h23v23H.5z" />
    </svg>
  );
}
