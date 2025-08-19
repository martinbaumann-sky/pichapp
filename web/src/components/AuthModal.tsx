"use client";

import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase";
import FrostedAuthCard from "./FrostedAuthCard";

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
      <div className="w-full max-w-md p-6">
        <div className="bg-transparent">
          <FrostedAuthCard
            tab={tab}
            setTab={(t) => setTab(t)}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            name={name}
            setName={setName}
            comuna={comuna}
            setComuna={setComuna}
            position={position}
            setPosition={setPosition}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            loading={loading}
            error={error}
            onSubmit={handleSubmit}
            onForgotPassword={() => {}}
          />
          <div className="mt-3">
            <button type="button" onClick={onClose} className="w-full px-4 py-2 text-sm text-gray-500">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}


