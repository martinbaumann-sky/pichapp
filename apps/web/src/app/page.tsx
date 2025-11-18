"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import HeroPitch from "@/components/HeroPitch";
import AnimatedBall from "@/components/AnimatedBall";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  };

  return (
    <motion.div
      className="bg-white"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-8 md:py-12 max-w-7xl mx-auto gap-8 md:gap-10">
        {/* Left Content */}
        <motion.div className="flex-1 max-w-2xl space-y-6 md:space-y-8 text-center md:text-left" variants={itemVariants}>
          <h1 className="text-4xl md:text-6xl font-bold text-black leading-tight tracking-tight">
            Partidos oficiales organizados por canchas.
          </h1>

          <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
            Reserva tu cupo y juega hoy con pagos seguros, cupos garantizados y canchas verificadas.
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
          <div className="pt-2 text-xs text-gray-500">
            <Link href="/cancha" className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700">
              ¿Administras una cancha?
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="m13 6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </motion.div>

        {/* Right Illustration */}
        <motion.div className="flex-1 flex justify-center items-center relative order-first md:order-last" variants={itemVariants}>
          <div className="relative w-full max-w-sm md:max-w-md">
            <HeroPitch className="w-full h-auto" />
            <AnimatedBall />
          </div>
        </motion.div>
      </section>
      {/* Cómo funciona */}
      <section id="como-funciona" className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6" variants={containerVariants}>
          <motion.div
            className="flex items-start gap-4 bg-white border border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm cursor-default"
            variants={itemVariants}
            whileHover={{ y: -4, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="text-6xl font-black leading-none text-black">1</div>
            <div>
              <h3 className="font-semibold text-black mb-2">Explora partidos</h3>
              <p className="text-gray-600 text-sm">Filtra por comuna, fecha, nivel o tu cancha favorita.</p>
            </div>
          </motion.div>
          <motion.div
            className="flex items-start gap-4 bg-white border border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm cursor-default"
            variants={itemVariants}
            whileHover={{ y: -4, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="text-6xl font-black leading-none text-black">2</div>
            <div>
              <h3 className="font-semibold text-black mb-2">Reserva y paga</h3>
              <p className="text-gray-600 text-sm">Paga tu cupo con Mercado Pago y recibe confirmación inmediata.</p>
            </div>
          </motion.div>
          <motion.div
            className="flex items-start gap-4 bg-white border border-gray-200 rounded-2xl p-4 md:p-6 shadow-sm cursor-default"
            variants={itemVariants}
            whileHover={{ y: -4, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="text-6xl font-black leading-none text-black">3</div>
            <div>
              <h3 className="font-semibold text-black mb-2">Juega y disfruta</h3>
              <p className="text-gray-600 text-sm">Llega con tu QR, juega el partido oficial y evalúa la experiencia.</p>
            </div>
          </motion.div>
        </motion.div>
      </section>
    </motion.div>
  );
}