"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, Clock, Trophy } from "lucide-react";
import { nivelES } from "@/lib/i18n";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import DateTimePicker from "@/components/DateTimePicker";
import { staticMapUrl } from "@/lib/maps";
import { streetViewUrl } from "@/lib/places";

export default function CreateMatchPage() {
  const [formData, setFormData] = useState({
    title: "",
    comuna: "",
    startsAt: "",
    durationMins: 90,
    pricePerSpot: "",
    totalSpots: 10,
    level: "BEGINNER",
    venueName: "",
    venueAddress: "",
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
    place_id: undefined as string | undefined,
    photoUrl: undefined as string | undefined,
    displayAddress: "",
    occupiedSpots: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let coverImageUrl: string | undefined = formData.photoUrl || undefined;
      if (!coverImageUrl && formData.lat && formData.lng) {
        const sv = streetViewUrl(formData.lat, formData.lng);
        coverImageUrl = sv || staticMapUrl({ lat: formData.lat, lng: formData.lng }) || undefined;
      }
      if (coverImageUrl && !/^https?:\/\//i.test(coverImageUrl)) {
        coverImageUrl = undefined;
      }
      const payload = {
        ...formData,
        // Normalizar strings a números
        pricePerSpot: Number(formData.pricePerSpot || 0),
        durationMins: Number(formData.durationMins || 0),
        totalSpots: Number(formData.totalSpots || 0),
        occupiedSpots: Number(formData.occupiedSpots || 0) || 0,
        // Asegurar strings para address/name aun si van vacíos
        venueName: formData.venueName || "",
        venueAddress: formData.venueAddress || formData.displayAddress || "",
        comuna: formData.comuna || "",
        coverImageUrl,
      } as any;
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let msg = "Error al crear partido";
        try {
          const j = await res.json();
          if (j?.message) msg = j.message;
          else if (j?.error) msg = j.error;
          console.error("/api/matches error", j);
        } catch (e) {
          console.error("/api/matches error (no json)", e);
        }
        alert(msg);
        return;
      }
      window.location.href = "/explorar";
    } catch (err) {
      alert("No se pudo crear el partido. Intenta nuevamente.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Usar useCallback para estabilizar las funciones
  const handleDateTimeChange = useCallback((iso: string) => {
    setFormData(prev => ({ ...prev, startsAt: iso }));
  }, []);

  const handleAddressChange = useCallback((v: any) => {
    setFormData(prev => ({ 
      ...prev, 
      displayAddress: v.display ?? "", 
      venueName: v.venueName ?? prev.venueName, 
      venueAddress: v.venueAddress ?? prev.venueAddress, 
      lat: v.lat ?? prev.lat, 
      lng: v.lng ?? prev.lng, 
      place_id: v.place_id ?? prev.place_id, 
      photoUrl: v.photoUrl ?? prev.photoUrl 
    }));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-black">Crear Nuevo Partido</h1>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-black border-b border-gray-200 pb-2">
                Información Básica
              </h2>
              
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Título del partido
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                  placeholder="Ej: Club Los Maitenes - Cancha 2"
                    required
                  />
                <p className="text-xs text-gray-500">Sugerencia: incluye nombre de cancha/club/estadio.</p>
                </div>
              
              </div>
            </div>

            {/* Date & Time Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-black border-b border-gray-200 pb-2">
                Fecha y Hora
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Fecha y hora de inicio
                  </label>
                  <DateTimePicker value={formData.startsAt} onChange={handleDateTimeChange} />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Duración (minutos)
                  </label>
                  <input
                    type="number"
                    name="durationMins"
                    min={30}
                    max={180}
                    step={5}
                    value={formData.durationMins}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                  />
                  <p className="text-xs text-gray-500">Entre 30 y 180 minutos</p>
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-black border-b border-gray-200 pb-2">
                Detalles del Partido
              </h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Precio por cupo (CLP)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      name="pricePerSpot"
                      value={formData.pricePerSpot}
                      onChange={handleChange}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                      placeholder="3000"
                      min="500"
                      step="500"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Total de cupos
                  </label>
                  <input
                    type="number"
                    name="totalSpots"
                    min={1}
                    max={30}
                    step={1}
                    value={formData.totalSpots}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duración-200"
                  />
                  <p className="text-xs text-gray-500">Entre 6 y 30 jugadores</p>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Cupos ya ocupados por el organizador
                  </label>
                  <input
                    type="number"
                    name="occupiedSpots"
                    min={0}
                    max={formData.totalSpots}
                    step={1}
                    value={formData.occupiedSpots}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duración-200"
                  />
                  <p className="text-xs text-gray-500">Estos cupos quedarán como pagados desde el inicio.</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Nivel
                  </label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                  >
                    {Object.entries(nivelES).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Venue */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-black border-b border-gray-200 pb-2">Lugar</h2>
              <AddressAutocomplete
                value={formData.displayAddress}
                onChange={(v) => {
                  handleAddressChange(v);
                  if (v.comuna) setFormData((prev) => ({ ...prev, comuna: v.comuna }));
                }}
              />
              {formData.venueName && (
                <p className="text-sm text-gray-600">Se guardará como: {formData.title ? `${formData.title} — ${formData.venueName}` : formData.venueName}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                className="w-full px-8 py-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Crear Partido
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
