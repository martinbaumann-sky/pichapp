"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function OrganizarPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const derivedRole =
    (user?.role as "player" | "venue_admin" | "superadmin" | undefined) ??
    (user?.isAdmin ? "superadmin" : undefined);

  useEffect(() => {
    if (loading) return;

    if (derivedRole === "venue_admin" || derivedRole === "superadmin") {
      router.replace("/panel/cancha");
      return;
    }

    router.replace("/cancha");
  }, [derivedRole, loading, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-12 w-12 rounded-full border-b-2 border-black animate-spin" aria-hidden />
        <p className="text-sm text-gray-600">Redirigiendo…</p>
      </div>
    </div>
  );
}

