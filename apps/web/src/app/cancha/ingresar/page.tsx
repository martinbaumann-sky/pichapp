"use client";

import { useState } from "react";
import Link from "next/link";

export default function CanchaLoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const payload = Object.fromEntries(formData.entries());
      const response = await fetch("/api/venue/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error ?? "No pudimos iniciar sesión. Intenta nuevamente.");
      }

      window.location.href = "/panel/cancha";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Ingresar como cancha</h1>
          <p className="mt-2 text-sm text-gray-600">
            Accede al panel para administrar partidos, reservas y pagos.
          </p>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white shadow-lg p-6 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                placeholder="cancha@club.cl"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                placeholder="••••••••"
              />
              <div className="mt-2 text-right">
                <a href="mailto:soporte@pichangapp.cl" className="text-xs font-medium text-gray-500 hover:text-gray-700">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Ingresando…" : "Ingresar"}
            </button>
          </form>

          <div className="mt-8 border-t border-dashed border-gray-200 pt-6 text-sm text-gray-600">
            ¿Aún no tienes cuenta? {" "}
            <Link href="/cancha/registro" className="font-semibold text-gray-900 hover:underline">
              Registra tu cancha
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
