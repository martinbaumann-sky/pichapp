type Props = { className?: string };

export default function HeroPitch({ className }: Props) {
  return (
    <svg viewBox="0 0 600 400" className={className} role="img" aria-label="Cancha de fútbol">
      <rect x="0" y="0" width="600" height="400" fill="#0b8f3d" rx="24" />
      <rect x="12" y="12" width="576" height="376" fill="none" stroke="#e8f5e9" strokeWidth="4" rx="20" />
      <line x1="300" y1="12" x2="300" y2="388" stroke="#e8f5e9" strokeWidth="4" />
      <circle cx="300" cy="200" r="48" fill="none" stroke="#e8f5e9" strokeWidth="4" />
      <circle cx="300" cy="200" r="3" fill="#e8f5e9" />
      {/* Área izquierda */}
      <rect x="12" y="110" width="80" height="180" fill="none" stroke="#e8f5e9" strokeWidth="4" />
      <rect x="12" y="150" width="40" height="100" fill="none" stroke="#e8f5e9" strokeWidth="4" />
      <circle cx="92" cy="200" r="2" fill="#e8f5e9" />
      {/* Arco izq */}
      <rect x="0" y="175" width="12" height="50" fill="#e8f5e9" />
      {/* Área derecha */}
      <rect x="508" y="110" width="80" height="180" fill="none" stroke="#e8f5e9" strokeWidth="4" />
      <rect x="548" y="150" width="40" height="100" fill="none" stroke="#e8f5e9" strokeWidth="4" />
      <circle cx="508" cy="200" r="2" fill="#e8f5e9" />
      {/* Arco der */}
      <rect x="588" y="175" width="12" height="50" fill="#e8f5e9" />
    </svg>
  );
}


