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
  const [step, setStep] = React.useState(0);
  const [phone, setPhone] = React.useState("+569");
  const [smsSent, setSmsSent] = React.useState(false);
  const [smsCode, setSmsCode] = React.useState("");
  const [devCode, setDevCode] = React.useState<string | null>(null);
  const [localLoading, setLocalLoading] = React.useState(false);
  const [gender, setGender] = React.useState<string | null>(null);
  const [birthday, setBirthday] = React.useState<string | null>(null);

  const sendSms = async () => {
    try {
      setLocalLoading(true);
      const r = await fetch("/api/auth/send-sms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.error || "Error enviando SMS");
      setSmsSent(true);
      // Mostrar código en UI si el endpoint lo retorna (modo dev)
      if (d?.dev && d?.code) {
        setDevCode(String(d.code));
      }
      setStep(1);
    } catch (e) {
      alert("No se pudo enviar el código");
    } finally {
      setLocalLoading(false);
    }
  };

  const verifySms = async () => {
    try {
      setLocalLoading(true);
      const r = await fetch("/api/auth/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, code: smsCode }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw new Error(d?.error || "Código inválido");
      // Si el endpoint indica que el usuario necesita completar perfil, mostrar pasos de signup
      if (d?.needsSignup) {
        // Asegurar que el nombre mínimo venga en user
        if (d?.user?.name) {
          try { setName(d.user.name); } catch {}
        }
        setStep(2);
        return;
      }
      // Si el endpoint devolvió usuario (login completo)
      if (d?.user) {
        onClose && onClose();
        if (next) {
          window.location.href = next;
        } else {
          window.location.reload();
        }
        return;
      }
      // Fallback: avanzar al siguiente paso
      setStep(2);
    } catch (e: any) {
      alert(e.message || "Código inválido");
    } finally {
      setLocalLoading(false);
    }
  };

  const finishSignup = async () => {
    try {
      setLocalLoading(true);
      // Llamar al endpoint de signup con todos los datos
      const payload: any = {
        email,
        password,
        name,
        lastName,
        comuna,
        position,
        phone,
        birthday: birthday || null,
        gender: gender || null,
      };
      const r = await fetch("/api/auth/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error al crear cuenta");
      // Cerrar modal y redirigir si corresponde
      onClose && onClose();
      if (next) {
        window.location.href = next;
      } else {
        window.location.reload();
      }
    } catch (e: any) {
      alert(e.message || "Error al crear cuenta");
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-3xl p-6" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="absolute -inset-1 blur-lg opacity-30 pointer-events-none" style={{ background: 'linear-gradient(90deg, rgba(6,182,212,0.08), rgba(11,143,61,0.06))' }} />
        <div className="relative z-10">
          {/* Back button */}
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
            {/* Phone-based flow used for both login and signup: start with phone -> code -> optional signup steps */}
            {step === 0 && (
              <div className="space-y-3">
                <label className="text-sm text-white/80">Celular</label>
                <div className="flex gap-2">
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field bg-white text-black" />
                  <button disabled={localLoading || !phone} onClick={sendSms} className="btn-primary">Verificar</button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                <label className="text-sm text-white/80">Código de verificación</label>
                <input value={smsCode} onChange={(e) => setSmsCode(e.target.value)} placeholder="123456" className="input-field bg-white text-black" />
                <div className="flex justify-between">
                  <button onClick={() => setStep(0)} className="text-sm text-white/70">Atrás</button>
                  <button disabled={localLoading || !smsCode} onClick={verifySms} className="btn-primary">Continuar</button>
                </div>
              </div>
            )}

            {/* Si el código no corresponde a un usuario existente, continuar con la creación (pasos 2..4) */}
            {step === 2 && (
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

                <div className="flex justify-between">
                  <button onClick={() => setStep(1)} className="text-sm text-white/70">Atrás</button>
                  <button disabled={!name || !lastName || !comuna || !position} onClick={() => setStep(3)} className="btn-primary">Continuar</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <label className="text-sm text-white/80">Correo y contraseña (opcional)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo electrónico (opcional)" className="input-field pl-12 bg-white text-black" />
                </div>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña (opcional)" className="input-field pr-12 bg-white text-black" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="flex justify-between">
                  <button onClick={() => setStep(2)} className="text-sm text-white/70">Atrás</button>
                  <button disabled={localLoading} onClick={finishSignup} className="btn-primary">Crear cuenta</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


