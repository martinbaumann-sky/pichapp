"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X as CloseIcon } from "lucide-react";
import { comunasRM } from "@/lib/comunas-rm";
import FrostedAuthCard from "./FrostedAuthCard";

type AuthTab = "login" | "signup";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialTab?: AuthTab;
  next?: string;
};

export default function AuthDialog({ open, onOpenChange, initialTab, next }: Props) {
	let queryTab: AuthTab | null = null;
	if (typeof window !== "undefined") {
		const qp = new URLSearchParams(window.location.search).get("auth");
		queryTab = qp === "signup" ? "signup" : qp === "signin" ? "login" : null;
	}
	const [tab, setTab] = useState<AuthTab>(initialTab ?? "login");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [lastName, setLastName] = useState("");
	const [comuna, setComuna] = useState("");
	const [position, setPosition] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

	useEffect(() => {
		if (open && (queryTab || initialTab)) {
			setTab((queryTab ?? initialTab) as AuthTab);
		}
		if (open) {
      console.log("[AUTH] AuthDialog opened - usando autenticación local");
      setTimeout(() => emailRef.current?.focus(), 0);
		}
  }, [open, queryTab, initialTab]);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);
    try {
      if (tab === "login") {
        console.log("[AUTH] signin click", { email });
        
        const response = await fetch("/api/auth/local/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        console.log("[AUTH] signin result", data);

        if (!response.ok) {
          setError(data.error || "Correo o contraseña inválidos");
          setToast({ type: "error", message: data.error || "Correo o contraseña inválidos" });
          return;
        }

        onOpenChange(false);
        setToast({ type: "success", message: "Sesión iniciada exitosamente" });
        if (next) {
          router.push(next);
        } else {
          // Forzar recarga para que los client components (Header/useAuth) tomen la nueva sesión
          window.location.reload();
        }
      } else {
        console.log("[AUTH] signup click", { email, name, comuna, position });
        
        if (!name) {
          setError("Ingresa tu nombre");
          return;
        }

        if (!comuna) {
          setError("Selecciona tu comuna");
          return;
        }

        // Convertir posición a mayúsculas para el enum
        const normalizedPosition = position ? position.toUpperCase() : null;

        // Nota: el campo Apellido se maneja en el formulario principal (AuthDialog simplificado aquí).
        const response = await fetch("/api/auth/local/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            email, 
            password, 
            name, 
            lastName,
            comuna, 
            position: normalizedPosition 
          })
        });

        const data = await response.json();
        console.log("[AUTH] signup result", data);

        if (!response.ok) {
          setError(data.error || "Error al crear cuenta");
          setToast({ type: "error", message: data.error || "Error al crear cuenta" });
          return;
        }

        onOpenChange(false);
        setToast({ type: "success", message: "Cuenta creada exitosamente" });
        if (next) {
          router.push(next);
        } else {
          window.location.reload();
        }
      }
    } catch (err: any) {
      console.error("[AUTH] submit error", err);
      setError(err?.message ?? "Error de autenticación");
      setToast({ type: "error", message: err?.message ?? "Error de autenticación" });
    } finally {
			setLoading(false);
		}
	};

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
                <Dialog.Overlay onClick={() => onOpenChange(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out transition-opacity z-50" />
				<Dialog.Content
          className="fixed inset-0 flex items-center justify-center p-4 z-[60]"
				>
          <div className="sm:max-w-md w-[92vw] max-w-md p-6 bg-transparent sm:rounded-2xl rounded-none max-h-[90vh] overflow-auto focus:outline-none animate-[fadeIn_150ms_ease-out]">
            <Dialog.Title className="sr-only">{tab === "login" ? "Iniciar sesión" : "Crear cuenta"}</Dialog.Title>
            <FrostedAuthCard
              tab={tab}
              setTab={(t) => setTab(t)}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              name={name}
              setName={setName}
              lastName={lastName}
              setLastName={setLastName}
              comuna={comuna}
              setComuna={setComuna}
              position={position}
              setPosition={setPosition}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              loading={loading}
              error={error}
              onSubmit={onSubmit}
              onForgotPassword={() => {}}
              onClose={() => onOpenChange(false)}
            />
          </div>
				</Dialog.Content>
			</Dialog.Portal>
      {toast && (
        <div className={`fixed top-4 right-4 z-[60] px-4 py-2 rounded-lg shadow-lg text-white ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {toast.message}
        </div>
      )}
		</Dialog.Root>
	);
}


