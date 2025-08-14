"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import AuthDialog from "@/components/AuthDialog";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import {  } from "lucide-react";
import HeroPitch from "@/components/HeroPitch";
import AnimatedBall from "@/components/AnimatedBall";

export default function Home() {
  const [authOpen, setAuthOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const handleOrganizeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthOpen(true);
      return;
    }
    router.push("/organizar");
  };
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between px-6 py-12 max-w-7xl mx-auto gap-10">
        {/* Left Content */}
        <div className="flex-1 max-w-2xl space-y-8">
          <h1 className="text-6xl font-bold text-black leading-tight tracking-tight">
            Encuentra tu pichanga.
          </h1>
          
          <p className="text-xl text-gray-600 leading-relaxed">
            Juega donde y cuando quieras, con la mejor comunidad de fútbol amateur.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 pt-4">
            <Link
              href="/explorar"
              className="px-8 py-4 bg-black text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Explorar partidos
            </Link>
            
            <a
              href="/organizar"
              onClick={handleOrganizeClick}
              className="px-8 py-4 border-2 border-black text-black rounded-lg font-semibold transition-all duration-200 hover:bg-black hover:text-white hover:-translate-y-0.5"
            >
              Organizar partido
            </a>
          </div>

          {/* Feature Badges removed per design */}
        </div>

        {/* Right Illustration */}
        <div className="flex-1 flex justify-center items-center relative">
          <HeroPitch className="w-full max-w-md" />
          <AnimatedBall />
        </div>
      </section>
      {/* Cómo funciona */}
      <section id="como-funciona" className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center font-semibold mb-4">1</div>
          <h3 className="font-semibold text-black mb-2">Explora partidos</h3>
          <p className="text-gray-600 text-sm">Encuentra tu pichanga ideal por ubicación y nivel.</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center font-semibold mb-4">2</div>
          <h3 className="font-semibold text-black mb-2">Reserva y paga</h3>
          <p className="text-gray-600 text-sm">Asegura tu cupo en segundos con Mercado Pago.</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center font-semibold mb-4">3</div>
          <h3 className="font-semibold text-black mb-2">Juega y disfruta</h3>
          <p className="text-gray-600 text-sm">Te recordamos antes del partido. Solo llega y juega.</p>
        </div>
      </section>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} initialTab="login" next="/organizar" />
    </div>
  );
}
