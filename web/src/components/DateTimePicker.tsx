"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

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
  const [date, setDate] = useState<string>(value ? new Date(value).toISOString().slice(0, 10) : "");
  const [time, setTime] = useState<string>(value ? new Date(value).toTimeString().slice(0, 5) : "19:00");
  const times = useMemo(() => generateTimes(), []);

  // Usar useCallback para estabilizar la función onChange
  const handleChange = useCallback((iso: string) => {
    onChange(iso);
  }, [onChange]);

  useEffect(() => {
    if (!date || !time) return;
    const iso = new Date(`${date}T${time}:00`).toISOString();
    handleChange(iso);
  }, [date, time, handleChange]);

  return (
    <div className="grid grid-cols-2 gap-3">
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-4 py-3 border rounded-lg" />
      <select value={time} onChange={(e) => setTime(e.target.value)} className="px-4 py-3 border rounded-lg">
        {times.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
    </div>
  );
}


