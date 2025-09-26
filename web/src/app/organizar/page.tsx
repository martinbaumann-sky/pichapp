"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AuthDialog from "@/components/AuthDialog";
import CreateMatchWizard from "@/components/CreateMatchWizard";

export default function OrganizarPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) setAuthOpen(true);
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[color:var(--bg)] flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[color:var(--brand-1)]" />
      </div>
    );
  }

  if (!user) return (
    <div className="min-h-screen bg-[color:var(--bg)] flex items-center justify-center">
      <AuthDialog open={authOpen} onOpenChange={(o) => { setAuthOpen(o); if (!o) router.replace("/"); }} initialTab="login" next="/organizar" />
    </div>
  );

  return <CreateMatchWizard />;
}

