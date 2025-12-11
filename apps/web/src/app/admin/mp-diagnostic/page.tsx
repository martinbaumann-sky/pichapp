
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Settings,
  CreditCard,
  Database,
  Globe
} from "lucide-react";

type DiagnosticData = {
  environment: {
    MP_CLIENT_ID: boolean;
    MP_CLIENT_SECRET: boolean;
    MP_REDIRECT_URI: boolean;
    MP_WEBHOOK_URL: boolean;
    MP_WEBHOOK_SIGNATURE_SECRET: boolean;
    MP_ACCESS_TOKEN: boolean;
    MP_USE_SANDBOX: boolean;
  };
  venues: {
    total: number;
    withMpConnection: number;
    withValidTokens: number;
    withExpiredTokens: number;
    details: Array<{
      id: string;
      name: string;
      hasAccessToken: boolean;
      hasRefreshToken: boolean;
      hasExpiredToken: boolean;
      hasValidConnection: boolean;
      mpUserId: string | null;
      mpCollectorId: string | null;
      mpAccountType: string | null;
      paymentProvider: string | null;
      plan: string;
      verified: boolean;
    }>;
  };
  recommendations: string[];
};

export default function MpDiagnosticPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DiagnosticData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || (!user.isAdmin && (user.role as string) !== "SUPERADMIN")) {
      router.replace("/");
      return;
    }
    fetchDiagnostics();
  }, [authLoading, user, router]);

  const fetchDiagnostics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/mp-diagnostic");
      if (!res.ok) {
        throw new Error("Error al obtener diagnósticos");
      }
      const diagnostics = await res.json();
      setData(diagnostics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-600" />
          <p className="text-gray-600">Cargando diagnósticos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDiagnostics}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const envItems = [
    { key: "MP_CLIENT_ID", label: "Client ID", icon: Settings },
    { key: "MP_CLIENT_SECRET", label: "Client Secret", icon: Settings },
    { key: "MP_REDIRECT_URI", label: "Redirect URI", icon: Globe },
    { key: "MP_WEBHOOK_URL", label: "Webhook URL", icon: Globe },
    { key: "MP_WEBHOOK_SIGNATURE_SECRET", label: "Webhook Secret", icon: Settings },
    { key: "MP_ACCESS_TOKEN", label: "Access Token", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Diagnóstico de Mercado Pago
          </h1>
          <p className="text-gray-600">
            Verifica la configuración y estado de las conexiones con Mercado Pago
          </p>
        </div>

        {/* Variables de Entorno */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Database className="h-5 w-5" />
            Variables de Entorno
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {envItems.map((item) => {
              const Icon = item.icon;
              const isConfigured = data.environment[item.key as keyof typeof data.environment];
              return (
                <div
                  key={item.key}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${isConfigured
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                    }`}
                >
                  <Icon className="h-5 w-5 text-gray-600" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-600">{item.key}</p>
                  </div>
                  {isConfigured ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Sandbox:</strong> {data.environment.MP_USE_SANDBOX ? "Habilitado" : "Deshabilitado"}
            </p>
          </div>
        </div>

        {/* Estadísticas de Canchas */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Estado de Canchas
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{data.venues.total}</p>
              <p className="text-sm text-gray-600">Total Canchas</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{data.venues.withMpConnection}</p>
              <p className="text-sm text-gray-600">Con MP</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{data.venues.withValidTokens}</p>
              <p className="text-sm text-gray-600">Tokens Válidos</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{data.venues.withExpiredTokens}</p>
              <p className="text-sm text-gray-600">Tokens Expirados</p>
            </div>
          </div>

          {/* Lista de Canchas */}
          <div className="space-y-3">
            {data.venues.details.map((venue) => (
              <div
                key={venue.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{venue.name}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span>Plan: {venue.plan}</span>
                    <span>Proveedor: {venue.paymentProvider || "N/A"}</span>
                    {venue.mpUserId && <span>MP ID: {venue.mpUserId}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {venue.hasValidConnection ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : venue.hasExpiredToken ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recomendaciones */}
        {data.recommendations.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recomendaciones
            </h2>
            <div className="space-y-3">
              {data.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <p className="text-sm text-yellow-800">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={fetchDiagnostics}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar Diagnóstico
          </button>
          <a
            href="/panel/cancha"
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <ExternalLink className="h-4 w-4" />
            Ir a Panel de Cancha
          </a>
        </div>
      </div>
    </div>
  );
}

