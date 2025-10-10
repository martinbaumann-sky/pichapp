import type { ReactNode } from "react";

interface LoadingScreenProps {
  /** Optional headline shown under the spinner */
  title?: ReactNode;
  /** Optional helper text shown under the headline */
  subtitle?: ReactNode;
}

const defaultTitle = "Preparando tu próximo partido";
const defaultSubtitle = "Optimizando la experiencia para que entres a la cancha sin esperas.";

export function LoadingScreen({ title = defaultTitle, subtitle = defaultSubtitle }: LoadingScreenProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 text-slate-100">
      <div
        aria-hidden
        className="absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(circle at 20% -10%, rgba(56,189,248,0.25), transparent 55%), " +
            "radial-gradient(circle at 80% 0%, rgba(129,140,248,0.2), transparent 60%), " +
            "linear-gradient(160deg, rgba(15,118,110,0.32), rgba(15,23,42,0.75))",
        }}
      />
      <div aria-hidden className="absolute -inset-x-24 top-1/2 h-[520px] -translate-y-1/2 bg-[conic-gradient(from_120deg_at_50%_50%,rgba(56,189,248,0.28),rgba(59,130,246,0.05),rgba(129,140,248,0.32),rgba(56,189,248,0.28))] opacity-60 blur-3xl" />
      <div className="relative flex flex-col items-center gap-8 px-6 text-center">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <span className="absolute inset-0 rounded-full border border-white/10" />
          <span className="absolute inset-3 rounded-full bg-emerald-400/10 blur-xl animate-breathe" />
          <span className="h-16 w-16 rounded-full border-2 border-white/10" />
          <span className="h-16 w-16 rounded-full border-t-2 border-l-2 border-emerald-300/80 animate-spin-slow" />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-300/80">PichApp</p>
          <div className="text-2xl font-semibold tracking-tight text-slate-50">{title}</div>
          <p className="text-sm text-slate-300/80">{subtitle}</p>
        </div>
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        Cargando contenido
      </span>
    </div>
  );
}

export default LoadingScreen;
