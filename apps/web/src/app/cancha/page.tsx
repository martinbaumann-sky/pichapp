import Link from "next/link";
import { CalendarCheck, CheckCircle2, MessageCircle, PieChart, ShieldCheck, Users2 } from "lucide-react";
import { VENUE_PLANS } from "@/lib/venuePlans";

const benefits = [
  {
    title: "Administra tus partidos",
    description: "Publica partidos oficiales, controla cupos, niveles y políticas de cancelación en minutos.",
    icon: CalendarCheck,
  },
  {
    title: "Cobros automáticos",
    description: "Recibe pagos con Mercado Pago, define comisiones y revisa liquidaciones en tiempo real.",
    icon: ShieldCheck,
  },
  {
    title: "Gestión de reservas",
    description: "Revisa el listado de jugadores, valida asistencia con QR y envía mensajes a tus inscritos.",
    icon: Users2,
  },
];

const plans = Object.values(VENUE_PLANS);

const onboardingSteps = [
  {
    title: "1. Registra tu cancha",
    description: "Ingresa datos, dirección y valida tu staff en minutos.",
  },
  {
    title: "2. Conecta tu cuenta de pago",
    description: "Recibe los abonos automáticos con liquidaciones transparentes.",
  },
  {
    title: "3. Publica tus partidos",
    description: "Configura cupos, precios y comienza a cobrar online.",
  },
];

export default function CanchaLandingPage() {
  return (
    <div className="bg-white">
      <section className="relative overflow-hidden border-b border-gray-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-7 space-y-6">
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Canchas verificadas
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
                PichangApp para canchas: publica, cobra y llena tus partidos.
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl">
                Diseñamos la mejor experiencia B2B2C para que administres tus partidos, cobres online y entregues una experiencia oficial a tus jugadores.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/cancha/registro" className="btn-primary btn-mobile sm:px-10 sm:py-4">
                  Empezar como cancha
                </Link>
                <Link href="/cancha/ingresar" className="btn-secondary btn-mobile sm:px-10 sm:py-4">
                  Ya tengo cuenta
                </Link>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-gray-500">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Sin costo inicial — pagas solo cuando cobras.
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Onboarding guiado en menos de 10 minutos.
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Soporte dedicado para tu equipo.
                </li>
              </ul>
            </div>
            <div className="lg:col-span-5 bg-gray-900 text-white rounded-3xl shadow-xl p-8 sm:p-10 space-y-6">
              <h2 className="text-xl font-semibold">Todo en un mismo panel</h2>
              <p className="text-sm text-gray-300">
                Controla partidos, reservas, pagos, reportes y staff desde un único lugar diseñado para canchas.
              </p>
              <div className="grid grid-cols-1 gap-4">
                <FeatureCard icon={CalendarCheck} title="Calendario inteligente" description="Genera partidos desde slots recurrentes y gestiona excepciones." />
                <FeatureCard icon={PieChart} title="Reportes en vivo" description="Visualiza ingresos netos, comisiones y asistencia por partido." />
                <FeatureCard icon={MessageCircle} title="Chat integrado" description="Envía mensajes masivos o 1 a 1 directamente desde el panel." />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Por qué las canchas eligen PichangApp</h2>
          <p className="mt-4 text-gray-600">
            Diseñamos herramientas enfocadas en llenar tus horarios y ofrecer la mejor experiencia a los jugadores.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition">
              <benefit.icon className="h-10 w-10 text-emerald-500" aria-hidden />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{benefit.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Planes flexibles según tu volumen</h2>
            <p className="mt-3 text-gray-600">Solo pagas comisión cuando cobras. Elige el plan que mejor se adapta al volumen de tu cancha.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.slug}
                className={`rounded-3xl border ${plan.highlight ? "border-gray-900 bg-white shadow-xl" : "border-gray-200 bg-white shadow-sm"} p-8 flex flex-col gap-6`}
              >
                <div className="space-y-2">
                  <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${plan.highlight ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"}`}>
                    {plan.name}
                  </span>
                  <div className="text-3xl font-bold text-gray-900">{plan.priceLabel}</div>
                  <div className="text-sm font-semibold text-emerald-600">{plan.commissionLabel}</div>
                  <p className="text-sm text-gray-600">{plan.description}</p>
                </div>
                <ul className="space-y-3 text-sm text-gray-600">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div>
                  <Link
                    href={`/cancha/planes?plan=${plan.slug}`}
                    className={`btn-mobile w-full text-center ${plan.highlight ? "btn-primary" : "btn-secondary"}`}
                  >
                    Elegir plan
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Onboarding guiado y soporte local</h2>
          <p className="text-gray-600">
            Nuestro equipo te acompaña en cada paso para que publiques tu primer partido oficial en minutos y comiences a cobrar de inmediato.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {onboardingSteps.map((step) => (
              <div key={step.title} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900">{step.title}</h3>
                <p className="mt-2 text-xs text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

interface FeatureCardProps {
  icon: typeof CalendarCheck;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex items-start gap-4 rounded-2xl bg-white/10 p-4 border border-white/10">
      <Icon className="h-6 w-6 text-emerald-300" aria-hidden />
      <div>
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="text-sm text-gray-300">{description}</p>
      </div>
    </div>
  );
}
