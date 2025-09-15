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
  position: string;
  setPosition: (v: string) => void;
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
  position,
  setPosition,
  showPassword,
  setShowPassword,
  loading,
  error,
  onSubmit,
  onForgotPassword,
}: Props) {
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

        <form onSubmit={onSubmit} autoComplete="off" className="space-y-4">
          {tab === "signup" && (
            <div className="grid grid-cols-2 gap-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" className="input-field bg-white/5 text-white" />
              <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Posición (opcional)" className="input-field bg-white/5 text-white" />
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


