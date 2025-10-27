"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type TabKey = "ayuda" | "terminos" | "privacidad";

export default function HelpWidget() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<TabKey>("ayuda");
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Close on ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Click outside to close when open
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        // don't close when clicking the toggle button itself
        const btn = document.getElementById("help-widget-toggle");
        if (btn && btn.contains(e.target as Node)) return;
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const tabs = useMemo(
    () => [
      { key: "ayuda" as const, label: "Ayuda" },
      { key: "terminos" as const, label: "Términos" },
      { key: "privacidad" as const, label: "Privacidad" },
    ],
    []
  );

  return (
    <>
      {/* Floating Button */}
      <button
        id="help-widget-toggle"
        type="button"
        aria-expanded={open}
        aria-controls="help-widget-panel"
        onClick={() => setOpen((v) => !v)}
        className="fixed z-[70] bottom-6 right-6 h-12 w-12 rounded-full bg-black text-white shadow-lg hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/50 flex items-center justify-center"
        title="Ayuda, términos y privacidad"
      >
        <span aria-hidden>?</span>
        <span className="sr-only">Abrir ayuda</span>
      </button>

      {/* Panel */}
      {open && (
        <div
          id="help-widget-panel"
          ref={panelRef}
          className="fixed z-[80] bottom-24 right-6 w-[92vw] max-w-md bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-widget-title"
        >
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
            <div className="flex items-center justify-between gap-2">
              <h2 id="help-widget-title" className="text-sm font-semibold text-gray-900">
                Centro de ayuda
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label="Cerrar"
                title="Cerrar"
              >
                ✕
              </button>
            </div>
            <div className="mt-2 flex gap-1">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActive(t.key)}
                  className={`px-3 py-1.5 text-sm rounded-lg border ${
                    active === t.key
                      ? "bg-white border-gray-300 text-gray-900"
                      : "bg-transparent border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                  aria-current={active === t.key ? "page" : undefined}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[60vh] overflow-auto px-4 py-4 text-sm text-gray-800">
            {active === "ayuda" && <HelpTab />}
            {active === "terminos" && <TermsTab />}
            {active === "privacidad" && <PrivacyTab />}
          </div>

          <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 flex items-center justify-between text-xs text-gray-600">
            <div>
              ¿Necesitas más ayuda? Escríbenos a
              {" "}
              <a className="underline hover:text-gray-900" href="mailto:contacto.pichapp@gmail.com">contacto.pichapp@gmail.com</a>
            </div>
            <Link href="/ayuda" className="underline hover:text-gray-900">Ver más</Link>
          </div>
        </div>
      )}
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-gray-900 mb-2">{children}</h3>;
}

function List({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-5 space-y-1">{children}</ul>;
}

function HelpTab() {
  return (
    <div className="space-y-5">
      <SectionTitle>Preguntas frecuentes</SectionTitle>
      <div>
        <p className="font-medium">¿Cómo me uno a un partido?</p>
        <List>
          <li>Ve a Explorar y filtra por tu comuna o fecha.</li>
          <li>Elige un partido con cupos disponibles y presiona Unirme.</li>
          <li>Confirma tu cupo gratis y recibe confirmacion inmediata.</li>
        </List>
      </div>
      <div>
        <p className="font-medium">¿Cómo creo un partido?</p>
        <List>
          <li>Desde Crear partido, define lugar, fecha, hora y cupos disponibles.</li>
          <li>Invita amigos o publícalo para que otros se sumen.</li>
          <li>Administra asistentes, reglas y comunicacion desde tu panel.</li>
        </List>
      </div>
      <div>
        <p className="font-medium">Reservas y no-show</p>
        <List>
          <li>Las reservas se confirman automaticamente sin cobros.</li>
          <li>Si el partido se cancela, avisa a los jugadores con anticipacion.</li>
          <li>Define reglas de no-show y compartelas con los jugadores.</li>
        </List>
      </div>
      <div>
        <p className="font-medium">Consejos de seguridad</p>
        <List>
          <li>Revisa la calificación del organizador y la descripción del partido.</li>
          <li>Respeta las normas de la cancha y a otros jugadores.</li>
          <li>Si algo no va bien, repórtalo a soporte.</li>
        </List>
      </div>
      <div className="text-xs text-gray-600">
        ¿No encuentras lo que buscas? Revisa la página de
        {" "}
        <Link href="/ayuda" className="underline">Ayuda</Link>.
      </div>
    </div>
  );
}

function TermsTab() {
  return (
    <div className="space-y-4">
      <SectionTitle>Resumen de Términos</SectionTitle>
      <List>
        <li>Al usar PichangApp aceptas nuestras reglas de uso.</li>
        <li>Los organizadores son responsables de sus eventos.</li>
        <li>Reservas se gestionan en la plataforma sin cobros.</li>
        <li>No-show puede ser sancionado por el organizador.</li>
        <li>Respeta la convivencia y conducta deportiva.</li>
      </List>
      <p className="text-xs text-gray-600">
        Lee los términos completos en
        {" "}
        <Link href="/terminos" className="underline">/terminos</Link>.
      </p>
    </div>
  );
}

function PrivacyTab() {
  return (
    <div className="space-y-4">
      <SectionTitle>Resumen de Privacidad</SectionTitle>
      <List>
        <li>Usamos tus datos para coordinar partidos y mejorar tu experiencia.</li>
        <li>No publicamos tu teléfono; sólo para amistad e invitaciones.</li>
        <li>Puedes solicitar acceso o eliminación de datos escribiendo a soporte.</li>
      </List>
      <p className="text-xs text-gray-600">
        Consulta la política completa en
        {" "}
        <Link href="/privacidad" className="underline">/privacidad</Link>.
      </p>
    </div>
  );
}
