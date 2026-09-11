import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Box, Sparkles } from "lucide-react";

import imagenFigura from "../assets/love.jpg";

function Figura3D() {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [brillo, setBrillo] = useState({ x: 50, y: 50 });

  // Tilt con el mouse (desktop)
  const manejarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = contenedorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; // 0 a 1
    const py = (e.clientY - rect.top) / rect.height; // 0 a 1

    const maxDeg = 14;
    setTilt({
      x: (py - 0.5) * -maxDeg, // rotateX
      y: (px - 0.5) * maxDeg, // rotateY
    });
    setBrillo({ x: px * 100, y: py * 100 });
  };

  const resetTilt = () => {
    setTilt({ x: 0, y: 0 });
    setBrillo({ x: 50, y: 50 });
  };

  // Tilt con el giroscopio (móvil)
  useEffect(() => {
    const manejarOrientacion = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      const maxDeg = 12;
      const x = Math.max(-maxDeg, Math.min(maxDeg, (e.beta - 45) * -0.3));
      const y = Math.max(-maxDeg, Math.min(maxDeg, e.gamma * 0.3));
      setTilt({ x, y });
    };

    window.addEventListener("deviceorientation", manejarOrientacion);
    return () =>
      window.removeEventListener("deviceorientation", manejarOrientacion);
  }, []);

  return (
    <section className="px-6 py-10">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap');
        .fuente-elegante { font-family: 'Playfair Display', Georgia, serif; }
      `}</style>

      {/* Volver */}
      <Link
        to="/nosotros"
        className="inline-flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition mb-8"
      >
        <ArrowLeft size={18} />
        Volver
      </Link>

      {/* Título */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-5">
          <div className="border border-[#FF7EB6]/40 p-5 rounded-full">
            <Box size={40} className="text-[#FF7EB6]" strokeWidth={1.5} />
          </div>
        </div>
        <h1 className="fuente-elegante text-4xl sm:text-5xl font-bold tracking-tight">
          Figura 3D
        </h1>
        <div className="w-14 h-px bg-[#B388FF]/60 mx-auto mt-4 mb-4" />
        <p className="text-sm sm:text-base tracking-wide opacity-70">
          Un recuerdo nuestro hecho realidad en 3D
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-8">
        {/* Vista de la figura con efecto 3D */}
        <div className="rounded-3xl p-8 border border-[#453A67]/40">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="text-[#B388FF]" size={28} strokeWidth={1.5} />
            <h2 className="fuente-elegante text-2xl font-semibold">
              Nuestra figura
            </h2>
          </div>

          <div
            style={{ perspective: "1000px" }}
            className="flex justify-center"
          >
            <div
              ref={contenedorRef}
              onMouseMove={manejarMouseMove}
              onMouseLeave={resetTilt}
              className="relative rounded-2xl border border-[#453A67]/40 aspect-square w-full max-w-md overflow-hidden cursor-pointer select-none"
              style={{
                transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.02, 1.02, 1.02)`,
                transformStyle: "preserve-3d",
                transition: "transform 150ms ease-out",
              }}
            >
              {/* Imagen con leve efecto de profundidad */}
              <img
                src={imagenFigura}
                alt="Figura 3D de nosotros"
                className="w-full h-full object-cover pointer-events-none"
                style={{
                  transform: "translateZ(20px) scale(1.08)",
                  transformStyle: "preserve-3d",
                }}
                draggable={false}
              />

              {/* Brillo dinámico que sigue el mouse, da sensación de luz sobre una superficie 3D */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at ${brillo.x}% ${brillo.y}%, rgba(255,255,255,0.25), transparent 55%)`,
                  mixBlendMode: "overlay",
                }}
              />

              {/* Sombra sutil en los bordes para reforzar la profundidad */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  boxShadow: "inset 0 0 60px rgba(0,0,0,0.35)",
                }}
              />
            </div>
          </div>

          <p className="mt-6 leading-relaxed opacity-80 text-center">
            Este pequeño recuerdo representa un momento especial entre
            nosotros, hecho realidad para tenerlo siempre cerca ❤️
          </p>
          <p className="mt-2 text-xs text-center opacity-50">
            Mueve el mouse (o inclina el celular) para verla en 3D
          </p>
        </div>
      </div>
    </section>
  );
}

export default Figura3D;