"use client";

export default function AnimatedBall() {
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden" style={{ contain: "layout paint" }}>
      <div className="ball w-4 h-4 md:w-6 md:h-6 rounded-full absolute" />
      <style jsx>{`
        .ball {
          background: radial-gradient(circle at 30% 30%, #ffffff 0%, #f8f8f8 30%, #e8e8e8 60%, #d0d0d0 100%);
          box-shadow: 0 2px 6px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.3);
          border: 1px solid rgba(0,0,0,0.1);
          animation: longPasses 20s ease-in-out infinite;
        }
        
        /* Animación profesional de pases largos - Desktop */
        @keyframes longPasses {
          /* Pase largo desde área izquierda hacia área derecha */
          0% { 
            transform: translate(150px, 200px) rotate(0deg);
            animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          /* Punto medio del pase largo */
          12% { 
            transform: translate(300px, 150px) rotate(180deg);
            animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          /* Llegada al área derecha */
          24% { 
            transform: translate(450px, 200px) rotate(360deg);
            animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          /* Pausa en el área derecha */
          30% { 
            transform: translate(450px, 200px) rotate(360deg);
            animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          /* Pase largo desde área derecha hacia área izquierda */
          42% { 
            transform: translate(300px, 150px) rotate(540deg);
            animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          /* Llegada al área izquierda */
          54% { 
            transform: translate(150px, 200px) rotate(720deg);
            animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          /* Pausa en el área izquierda */
          60% { 
            transform: translate(150px, 200px) rotate(720deg);
            animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          /* Pase largo diagonal desde área izquierda hacia área derecha */
          72% { 
            transform: translate(300px, 150px) rotate(900deg);
            animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          /* Llegada al área derecha */
          84% { 
            transform: translate(450px, 250px) rotate(1080deg);
            animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          /* Pausa final */
          90% { 
            transform: translate(450px, 250px) rotate(1080deg);
            animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          /* Regreso al inicio */
          100% { 
            transform: translate(150px, 200px) rotate(1080deg);
            animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
        }
        
        /* Tablet - Pases largos profesionales */
        @media (max-width: 1024px) and (min-width: 769px) {
          .ball { 
            animation-duration: 16s;
            width: 5px;
            height: 5px;
          }
          @keyframes longPasses {
            0% { transform: translate(120px, 170px) rotate(0deg); }
            12% { transform: translate(250px, 130px) rotate(180deg); }
            24% { transform: translate(380px, 170px) rotate(360deg); }
            30% { transform: translate(380px, 170px) rotate(360deg); }
            42% { transform: translate(250px, 130px) rotate(540deg); }
            54% { transform: translate(120px, 170px) rotate(720deg); }
            60% { transform: translate(120px, 170px) rotate(720deg); }
            72% { transform: translate(250px, 130px) rotate(900deg); }
            84% { transform: translate(380px, 220px) rotate(1080deg); }
            90% { transform: translate(380px, 220px) rotate(1080deg); }
            100% { transform: translate(120px, 170px) rotate(1080deg); }
          }
        }
        
        /* Mobile - Pases largos profesionales */
        @media (max-width: 768px) {
          .ball { 
            animation-duration: 12s;
            width: 4px;
            height: 4px;
          }
          @keyframes longPasses {
            0% { transform: translate(100px, 150px) rotate(0deg); }
            12% { transform: translate(200px, 120px) rotate(180deg); }
            24% { transform: translate(300px, 150px) rotate(360deg); }
            30% { transform: translate(300px, 150px) rotate(360deg); }
            42% { transform: translate(200px, 120px) rotate(540deg); }
            54% { transform: translate(100px, 150px) rotate(720deg); }
            60% { transform: translate(100px, 150px) rotate(720deg); }
            72% { transform: translate(200px, 120px) rotate(900deg); }
            84% { transform: translate(300px, 200px) rotate(1080deg); }
            90% { transform: translate(300px, 200px) rotate(1080deg); }
            100% { transform: translate(100px, 150px) rotate(1080deg); }
          }
        }
        
        /* Mobile pequeño - Pases largos profesionales */
        @media (max-width: 480px) {
          .ball { 
            animation-duration: 10s;
            width: 3px;
            height: 3px;
          }
          @keyframes longPasses {
            0% { transform: translate(80px, 130px) rotate(0deg); }
            12% { transform: translate(150px, 100px) rotate(180deg); }
            24% { transform: translate(220px, 130px) rotate(360deg); }
            30% { transform: translate(220px, 130px) rotate(360deg); }
            42% { transform: translate(150px, 100px) rotate(540deg); }
            54% { transform: translate(80px, 130px) rotate(720deg); }
            60% { transform: translate(80px, 130px) rotate(720deg); }
            72% { transform: translate(150px, 100px) rotate(900deg); }
            84% { transform: translate(220px, 170px) rotate(1080deg); }
            90% { transform: translate(220px, 170px) rotate(1080deg); }
            100% { transform: translate(80px, 130px) rotate(1080deg); }
          }
        }
      `}</style>
    </div>
  );
}


