import clsx from "clsx";

export default function HeroCancha({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={clsx("drop-shadow-sm", className)}
      role="img"
      aria-label="Ilustración de una cancha de fútbol"
    >
      <rect x="10" y="10" width="380" height="380" rx="20" fill="#f8fafc" stroke="#e5e7eb" strokeWidth="4" />
      <line x1="200" y1="10" x2="200" y2="390" stroke="#d1d5db" strokeWidth="2" />
      <circle cx="200" cy="200" r="40" fill="none" stroke="#d1d5db" strokeWidth="2" />
      <rect x="10" y="120" width="40" height="160" fill="none" stroke="#d1d5db" strokeWidth="2" />
      <rect x="350" y="120" width="40" height="160" fill="none" stroke="#d1d5db" strokeWidth="2" />
    </svg>
  );
}


