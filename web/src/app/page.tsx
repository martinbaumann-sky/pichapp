"use client";
import Link from "next/link";
import { motion } from "framer-motion";
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
    <motion.div className="bg-white" initial={{ x: 0, opacity: 1 }} animate={{ x: 0, opacity: 1 }}>
      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row items-center justify-between container container-px py-8 sm:py-12 lg:py-20 xl:py-24 gap-8 lg:gap-12 xl:gap-16">
        {/* Left Content */}
        <div className="flex-1 max-w-2xl space-y-6 lg:space-y-8 xl:space-y-10 text-center lg:text-left">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold text-black leading-tight tracking-tight">
            Encuentra tu pichanga.
          </h1>
          
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
            Juega donde y cuando quieras, con la mejor comunidad de fútbol amateur.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 pt-2 justify-center lg:justify-start">
            <Link
              href="/explorar"
              className="btn-primary btn-mobile lg:px-10 lg:py-4 lg:text-lg"
            >
              Explorar partidos
            </Link>
            
            <a
              href="/organizar"
              onClick={handleOrganizeClick}
              className="btn-outline btn-mobile lg:px-10 lg:py-4 lg:text-lg"
            >
              Organizar partido
            </a>
          </div>

          {/* Feature Badges removed per design */}
        </div>

        {/* Right Illustration */}
        <div className="flex-1 flex justify-center items-center relative max-w-md lg:max-w-lg xl:max-w-xl">
          <HeroPitch className="w-full max-w-sm lg:max-w-md xl:max-w-lg" />
          <AnimatedBall />
        </div>
      </section>
      {/* Cómo funciona */}
      <section id="como-funciona" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
          <div className="card card-hover flex items-start gap-4 lg:gap-6 p-6 lg:p-8">
            <div className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-none text-black">1</div>
            <div>
              <h3 className="font-semibold text-black mb-3 text-lg sm:text-xl lg:text-2xl">Explora partidos</h3>
              <p className="text-gray-600 text-sm sm:text-base lg:text-lg">Encuentra tu pichanga ideal por ubicación y nivel.</p>
            </div>
          </div>
          <div className="card card-hover flex items-start gap-4 lg:gap-6 p-6 lg:p-8">
            <div className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-none text-black">2</div>
            <div>
              <h3 className="font-semibold text-black mb-3 text-lg sm:text-xl lg:text-2xl">Reserva y paga</h3>
              <p className="text-gray-600 text-sm sm:text-base lg:text-lg">Asegura tu cupo en segundos.</p>
            </div>
          </div>
          <div className="card card-hover flex items-start gap-4 lg:gap-6 p-6 lg:p-8 sm:col-span-2 lg:col-span-1">
            <div className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-none text-black">3</div>
            <div>
              <h3 className="font-semibold text-black mb-3 text-lg sm:text-xl lg:text-2xl">Juega y disfruta</h3>
              <p className="text-gray-600 text-sm sm:text-base lg:text-lg">Te recordamos antes. Solo llega y juega.</p>
            </div>
          </div>
        </div>
      </section>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} initialTab="login" next="/organizar" />
    </motion.div>
  );
}





