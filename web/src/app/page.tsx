"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import HeroPitch from "@/components/HeroPitch";
import AnimatedBall from "@/components/AnimatedBall";

export default function Home() {
  return (
    <motion.div className="bg-white" initial={{ x: 0, opacity: 1 }} animate={{ x: 0, opacity: 1 }}>
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-8 md:py-12 max-w-7xl mx-auto gap-8 md:gap-10">
        {/* Left Content */}
        <div className="flex-1 max-w-2xl space-y-6 md:space-y-8 text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-bold text-black leading-tight tracking-tight">
            Encuentra tu pichanga.
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
            Juega donde y cuando quieras, con la mejor comunidad de fútbol amateur.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 pt-4 justify-center md:justify-start">
            <Link
              href="/explorar"
              className="px-6 md:px-8 py-3 md:py-4 bg-black text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-center"
            >
              Explorar partidos
            </Link>
          </div>

          {/* Feature Badges removed per design */}
        </div>

        {/* Right Illustration */}
        <div className="flex-1 flex justify-center items-center relative order-first md:order-last">
          <div className="relative w-full max-w-sm md:max-w-md">
            <HeroPitch className="w-full h-auto" />
            <AnimatedBall />
          </div>
        </div>
      </section>
      {/* Cómo funciona */}
      <section id="como-funciona" className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="flex items-start gap-4 bg-white border border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm">
            <div className="text-6xl font-black leading-none text-black">1</div>
            <div>
              <h3 className="font-semibold text-black mb-2">Explora partidos</h3>
              <p className="text-gray-600 text-sm">Encuentra tu pichanga ideal por ubicación y nivel.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 bg-white border border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm">
            <div className="text-6xl font-black leading-none text-black">2</div>
            <div>
              <h3 className="font-semibold text-black mb-2">Reserva y paga</h3>
              <p className="text-gray-600 text-sm">Asegura tu cupo en segundos.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 bg-white border border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm">
            <div className="text-6xl font-black leading-none text-black">3</div>
            <div>
              <h3 className="font-semibold text-black mb-2">Juega y disfruta</h3>
              <p className="text-gray-600 text-sm">Te recordamos antes. Solo llega y juega.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200 bg-gray-50/70">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 md:py-14">
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white/80 p-6 md:p-8 text-center shadow-sm">
            <p className="text-xs uppercase tracking-[0.35em] text-gray-400">¿Administras una cancha?</p>
            <h2 className="mt-3 text-xl md:text-2xl font-semibold text-gray-900">Gestiona tu recinto desde un panel dedicado</h2>
            <p className="mt-2 text-sm md:text-base text-gray-600">
              Solicita acceso privado y coordinamos la verificación junto a nuestro equipo antes de habilitar tu cuenta.
            </p>
            <div className="mt-5">
              <Link
                href="/canchas"
                className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:text-gray-900"
              >
                Conoce más sobre canchas
              </Link>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
