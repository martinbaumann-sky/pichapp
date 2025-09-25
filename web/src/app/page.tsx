"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import AuthDialog from "@/components/AuthDialog";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import HeroPitch from "@/components/HeroPitch";
import AnimatedBall from "@/components/AnimatedBall";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CreditCard,
  ShieldCheck,
  Users,
} from "lucide-react";

export default function Home() {
  const [authOpen, setAuthOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const highlights = [
    "Disponibilidad en tiempo real",
    "Pagos seguros",
    "Comunidades verificadas",
  ];

  const stats = [
    { value: "+250", label: "Equipos activos cada semana" },
    { value: "98%", label: "Reservas confirmadas a tiempo" },
    { value: "<24h", label: "Promedio para cerrar un partido" },
  ];

  const features = [
    {
      icon: CalendarDays,
      title: "Reservas inteligentes",
      description:
        "Sincroniza la disponibilidad de tus canchas y evita dobles reservas con recordatorios automáticos.",
    },
    {
      icon: Users,
      title: "Equipos equilibrados",
      description:
        "Define cupos por posición, asigna niveles y deja que PichangApp empareje a tu gente por ti.",
    },
    {
      icon: CreditCard,
      title: "Pagos sin fricción",
      description:
        "Recauda con transferencias, tarjetas o billeteras digitales y confirma la asistencia en un toque.",
    },
    {
      icon: ShieldCheck,
      title: "Confianza en cada partido",
      description:
        "Perfiles verificados, reseñas reales y reportes instantáneos para mantener la comunidad sana.",
    },
  ];

  const steps = [
    {
      title: "Explora partidos",
      description:
        "Filtra por comuna, nivel y horario desde tu celular o computador y guarda tus canchas favoritas.",
    },
    {
      title: "Reserva y coordina",
      description:
        "Asegura tu cupo, invita amigos y coordina con mensajes directos en un espacio compartido.",
    },
    {
      title: "Juega y disfruta",
      description:
        "Recibe recordatorios, gestiona asistencias y registra resultados para tus próximas pichangas.",
    },
  ];

  const handleOrganizeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthOpen(true);
      return;
    }
    router.push("/organizar");
  };

  return (
    <motion.main
      className="relative min-h-screen overflow-hidden bg-[color:var(--bg)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-brand/5 blur-3xl" />
        <div className="absolute top-1/4 -left-28 h-80 w-80 rounded-full bg-brand/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[32rem] w-[32rem] translate-x-1/3 rounded-full bg-accent-50 blur-[140px]" />
      </div>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-16 md:px-6 md:pb-20 md:pt-24 lg:pb-24">
        <div className="grid items-center gap-12 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="space-y-8 text-center md:text-left">
            <span className="chip mx-auto md:mx-0">La cancha es tuya</span>
            <div className="space-y-5">
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-[color:var(--fg)] sm:text-5xl lg:text-6xl">
                Organiza y juega pichangas en minutos.
              </h1>
              <p className="text-base text-[color:var(--fg-muted)] sm:text-lg lg:text-xl">
                Encuentra equipos, reserva canchas y coordina pagos desde cualquier dispositivo. Diseñamos una experiencia simple,
                moderna e intuitiva para que solo te preocupes de jugar.
              </p>
            </div>

            <div className="flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:justify-start">
              <Link href="/explorar" className="btn-primary btn-mobile w-full sm:w-auto">
                Explorar partidos
              </Link>
              <a
                href="/organizar"
                onClick={handleOrganizeClick}
                className="btn-outline btn-mobile w-full sm:w-auto"
              >
                Organizar partido
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              {highlights.map((item) => (
                <span key={item} className="feature-pill">
                  <Check className="h-4 w-4 text-[color:var(--brand-1)]" aria-hidden />
                  {item}
                </span>
              ))}
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="stat-card">
                  <span className="text-2xl font-semibold text-[color:var(--fg)] sm:text-3xl">
                    {stat.value}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-[color:var(--fg-subtle)]">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex justify-center md:justify-end">
            <div className="relative w-full max-w-md overflow-visible">
              <div className="relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/70 p-6 shadow-lg backdrop-blur-xl">
                <div className="absolute inset-x-8 top-8 h-40 rounded-3xl bg-gradient-to-br from-brand/20 via-transparent to-transparent blur-3xl" />
                <div className="relative z-10 space-y-5">
                  <HeroPitch className="w-full" />
                  <AnimatedBall />
                  <div className="grid gap-3 text-sm text-[color:var(--fg-muted)]">
                    <div className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
                      <span className="font-semibold text-[color:var(--fg)]">Equipos listos</span>
                      <span className="inline-flex items-center gap-2 text-[color:var(--brand-1)]">
                        <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--brand-1)]" /> 12 jugadores
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
                      <span className="font-semibold text-[color:var(--fg)]">Próxima pichanga</span>
                      <span>Sábado 19:30 · Ñuñoa</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-10 left-6 hidden w-60 flex-col gap-2 rounded-2xl border border-[color:var(--border)]/70 bg-[color:var(--surface-strong)] p-4 text-xs text-[color:var(--fg-muted)] shadow-lg backdrop-blur md:flex">
                <p className="font-semibold text-[color:var(--fg)]">Agenda inteligente</p>
                <p>
                  Configura recordatorios automáticos para avisar a tu equipo del punto de encuentro y el pronóstico del clima.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 md:px-6 md:pb-20">
        <div className="mb-10 text-center">
          <span className="chip inline-flex tracking-[0.25em]">Herramientas clave</span>
          <h2 className="mt-4 text-3xl font-bold text-[color:var(--fg)] md:text-4xl">
            Todo lo que necesitas para coordinar tu próxima pichanga
          </h2>
          <p className="mt-3 text-base text-[color:var(--fg-muted)] md:text-lg">
            Diseñado para verse increíble en computadores, tablets y celulares sin perder claridad.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {features.map((feature) => (
            <div key={feature.title} className="card card-hover flex h-full flex-col gap-4 p-6">
              <div className="flex items-center gap-3">
                <feature.icon className="h-10 w-10 rounded-2xl bg-brand/10 p-2 text-[color:var(--brand-1)]" aria-hidden />
                <h3 className="text-xl font-semibold text-[color:var(--fg)]">{feature.title}</h3>
              </div>
              <p className="text-sm leading-relaxed text-[color:var(--fg-muted)]">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="como-funciona" className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-20 md:px-6">
        <div className="mb-12 text-center">
          <span className="chip inline-flex tracking-[0.3em]">Cómo funciona</span>
          <h2 className="mt-4 text-3xl font-bold text-[color:var(--fg)] md:text-4xl">
            Tres pasos para jugar sin complicaciones
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="group relative overflow-hidden rounded-3xl border border-[color:var(--border)]/80 bg-white/75 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="absolute -top-16 right-0 h-36 w-36 rounded-full bg-[color:var(--brand-soft)] blur-3xl transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative z-10 flex flex-col gap-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-lg font-semibold text-[color:var(--brand-1)]">
                  0{index + 1}
                </span>
                <h3 className="text-xl font-semibold text-[color:var(--fg)]">{step.title}</h3>
                <p className="text-sm leading-relaxed text-[color:var(--fg-muted)]">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} initialTab="login" next="/organizar" />
    </motion.main>
  );
}
