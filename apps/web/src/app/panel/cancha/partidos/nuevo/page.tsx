"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import CreateMatchWizard from "@/components/CreateMatchWizard";
import { useAuth } from "@/hooks/useAuth";

export default function NewVenueMatchPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const role = useMemo(() => {
    if (!user) return null;
    if (user.role) return user.role;
    if (user.isAdmin) return "superadmin";
    return null;
  }, [user]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/cancha/ingresar?next=/panel/cancha/partidos/nuevo");
      return;
    }
    if (role !== "venue_admin" && role !== "superadmin") {
      router.replace("/cancha");
    }
  }, [loading, user, role, router]);

  if (loading || !user || (role !== "venue_admin" && role !== "superadmin")) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-white flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-gray-900" aria-hidden />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-gray-900">Crear nuevo partido</h1>
        <p className="mt-2 text-sm text-gray-600">
          Completa los pasos para publicar un partido oficial organizado por tu cancha.
        </p>
        <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <CreateMatchWizard />
        </div>
      </div>
    </div>
  );
}
