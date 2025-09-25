type Props = { className?: string };

export default function HeroPitch({ className }: Props) {
  return (
    <svg
      viewBox="0 0 600 400"
      className={`${className} h-auto w-full rounded-[28px] shadow-lg`}
      role="img"
      aria-label="Cancha de fútbol"
    >
      <defs>
        <linearGradient id="pitchGradient" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#006989" />
          <stop offset="60%" stopColor="#005570" />
          <stop offset="100%" stopColor="#003f52" />
        </linearGradient>
        <radialGradient id="centerGlow" cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="55%" stopColor="rgba(255,255,255,0.04)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="lineGradient" x1="0" x2="1">
          <stop offset="0%" stopColor="#d6e6ec" />
          <stop offset="100%" stopColor="#f0f6f9" />
        </linearGradient>
        <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="rgba(0,0,0,0.18)" />
        </filter>
      </defs>
      <rect x="0" y="0" width="600" height="400" fill="url(#pitchGradient)" rx="32" />
      <rect x="0" y="0" width="600" height="400" fill="url(#centerGlow)" rx="32" />
      <rect x="16" y="16" width="568" height="368" fill="none" stroke="url(#lineGradient)" strokeWidth="4" rx="28" />
      <line x1="300" y1="16" x2="300" y2="384" stroke="url(#lineGradient)" strokeWidth="4" />
      <circle cx="300" cy="200" r="52" fill="none" stroke="url(#lineGradient)" strokeWidth="4" />
      <circle cx="300" cy="200" r="6" fill="#f0f6f9" />

      {/* área izquierda */}
      <g stroke="url(#lineGradient)" strokeWidth="4" filter="url(#softShadow)">
        <rect x="16" y="108" width="88" height="184" fill="none" rx="18" />
        <rect x="16" y="148" width="44" height="104" fill="none" rx="12" />
        <path d="M16 176h-12v48h12" fill="none" strokeLinecap="round" />
        <circle cx="104" cy="200" r="3" fill="#f0f6f9" stroke="none" />
      </g>

      {/* área derecha */}
      <g stroke="url(#lineGradient)" strokeWidth="4" filter="url(#softShadow)">
        <rect x="496" y="108" width="88" height="184" fill="none" rx="18" />
        <rect x="540" y="148" width="44" height="104" fill="none" rx="12" />
        <path d="M584 176h12v48h-12" fill="none" strokeLinecap="round" />
        <circle cx="496" cy="200" r="3" fill="#f0f6f9" stroke="none" />
      </g>

      {/* esquinas */}
      <g stroke="url(#lineGradient)" strokeWidth="4" strokeLinecap="round">
        <path d="M52 16a36 36 0 0 0-36 36" fill="none" />
        <path d="M548 16a36 36 0 0 1 36 36" fill="none" />
        <path d="M16 348a36 36 0 0 0 36 36" fill="none" />
        <path d="M548 384a36 36 0 0 0 36-36" fill="none" />
      </g>
    </svg>
  );
}


