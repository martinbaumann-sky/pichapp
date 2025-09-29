"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import AuthDialog from "@/components/AuthDialog";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { CalendarCheck2, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import HeroPitch from "@/components/HeroPitch";
import AnimatedBall from "@/components/AnimatedBall";
import HeroCancha from "@/components/HeroCancha";

export default function Home() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<"login" | "signup">("login");
  const [authNext, setAuthNext] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<"players" | "venues">("players");
  const router = useRouter();
  const { user } = useAuth();
  const handleOrganizeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthInitialTab("login");
      setAuthNext("/organizar");
      setAuthOpen(true);
      return;
    }
    router.push("/organizar");
  };
  const handleVenueAccess = () => {
    if (!user) {
      setAuthInitialTab("signup");
      setAuthNext("/canchas/panel");
      setAuthOpen(true);
      return;
    }
    router.push("/canchas/panel");
  };
  const handleAuthChange = (open: boolean) => {
    setAuthOpen(open);
    if (!open) {
      setAuthNext(undefined);
    }
  };
  return (
    <motion.div className="bg-white" initial={{ x: 0, opacity: 1 }} animate={{ x: 0, opacity: 1 }}>
      <section className="px-4 md:px-6 pt-6 md:pt-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center">
            <div className="inline-flex rounded-full bg-gray-100 p-1 text-sm font-medium">
              <button
                type="button"
                onClick={() => setActiveTab("players")}
                className={`px-4 md:px-6 py-2 rounded-full transition-all ${
                  activeTab === "players"
                    ? "bg-white shadow text-black"
                    : "text-gray-500 hover:text-black"
                }`}
              >
                Para jugadores
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("venues")}
                className={`px-4 md:px-6 py-2 rounded-full transition-all ${
                  activeTab === "venues"
                    ? "bg-white shadow text-black"
                    : "text-gray-500 hover:text-black"
                }`}
              >
                Para canchas
              </button>
            </div>
          </div>
        </div>
      </section>

      {activeTab === "players" ? (
        <>
          <section className="flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-8 md:py-12 max-w-7xl mx-auto gap-8 md:gap-10">
            <div className="flex-1 max-w-2xl space-y-6 md:space-y-8 text-center md:text-left">
              <h1 className="text-4xl md:text-6xl font-bold text-black leading-tight tracking-tight">
                Encuentra tu pichanga.
              </h1>
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                Juega donde y cuando quieras, con la mejor comunidad de fútbol amateur.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-4 pt-4 justify-center md:justify-start">
                <Link
                  href="/explorar"
                  className="px-6 md:px-8 py-3 md:py-4 bg-black text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-center"
                >
                  Explorar partidos
                </Link>
                <a
                  href="/organizar"
                  onClick={handleOrganizeClick}
                  className="px-6 md:px-8 py-3 md:py-4 border-2 border-black text-black rounded-lg font-semibold transition-all duration-200 hover:bg-black hover:text-white hover:-translate-y-0.5 text-center"
                >
                  Organizar partido
                </a>
              </div>
            </div>
            <div className="flex-1 flex justify-center items-center relative order-first md:order-last">
              <div className="relative w-full max-w-sm md:max-w-md">
                <HeroPitch className="w-full h-auto" />
                <AnimatedBall />
              </div>
            </div>
          </section>
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
        </>
      ) : (
        <>
          <section className="flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-8 md:py-12 max-w-7xl mx-auto gap-8 md:gap-10">
            <div className="flex-1 max-w-2xl space-y-6 md:space-y-8 text-center md:text-left">
              <h1 className="text-3xl md:text-5xl font-bold text-black leading-tight tracking-tight">
                Administra tus canchas sin fricción.
              </h1>
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                Recibe reservas confirmadas 24/7, controla tus horarios y cobra en línea desde un solo panel pensado para complejos deportivos.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-4 pt-4 justify-center md:justify-start">
                <button
                  type="button"
                  onClick={handleVenueAccess}
                  className="px-6 md:px-8 py-3 md:py-4 bg-black text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Ingresar o crear cuenta
                </button>
                <a
                  href="#pasos-canchas"
                  className="px-6 md:px-8 py-3 md:py-4 border-2 border-black text-black rounded-lg font-semibold transition-all duration-200 hover:bg-black hover:text-white hover:-translate-y-0.5"
                >
                  Ver cómo funciona
                </a>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm text-left">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Tiempo medio de respuesta</div>
                  <div className="text-2xl font-semibold text-black">&lt; 10 min</div>
                  <p className="text-xs text-gray-500 mt-1">Confirmamos tus reservas automáticamente.</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm text-left">
                  <div className="text-xs uppercase tracking-wide text-gray-500">Pagos protegidos</div>
                  <div className="text-2xl font-semibold text-black">100%</div>
                  <p className="text-xs text-gray-500 mt-1">Transferimos solo reservas confirmadas y validadas.</p>
                </div>
              </div>
            </div>
            <div className="flex-1 flex justify-center items-center relative order-first md:order-last">
              <div className="relative w-full max-w-sm md:max-w-md">
                <HeroCancha className="w-full h-auto" />
              </div>
            </div>
          </section>
          <section className="max-w-7xl mx-auto px-4 md:px-6 pb-8 md:pb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {[{
                icon: ShieldCheck,
                title: "Reservas confiables",
                description: "Validamos a cada equipo y bloqueamos horarios automáticamente para evitar doble reservas.",
              }, {
                icon: Wallet,
                title: "Pagos automatizados",
                description: "Recibe tus ingresos sin persuasiones manuales: liquidaciones transparentes y trazables.",
              }, {
                icon: Sparkles,
                title: "Panel en tiempo real",
                description: "Controla disponibilidad, precios dinámicos y reportes desde cualquier dispositivo.",
              }].map((feature) => (
                <div key={feature.title} className="flex flex-col gap-3 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <feature.icon className="w-10 h-10 text-black" />
                  <div>
                    <h3 className="font-semibold text-black mb-1">{feature.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section id="pasos-canchas" className="max-w-7xl mx-auto px-4 md:px-6 pb-12">
            <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 md:p-10 shadow-sm">
              <div className="grid lg:grid-cols-2 gap-10 items-center">
                <div className="space-y-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-black">¿Cómo funciona el alta de canchas?</h2>
                  <p className="text-gray-600">
                    Te acompañamos durante todo el proceso. Solo necesitas compartir la información clave de tu complejo y en minutos tendrás acceso a tu panel administrativo.
                  </p>
                  <div className="space-y-4">
                    {["Completa los datos de tu complejo", "Carga tus canchas y tarifas", "Activa horarios disponibles y comienza a recibir reservas"].map((step, index) => (
                      <div key={step} className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-black">{step}</h3>
                          <p className="text-sm text-gray-600">
                            {index === 0 && "Nombre legal, dirección, comuna y datos de contacto para tu complejo."}
                            {index === 1 && "Define cada cancha: nombre, tipo de superficie y precio por bloque."}
                            {index === 2 && "Selecciona disponibilidad, recibe reservas confirmadas y monitorea tu panel en vivo."}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={handleVenueAccess}
                      className="px-6 md:px-8 py-3 md:py-4 bg-black text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                      Comenzar registro
                    </button>
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5">
                  <div>
                    <h3 className="font-semibold text-black mb-2">¿Qué necesitas?</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Datos de contacto del administrador o dueños.</li>
                      <li>• Rut de facturación y datos bancarios para los abonos.</li>
                      <li>• Tarifas por bloque y reglas básicas (mínimo de horas, tolerancia, etc.).</li>
                    </ul>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                    <p className="font-medium text-black">¿Tienes dudas?</p>
                    <p>Escríbenos a <a className="underline" href="mailto:canchas@pichangapp.cl">canchas@pichangapp.cl</a> y te ayudamos a dejar todo listo.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
      <AuthDialog open={authOpen} onOpenChange={handleAuthChange} initialTab={authInitialTab} next={authNext} />
    </motion.div>
  );
}