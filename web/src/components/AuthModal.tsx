"use client";

import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase";

type Props = { open: boolean; onClose: () => void; initialTab?: "login" | "signup" };

export default function AuthModal({ open, onClose, initialTab }: Props) {
  const [tab, setTab] = useState<"login" | "signup">(initialTab ?? "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [comuna, setComuna] = useState("");
  const [position, setPosition] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = getBrowserSupabase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setError(null);
    setLoading(true);
    try {
      if (tab === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.session) {
          setError("Correo o contraseña inválidos");
          return;
        }
        onClose();
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name, comuna, position } } });
        if (error) {
          setError(error.message);
          return;
        }
        if (data.user) {
          await fetch("/api/profile/init", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, comuna, position }) });
        }
        if (data.session === null) {
          // Email confirmation ON
          setError("Cuenta creada. Revisa tu correo para confirmar antes de iniciar sesión.");
          return;
        }
        onClose();
      }
    } catch (err: any) {
      setError(err?.message ?? "Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="flex">
          <button onClick={() => setTab("login")} className={`flex-1 px-4 py-3 text-sm font-medium ${tab === "login" ? "bg-gray-100" : ""}`}>Iniciar sesión</button>
          <button onClick={() => setTab("signup")} className={`flex-1 px-4 py-3 text-sm font-medium ${tab === "signup" ? "bg-gray-100" : ""}`}>Crear cuenta</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-auto">
          <div>
            <label className="block text-sm font-medium mb-1">Correo electrónico</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" placeholder="tu@email.com" />
          </div>
          {tab === "signup" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="Tu nombre" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Comuna</label>
                <input value={comuna} onChange={(e) => setComuna(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="Tu comuna" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Posición</label>
                <input value={position} onChange={(e) => setPosition(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="Tu posición (opcional)" />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 border rounded-lg pr-10" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute inset-y-0 right-2 text-sm text-gray-600">
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button disabled={loading} className="w-full px-4 py-2 bg-black text-white rounded-lg">
            {loading ? "Procesando..." : tab === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </button>
          
          <button type="button" onClick={onClose} className="w-full px-4 py-2 text-sm text-gray-500">Cerrar</button>
        </form>
      </div>
    </div>
  );
}


