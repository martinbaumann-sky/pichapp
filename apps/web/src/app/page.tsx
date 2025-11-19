"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import HeroPitch from "@/components/HeroPitch";
import AnimatedBall from "@/components/AnimatedBall";
import { Sparkles, Shield, Zap } from "lucide-react";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  const floatingVariants = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-white via-gray-50/50 to-white">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-cyan-400/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10"
      >
        {/* Hero Section */}
        <section className="flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-12 md:py-20 max-w-7xl mx-auto gap-10 md:gap-16">
          {/* Left Content */}
          <motion.div className="flex-1 max-w-2xl space-y-6 md:space-y-8 text-center md:text-left" variants={itemVariants}>
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-50 to-emerald-50 border border-cyan-200/50 text-sm font-medium text-gray-700"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Sparkles className="w-4 h-4 text-cyan-600" />
              <span>Partidos oficiales verificados</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Partidos oficiales
              </span>
              <br />
              <span className="text-gradient-animated">
                organizados por canchas
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-xl">
              Reserva tu cupo y juega hoy con <strong className="text-gray-900">pagos seguros</strong>, cupos garantizados y canchas verificadas.
            </p>

            {/* Features Pills */}
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-gray-700">Pagos seguros</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm">
                <Zap className="w-4 h-4 text-cyan-600" />
                <span className="text-sm font-medium text-gray-700">Confirmación inmediata</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 pt-4 justify-center md:justify-start">
              <Link
                href="/explorar"
                className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-cyan-500/30 hover:-translate-y-1 text-center overflow-hidden"
              >
                <span className="relative z-10">Explorar partidos</span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
              <Link
                href="/cancha"
                className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-900 rounded-xl font-semibold transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-300 hover:-translate-y-1 text-center"
              >
                ¿Administras una cancha?
              </Link>
            </div>
          </motion.div>

          {/* Right Illustration */}
          <motion.div
            className="flex-1 flex justify-center items-center relative order-first md:order-last"
            variants={itemVariants}
          >
            <motion.div
              className="relative w-full max-w-sm md:max-w-md"
              variants={floatingVariants}
              animate="animate"
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-emerald-400/20 rounded-full blur-3xl" />
              <div className="relative">
                <HeroPitch className="w-full h-auto drop-shadow-2xl" />
                <AnimatedBall />
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Cómo funciona */}
        <section id="como-funciona" className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20">
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Cómo funciona
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Únete a partidos oficiales en 3 simples pasos
            </p>
          </motion.div>

          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8" variants={containerVariants}>
            <motion.div
              className="group relative flex flex-col items-start gap-4 bg-white border-2 border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm cursor-default overflow-hidden"
              variants={itemVariants}
              whileHover={{ y: -8, borderColor: "rgb(6, 182, 212)" }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-100/50 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white text-2xl font-black shadow-lg">
                1
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Explora partidos</h3>
                <p className="text-gray-600">Filtra por comuna, fecha, nivel o tu cancha favorita.</p>
              </div>
            </motion.div>

            <motion.div
              className="group relative flex flex-col items-start gap-4 bg-white border-2 border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm cursor-default overflow-hidden"
              variants={itemVariants}
              whileHover={{ y: -8, borderColor: "rgb(14, 165, 78)" }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100/50 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-2xl font-black shadow-lg">
                2
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Reserva y paga</h3>
                <p className="text-gray-600">Paga tu cupo con Mercado Pago y recibe confirmación inmediata.</p>
              </div>
            </motion.div>

            <motion.div
              className="group relative flex flex-col items-start gap-4 bg-white border-2 border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm cursor-default overflow-hidden"
              variants={itemVariants}
              whileHover={{ y: -8, borderColor: "rgb(245, 158, 11)" }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-100/50 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white text-2xl font-black shadow-lg">
                3
              </div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Juega y disfruta</h3>
                <p className="text-gray-600">Llega con tu QR, juega el partido oficial y evalúa la experiencia.</p>
              </div>
            </motion.div>
          </motion.div>
        </section>
      </motion.div>
    </div>
  );
}