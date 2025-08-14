"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import dynamic from "next/dynamic";
import AuthDialog from "@/components/AuthDialog";

const CreateMatchPage = dynamic(() => import("../crear/page"), { ssr: false });

export default function OrganizarPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) setAuthOpen(true);
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black" />
      </div>
    );
  }

  if (!user) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <AuthDialog open={authOpen} onOpenChange={(o) => { setAuthOpen(o); if (!o) router.replace("/"); }} initialTab="login" next="/organizar" />
    </div>
  );

  return <CreateMatchPage />;
}


