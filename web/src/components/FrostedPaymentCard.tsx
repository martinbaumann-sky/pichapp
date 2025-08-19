"use client";

import React from "react";
import { ChevronLeft } from "lucide-react";

type Props = {
  amountCLP: number;
  onPayMP: () => void;
  onPayTB: () => void;
  onClose: () => void;
};

export default function FrostedPaymentCard({ amountCLP, onPayMP, onPayTB, onClose }: Props) {
  return (
    <div className="sm:max-w-md w-[92vw] max-w-md p-6 bg-transparent sm:rounded-2xl rounded-none max-h-[90vh] overflow-auto focus:outline-none animate-[fadeIn_150ms_ease-out]">
      <div className="relative overflow-hidden rounded-3xl p-6" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 6px 30px rgba(0,0,0,0.35)' }}>
        {/* decoración sutil, sin blur que afecte contenido */}
        <div className="relative z-10 text-white">
          <div className="mb-3">
            <button type="button" onClick={onClose} className="p-2 rounded-md bg-white/8 hover:bg-white/16 text-white">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Pagar cupo</h3>
          <p className="text-white/90 mb-4">Precio: <span className="font-semibold">{new Intl.NumberFormat("es-CL",{ style:"currency", currency:"CLP", maximumFractionDigits:0}).format(amountCLP)}</span></p>

          <div className="space-y-3">
            <button onClick={onPayMP} className="w-full px-4 py-3 bg-black text-white rounded shadow">Pagar con MercadoPago</button>
            <button onClick={onPayTB} className="w-full px-4 py-3 bg-black text-white rounded shadow">Pagar con Transbank (sandbox)</button>
          </div>
        </div>
      </div>
    </div>
  );
}


