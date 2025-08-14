"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X as CloseIcon } from "lucide-react";
import { comunasRM } from "@/lib/comunas-rm";

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
          setError(data.error || "Error al iniciar sesión");
          setToast({ type: "error", message: data.error || "Error al iniciar sesión" });
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

        const response = await fetch("/api/auth/local/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            email, 
            password, 
            name, 
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
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out transition-opacity" />
				<Dialog.Content
          className="fixed inset-0 flex items-center justify-center p-4"
				>
          <div className="sm:max-w-md w-[92vw] max-w-md p-6 bg-white shadow-2xl sm:rounded-2xl rounded-none max-h-[90vh] overflow-auto focus:outline-none animate-[fadeIn_150ms_ease-out]">
					<div className="flex items-center justify-between mb-4">
						<Dialog.Title className="text-lg font-semibold">
							{tab === "login" ? "Iniciar sesión" : "Crear cuenta"}
						</Dialog.Title>
						<Dialog.Close asChild>
							<button aria-label="Cerrar" className="p-2 rounded-lg hover:bg-gray-100">
								<CloseIcon className="w-5 h-5" />
							</button>
						</Dialog.Close>
					</div>

					<div className="flex mb-4 rounded-lg overflow-hidden border">
						<button
							onClick={() => setTab("login")}
							className={`flex-1 px-4 py-2 text-sm font-medium ${tab === "login" ? "bg-gray-100" : ""}`}
						>
							Iniciar sesión
						</button>
						<button
							onClick={() => setTab("signup")}
							className={`flex-1 px-4 py-2 text-sm font-medium ${tab === "signup" ? "bg-gray-100" : ""}`}
						>
							Crear cuenta
						</button>
					</div>

						<form onSubmit={onSubmit} className="space-y-4">
						<div>
							<label className="block text-sm font-medium mb-1">Correo electrónico</label>
              <input ref={emailRef} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" placeholder="tu@email.com" autoFocus />
						</div>
						{tab === "signup" && (
							<>
								<div>
									<label className="block text-sm font-medium mb-1">Nombre</label>
									<input value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" placeholder="Tu nombre" />
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">Comuna</label>
									<select value={comuna} onChange={(e) => setComuna(e.target.value)} required className="w-full px-3 py-2 border rounded-lg">
										<option value="">Selecciona tu comuna</option>
										{comunasRM.map((c) => (
											<option key={c} value={c}>{c}</option>
										))}
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">Posición</label>
									<select value={position} onChange={(e) => setPosition(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
										<option value="">Selecciona tu posición (opcional)</option>
										<option value="ARQUERO">Arquero</option>
										<option value="DEFENSA">Defensa</option>
										<option value="LATERAL">Lateral</option>
										<option value="VOLANTE">Volante</option>
										<option value="DELANTERO">Delantero</option>
									</select>
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
            <button type="submit" disabled={loading} className="w-full px-4 py-2 bg-black text-white rounded-lg">
							{loading ? "Procesando..." : tab === "login" ? "Iniciar sesión" : "Crear cuenta"}
						</button>
					</form>
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


