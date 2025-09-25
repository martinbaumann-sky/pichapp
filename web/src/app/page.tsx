"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AddressAutocomplete from "@/components/AddressAutocomplete";
import HeroGlobeMap from "@/components/HeroGlobeMap";

type SelectedLocation = {
  display?: string;
  lat?: number;
  lng?: number;
  comuna?: string;
};

export default function Home() {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [heroActivated, setHeroActivated] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const fallbackFocus = useMemo(() => ({ lat: -33.4489, lng: -70.6693 }), []);

  const focusPoint = heroActivated
    ? selectedLocation?.lat != null && selectedLocation?.lng != null
      ? { lat: selectedLocation.lat, lng: selectedLocation.lng }
      : fallbackFocus
    : null;

  const handleLocationChange = (value: SelectedLocation) => {
    const displayValue = value.display ?? "";
    setSearchValue(displayValue);
    if (value.lat != null && value.lng != null) {
      setSelectedLocation(value);
      return;
    }
    if (displayValue.trim().length === 0) {
      setSelectedLocation(null);
      return;
    }
    setSelectedLocation((prev) => {
      if (!prev) return { display: displayValue };
      return { ...prev, display: displayValue };
    });
  };

  const runExplore = () => {
    if (isNavigating) return;
    setHeroActivated(true);

    const query = searchValue.trim();
    const hasCoords = selectedLocation?.lat != null && selectedLocation?.lng != null;

    if (!query && !hasCoords) {
      return;
    }

    setIsNavigating(true);
    const params = new URLSearchParams();
    if (hasCoords) {
      params.set("lat", String(selectedLocation!.lat));
      params.set("lng", String(selectedLocation!.lng));
    }
    if (selectedLocation?.comuna) {
      params.set("comuna", selectedLocation.comuna);
    }
    if (query) {
      params.set("q", query);
    }
    const targetUrl = `/explorar${params.toString() ? `?${params.toString()}` : ""}`;
    window.setTimeout(() => {
      router.push(targetUrl);
    }, 900);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runExplore();
  };

  const handleExploreClick = () => {
    runExplore();
  };

  return (
    <motion.div className="bg-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-slate-200" aria-hidden="true" />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.35),transparent_60%)] blur-3xl opacity-70"
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto flex min-h-[88vh] flex-col-reverse items-center gap-16 px-4 pb-16 pt-24 sm:px-6 lg:flex-row lg:items-stretch lg:gap-20 xl:gap-24">
          <div className="flex w-full max-w-xl flex-col justify-between gap-12 lg:max-w-lg xl:max-w-xl">
            <div className="space-y-6">
              <span className="text-sm font-semibold uppercase tracking-[0.45em] text-slate-500">Skyterra</span>
              <AnimatePresence initial={false}>
                {!heroActivated && (
                  <motion.div
                    key="hero-copy"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="space-y-6"
                  >
                    <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
                      Vende informado
                    </h1>
                    <p className="max-w-md text-base text-slate-600 sm:text-lg">
                      Conecta tus propiedades al pulso del territorio. Analiza el potencial real de cada zona antes de tomar
                      decisiones.
                    </p>
                    <button
                      type="button"
                      onClick={handleExploreClick}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                    >
                      Explorar
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.form
              onSubmit={handleSubmit}
              initial={false}
              animate={{ y: heroActivated ? -40 : 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              className="w-full space-y-3"
            >
              <div className="flex w-full items-center gap-3 rounded-full bg-white/90 px-2 py-2 shadow-2xl ring-1 ring-slate-900/5 backdrop-blur-lg transition focus-within:ring-2 focus-within:ring-slate-900">
                <AddressAutocomplete
                  value={searchValue}
                  onChange={handleLocationChange}
                  placeholder="Buscar terrenos..."
                  className="flex-1"
                  inputClassName="border-none bg-transparent px-4 py-3 text-base font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                />
                <button
                  type="submit"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                >
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
              <p className="pl-6 text-sm text-slate-500">Escribe una dirección, comuna o punto de interés para comenzar.</p>
            </motion.form>
          </div>

          <motion.div layout className="flex w-full items-center justify-center lg:flex-1">
            <motion.div
              layout
              className="relative w-full max-w-[420px] sm:max-w-[460px] md:max-w-[520px] lg:max-w-[560px] xl:max-w-[620px]"
              animate={{ height: heroActivated ? 520 : 420 }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
            >
              <motion.div
                className="relative h-full w-full overflow-hidden shadow-[0px_40px_120px_rgba(15,23,42,0.35)]"
                animate={{ borderRadius: heroActivated ? 36 : 999 }}
                transition={{ type: "spring", stiffness: 160, damping: 22 }}
              >
                <HeroGlobeMap activated={heroActivated} focus={focusPoint} />
                <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-white/0 via-white/0 to-slate-900/25" />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="como-funciona" className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16 sm:pb-20 lg:px-8">
        <div className="mb-10 space-y-4 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Cómo funciona</span>
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Decisiones guiadas por datos territoriales</h2>
          <p className="text-base text-slate-600 sm:text-lg">
            Usa la exploración en mapa para entender demanda, riesgos y oportunidades antes de publicar un terreno.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/80 p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <div className="text-6xl font-black leading-none text-slate-900">1</div>
            <h3 className="text-lg font-semibold text-slate-900">Explora el mapa inteligente</h3>
            <p className="text-slate-600">
              Detecta rápidamente zonas activas, plusvalía proyectada y servicios clave con una visualización envolvente.
            </p>
          </div>
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/80 p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <div className="text-6xl font-black leading-none text-slate-900">2</div>
            <h3 className="text-lg font-semibold text-slate-900">Compara oportunidades</h3>
            <p className="text-slate-600">
              Filtra por comunas, acceso y tendencias para priorizar los terrenos con mejor retorno esperado.
            </p>
          </div>
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/80 p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <div className="text-6xl font-black leading-none text-slate-900">3</div>
            <h3 className="text-lg font-semibold text-slate-900">Vende con confianza</h3>
            <p className="text-slate-600">
              Presenta tus propiedades con data actualizada y el respaldo de SKYTERRA para cerrar acuerdos seguros.
            </p>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
