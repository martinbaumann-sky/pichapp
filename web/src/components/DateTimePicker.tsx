"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

type Props = { value?: string; onChange: (iso: string) => void };

function generateTimes() {
  const times: string[] = [];
  for (let h = 6; h <= 23; h++) {
    for (let m = 0; m < 60; m += 15) {
      times.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return times;
}

export default function DateTimePicker({ value, onChange }: Props) {
  const initial = value ? new Date(value) : undefined;
  const [date, setDate] = useState<string>(initial ? toLocalDate(initial) : "");
  const [time, setTime] = useState<string>(initial ? toLocalTime(initial) : defaultSuggestedTime());
  const times = useMemo(() => generateTimes(), []);

  // helpers: local date/time strings
  function toLocalDate(d: Date) {
    const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return tz.toISOString().slice(0, 10);
  }
  function toLocalTime(d: Date) {
    return d.toTimeString().slice(0, 5);
  }
  function defaultSuggestedTime() {
    const now = new Date();
    const h = now.getHours();
    // suggest next quarter-hour in evening window
    const base = h < 18 ? 18 : h > 21 ? 19 : h + 1;
    const hh = String(Math.min(base, 21)).padStart(2, "0");
    return `${hh}:00`;
  }

  // Evitar bucle por identidad de onChange desde el padre
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    if (!date || !time) return;
    const local = new Date(`${date}T${time}:00`);
    // normalize to ISO using local timezone
    const iso = new Date(local.getTime() - local.getTimezoneOffset() * 60000).toISOString();
    onChangeRef.current(iso);
  }, [date, time]);

  // quick picks
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const nextSat = nextWeekday(6); // Saturday
  const nextSun = nextWeekday(0); // Sunday

  function nextWeekday(wd: number) {
    const d = new Date();
    const diff = (wd + 7 - d.getDay()) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return d;
  }

  const quickTimes = ["18:00", "19:00", "19:30", "20:00", "20:30"] as const;

  const minDate = toLocalDate(new Date());

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        <input
          aria-label="Fecha"
          type="date"
          min={minDate}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input-field"
        />
        <select
          aria-label="Hora"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="select-field"
        >
          {times.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Quick picks */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => {
            setDate(toLocalDate(today));
            if (time < defaultSuggestedTime()) setTime(defaultSuggestedTime());
          }}
          className="btn-secondary px-3 py-1.5 rounded-full text-xs"
        >
          Hoy
        </button>
        <button
          type="button"
          onClick={() => {
            setDate(toLocalDate(tomorrow));
          }}
          className="btn-secondary px-3 py-1.5 rounded-full text-xs"
        >
          Mañana
        </button>
        <button
          type="button"
          onClick={() => {
            setDate(toLocalDate(nextSat));
            setTime("11:00");
          }}
          className="btn-secondary px-3 py-1.5 rounded-full text-xs"
        >
          Sábado 11:00
        </button>
        <button
          type="button"
          onClick={() => {
            setDate(toLocalDate(nextSun));
            setTime("11:00");
          }}
          className="btn-secondary px-3 py-1.5 rounded-full text-xs"
        >
          Domingo 11:00
        </button>

        <div className="ml-auto text-[11px] text-[color:var(--fg-subtle)]">{Intl.DateTimeFormat().resolvedOptions().timeZone}</div>
      </div>
    </div>
  );
}
