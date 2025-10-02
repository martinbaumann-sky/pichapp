"use client";

import React from "react";
import { Mail, Eye, EyeOff } from "lucide-react";

type Props = {
  tab: "login" | "signup";
  setTab: (t: "login" | "signup") => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  comuna: string;
  setComuna: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onForgotPassword?: () => void;
};

export default function AuthCard({
  tab,
  setTab,
  email,
  setEmail,
  password,
  setPassword,
  name,
  setName,
  comuna,
  setComuna,
  showPassword,
  setShowPassword,
  loading,
  error,
  onSubmit,
  onForgotPassword,
}: Props) {
  const googleUrl = React.useMemo(() => "/api/auth/oauth/google/start", []);

  return (
    <div className="w-full">
      <div className="bg-white/6 backdrop-blur-md border border-white/8 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex bg-white/10 rounded-full p-1">
            <button
              onClick={() => setTab("signup")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                tab === "signup" ? "bg-white/20 text-white shadow" : "text-white/70 hover:bg-white/5"
              }`}
            >
              Crear cuenta
            </button>
            <button
              onClick={() => setTab("login")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                tab === "login" ? "bg-white/20 text-white shadow" : "text-white/70 hover:bg-white/5"
              }`}
            >
              Iniciar sesión
            </button>
          </div>
        </div>

        <h3 className="text-2xl font-semibold text-white mb-4">{tab === "signup" ? "Comienza tu Pichanga" : "Bienvenido de nuevo"}</h3>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => {
              window.location.href = googleUrl;
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white text-slate-900 px-4 py-3 font-medium shadow-md hover:bg-white/90 transition"
          >
            <GoogleIcon className="h-5 w-5" />
            Continuar con Google
          </button>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/60">
            <span className="flex-1 h-px bg-white/10" />
            <span>o usa tu correo</span>
            <span className="flex-1 h-px bg-white/10" />
          </div>
        </div>

        <form onSubmit={onSubmit} autoComplete="off" className="space-y-4 mt-4">
          {tab === "signup" && (
            <div className="grid grid-cols-1 gap-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" className="input-field bg-white/5 text-white" />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo electrónico" required className="input-field pl-12 bg-white/5 text-white" />
          </div>

          <div className="relative">
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" required className="input-field pr-12 bg-white/5 text-white" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60">
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {tab === "signup" && (
            <div>
              <label className="text-sm text-white/70 mb-1 block">Comuna</label>
              <select value={comuna} onChange={(e) => setComuna(e.target.value)} className="input-field bg-white/5 text-white">
                <option value="">Selecciona tu comuna</option>
                <option value="Santiago">Santiago</option>
                <option value="Providencia">Providencia</option>
                <option value="Las Condes">Las Condes</option>
              </select>
            </div>
          )}

          {error && <div className="text-sm text-red-400">{error}</div>}

          <div className="grid gap-3">
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Procesando..." : tab === "signup" ? "Crear cuenta" : "Iniciar sesión"}
            </button>
            {tab === "login" && (
              <button type="button" onClick={onForgotPassword} className="text-sm text-white/70">¿Olvidaste tu contraseña?</button>
            )}
          </div>
        </form>
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


