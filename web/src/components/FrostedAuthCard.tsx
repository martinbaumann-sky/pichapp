"use client";

import React from "react";
import { Mail, Eye, EyeOff, ChevronLeft } from "lucide-react";
import { comunasRM } from "@/lib/comunas-rm";

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
  position: string;
  setPosition: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  onClose?: () => void;
  next?: string;
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
  position,
  setPosition,
  showPassword,
  setShowPassword,
  onClose,
  next,
}: Props) {
  const [localLoading, setLocalLoading] = React.useState(false);
  const [phone, setPhone] = React.useState("");

  const doSignup = async () => {
    try {
      setLocalLoading(true);
      const payload: any = { email, password, name, lastName, comuna, position, phone };
      const r = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error || "Error al crear cuenta");
      onClose && onClose();
      if (next) {
        window.location.href = next;
      } else {
        window.location.reload();
      }
    } catch (e: any) {
      alert(e?.message || "No se pudo crear la cuenta");
    } finally {
      setLocalLoading(false);
    }
  };

  const doLogin = async () => {
    try {
      setLocalLoading(true);
      const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error || "Credenciales inválidas");
      onClose && onClose();
      if (next) {
        window.location.href = next;
      } else {
        window.location.reload();
      }
    } catch (e: any) {
      alert(e?.message || "Credenciales inválidas");
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-3xl p-6" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="absolute -inset-1 blur-lg opacity-30 pointer-events-none" style={{ background: 'linear-gradient(90deg, rgba(6,182,212,0.08), rgba(11,143,61,0.06))' }} />
        <div className="relative z-10">
          <div className="mb-3">
            <button type="button" onClick={onClose} className="p-2 rounded-md bg-white/10 hover:bg-white/20 text-white">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex bg-white/8 rounded-full p-1">
              <button onClick={() => setTab("signup")} className={`px-4 py-2 rounded-full text-sm font-medium transition ${tab === "signup" ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/5"}`}>Crear cuenta</button>
              <button onClick={() => setTab("login")} className={`px-4 py-2 rounded-full text-sm font-medium transition ${tab === "login" ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/5"}`}>Iniciar sesión</button>
            </div>
          </div>

          <h3 className="text-2xl font-semibold text-white mb-4">{tab === "signup" ? "Únete a PichangApp" : "Bienvenido"}</h3>

          <div className="space-y-4">
            {tab === "login" && (
              <div className="space-y-3">
                <label className="text-sm text-white/80">Correo</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" className="input-field pl-12 bg-white text-black" />
                </div>
                <label className="text-sm text-white/80">Contraseña</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input-field pr-12 bg-white text-black" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <button disabled={localLoading || !email || !password} onClick={doLogin} className="btn-primary w-full">Iniciar sesión</button>
              </div>
            )}

            {tab === "signup" && (
              <div className="space-y-3">
                <label className="text-sm text-white/80">Nombre y Apellido</label>
                <div className="grid grid-cols-2 gap-3">
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" className="input-field bg-white text-black" />
                  <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Apellido" className="input-field bg-white text-black" />
                </div>
                <div>
                  <label className="text-sm text-white/80">Comuna</label>
                  <select value={comuna} onChange={(e) => setComuna(e.target.value)} className="input-field bg-white text-black">
                    <option value="">Selecciona tu comuna</option>
                    {comunasRM.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-white/80">Posición</label>
                  <select value={position} onChange={(e) => setPosition(e.target.value)} className="input-field bg-white text-black">
                    <option value="">Selecciona tu posición</option>
                    <option value="ARQUERO">Arquero</option>
                    <option value="DEFENSA">Defensa</option>
                    <option value="LATERAL">Lateral</option>
                    <option value="VOLANTE">Volante</option>
                    <option value="DELANTERO">Delantero</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-white/80">Celular</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+569..." className="input-field bg-white text-black" />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" className="input-field pl-12 bg-white text-black" />
                </div>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Crea una contraseña" className="input-field pr-12 bg-white text-black" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <button disabled={localLoading || !name || !comuna || !position || !email || !password} onClick={doSignup} className="btn-primary w-full">Crear cuenta</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

