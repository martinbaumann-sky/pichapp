"use client";

import { useEffect, useMemo, useRef } from "react";

export default function AnimatedBall() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);

  const reduceMotion = useMemo(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const ball = ballRef.current;
    if (!wrapper || !ball) return;

    if (reduceMotion) {
      ball.style.transform = "translate(50%, 50%)";
      return;
    }

    let animation: Animation | null = null;
    const ro = new ResizeObserver(() => start());
    ro.observe(wrapper);

    function start() {
      const { width: w, height: h } = wrapper.getBoundingClientRect();

      // Puntos como porcentaje del campo (0..1), pensados en viewBox 600x400
      const points = [
        { x: 0.16, y: 0.50, r: 0 }, // área izq
        { x: 0.33, y: 0.40, r: 90 },
        { x: 0.60, y: 0.48, r: 180 }, // pase largo al medio-derecha
        { x: 0.84, y: 0.52, r: 270 }, // área der
        { x: 0.84, y: 0.52, r: 360 }, // breve control
        { x: 0.60, y: 0.35, r: 450 }, // cambio diagonal
        { x: 0.33, y: 0.60, r: 540 },
        { x: 0.16, y: 0.50, r: 720 }, // regresa a área izq
      ];

      const ease = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      const kfs: Keyframe[] = points.map((p, i) => ({
        transform: `translate(${Math.round(p.x * w)}px, ${Math.round(p.y * h)}px) rotate(${p.r}deg)`,
        easing: i === 0 ? undefined : ease,
        offset: i / (points.length - 1),
      }));

      // Cancel previous
      animation?.cancel();
      animation = ball.animate(kfs, {
        duration: 16000,
        iterations: Infinity,
        fill: "both",
      });
    }

    start();
    return () => {
      ro.disconnect();
      animation?.cancel();
    };
  }, [reduceMotion]);

  return (
    <div
      ref={wrapperRef}
      aria-hidden
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ contain: "layout paint style", isolation: "isolate" }}
    >
      <div ref={ballRef} className="ball" />
      <style jsx>{`
        .ball {
          position: absolute;
          left: 0;
          top: 0;
          width: clamp(10px, 0.9rem, 14px);
          height: clamp(10px, 0.9rem, 14px);
          border-radius: 9999px;
          background: radial-gradient(circle at 30% 30%, #ffffff 0%, #fafafa 35%, #eaeaea 65%, #d5d5d5 100%);
          border: 1px solid rgba(0,0,0,0.12);
          box-shadow:
            0 2px 6px rgba(0, 0, 0, 0.25),
            inset 0 1px 2px rgba(255,255,255,0.35);
          will-change: transform;
          transform: translate(50%, 50%);
        }

        @media (max-width: 768px) {
          .ball {
            width: clamp(8px, 0.8rem, 12px);
            height: clamp(8px, 0.8rem, 12px);
            box-shadow:
              0 1px 4px rgba(0, 0, 0, 0.22),
              inset 0 1px 2px rgba(255,255,255,0.35);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ball { animation: none !important; }
        }
      `}</style>
    </div>
  );
}


