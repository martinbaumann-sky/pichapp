"use client";

export default function AnimatedBall() {
  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ contain: "layout paint" }}>
      <div className="ball w-8 h-8 rounded-full absolute" />
      <style jsx>{`
        .ball {
          background: radial-gradient(circle at 30% 30%, #ffffff 0%, #f2f2f2 40%, #e5e5e5 60%, #d4d4d4 100%);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          animation: moveBall 6s cubic-bezier(0.22, 1, 0.36, 1) infinite;
        }
        @keyframes moveBall {
          0% { transform: translate(80px, 40px) rotate(0deg); }
          20% { transform: translate(380px, 60px) rotate(80deg); }
          40% { transform: translate(520px, 220px) rotate(140deg); }
          60% { transform: translate(300px, 300px) rotate(220deg); }
          80% { transform: translate(120px, 220px) rotate(300deg); }
          100% { transform: translate(80px, 40px) rotate(360deg); }
        }
        @media (max-width: 768px) {
          .ball { animation-duration: 5s; }
          @keyframes moveBall {
            0% { transform: translate(30px, 20px) rotate(0deg); }
            20% { transform: translate(150px, 30px) rotate(80deg); }
            40% { transform: translate(200px, 120px) rotate(140deg); }
            60% { transform: translate(130px, 160px) rotate(220deg); }
            80% { transform: translate(50px, 120px) rotate(300deg); }
            100% { transform: translate(30px, 20px) rotate(360deg); }
          }
        }
      `}</style>
    </div>
  );
}


