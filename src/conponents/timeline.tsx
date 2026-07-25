import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Heart } from "lucide-react";

type Momento = {
  icono: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  imagen?: string; // reemplaza con la URL de tu propia foto
};

const MOMENTOS: Momento[] = [
  {
    icono: "📅",
    titulo: "Nos conocimos",
    descripcion:
      "Fue en una fiesta de un amigo en común, casi no vamos ninguno de los dos.",
    fecha: "10 Enero 2024",
    imagen: "https://placehold.co/600x400/241539/f472b6?text=Foto+1",
  },
  {
    icono: "💬",
    titulo: "Primera conversación",
    descripcion:
      "Empezamos a hablar por chat esa misma noche y no paramos hasta las 3am.",
    fecha: "10 Enero 2024",
    imagen: "https://placehold.co/600x400/241539/f472b6?text=Foto+2",
  },
  {
    icono: "☕",
    titulo: "Primera cita",
    descripcion:
      "Un café que se convirtió en 4 horas de conversación sin darnos cuenta.",
    fecha: "2 Febrero 2024",
    imagen: "https://placehold.co/600x400/241539/f472b6?text=Foto+3",
  },
  {
    icono: "❤️",
    titulo: "Nos hicimos pareja",
    descripcion: "En el parque, bajo la lluvia, justo como en las películas.",
    fecha: "15 Marzo 2024",
    imagen: "https://placehold.co/600x400/241539/f472b6?text=Foto+4",
  },
  {
    icono: "🎉",
    titulo: "Primer aniversario",
    descripcion:
      "Celebramos con una cena sorpresa y una carta que hizo llorar a los dos.",
    fecha: "15 Marzo 2025",
    imagen: "https://placehold.co/600x400/241539/f472b6?text=Foto+5",
  },
  {
    icono: "📸",
    titulo: "Momentos especiales",
    descripcion:
      "Viajes, risas, discusiones tontas y muchas fotos que guardamos con cariño.",
    fecha: "Todo el año",
    imagen: "https://placehold.co/600x400/241539/f472b6?text=Foto+6",
  },
  {
    icono: "💍",
    titulo: "Futuro juntos",
    descripcion:
      "Lo que sigue está por escribirse, y no podríamos estar más emocionados.",
    fecha: "Por vivir",
  },
];

function Timeline() {
  const [visibles, setVisibles] = useState<boolean[]>(() =>
    MOMENTOS.map(() => false)
  );
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const [progreso, setProgreso] = useState(0); // 0 a 1, avance de la línea general

  // Revelado de cada tarjeta al entrar en pantalla
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute("data-index"));
          setVisibles((prev) => {
            if (prev[index] === entry.isIntersecting) return prev;
            const copia = [...prev];
            copia[index] = entry.isIntersecting;
            return copia;
          });
        });
      },
      { threshold: 0.25, rootMargin: "0px 0px -10% 0px" }
    );

    refs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Línea de progreso continua según el scroll dentro del contenedor de la timeline
  useEffect(() => {
    let ticking = false;

    const calcularProgreso = () => {
      const el = contenedorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const alturaVentana = window.innerHeight;

      // Empieza a llenarse cuando el top del contenedor entra en pantalla
      // y termina de llenarse cuando el bottom del contenedor pasa el centro de pantalla
      const inicio = alturaVentana * 0.85;
      const fin = alturaVentana * 0.35;

      const totalRecorrido = rect.height + inicio - fin;
      const avanzado = inicio - rect.top;

      const pct = Math.min(1, Math.max(0, avanzado / totalRecorrido));
      setProgreso(pct);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(calcularProgreso);
        ticking = true;
      }
    };

    calcularProgreso();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#1B1033] text-white pb-16">
      {/* Encabezado */}
      <div className="sticky top-0 z-20 bg-[#1B1033]/90 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <Link
          to="/nosotros"
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-lg font-bold leading-tight">Nuestra línea del tiempo</h1>
          <p className="text-xs text-gray-400">Cada momento, un recuerdo</p>
        </div>
      </div>

      <div className="text-center mt-8 mb-10 px-6">
        <div className="flex justify-center mb-3">
          <div className="bg-pink-500/20 p-4 rounded-full">
            <Heart size={36} className="text-pink-400 fill-pink-400" />
          </div>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold">Nuestra historia completa</h2>
        <p className="text-gray-400 mt-2 text-sm">
          Desplázate para revivir cada capítulo ❤️
        </p>
      </div>

      {/* Timeline con scroll */}
      <div
        ref={contenedorRef}
        className="relative max-w-3xl mx-auto px-4 sm:px-6"
      >
        {/* Riel de fondo */}
        <div className="absolute left-[27px] sm:left-1/2 top-0 bottom-0 w-1 bg-white/10 sm:-translate-x-1/2 rounded-full" />
        {/* Riel de progreso */}
        <div
          className="absolute left-[27px] sm:left-1/2 top-0 w-1 bg-gradient-to-b from-pink-400 to-fuchsia-500 sm:-translate-x-1/2 rounded-full transition-[height] duration-150 ease-out"
          style={{ height: `${progreso * 100}%` }}
        />

        <div className="relative space-y-10 sm:space-y-16 py-4">
          {MOMENTOS.map((momento, index) => {
            const visible = visibles[index];
            const izquierda = index % 2 === 0;

            return (
              <div
                key={index}
                ref={(el) => { refs.current[index] = el; }}
                data-index={index}
                className={`relative flex items-start sm:items-center gap-4 sm:gap-8 ${
                  izquierda ? "sm:flex-row" : "sm:flex-row-reverse"
                }`}
              >
                {/* Punto en el riel */}
                <div
                  className="absolute left-[13px] sm:left-1/2 top-1 sm:top-1/2 sm:-translate-y-1/2 sm:-translate-x-1/2 z-10 w-7 h-7 rounded-full bg-[#1B1033] border-2 border-pink-400 flex items-center justify-center text-sm transition-all duration-500"
                  style={{
                    opacity: visible ? 1 : 0.35,
                    transform: `${
                      visible ? "scale(1)" : "scale(0.7)"
                    }`,
                  }}
                >
                  {momento.icono}
                </div>

                {/* Espaciador para el punto en mobile */}
                <div className="w-9 sm:hidden shrink-0" />

                {/* Tarjeta */}
                <div
                  className={`flex-1 sm:w-[calc(50%-2rem)] transition-all duration-700 ease-out ${
                    izquierda ? "sm:text-right" : "sm:text-left"
                  }`}
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible
                      ? "translateY(0)"
                      : "translateY(24px)",
                  }}
                >
                  <div className="bg-white/10 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/[0.13] transition">
                    {momento.imagen && (
                      <img
                        src={momento.imagen}
                        alt={momento.titulo}
                        className="w-full h-40 sm:h-48 object-cover"
                        loading="lazy"
                      />
                    )}
                    <div className="p-4 sm:p-5">
                      <div
                        className={`flex items-center gap-2 flex-wrap ${
                          izquierda ? "sm:justify-end" : "sm:justify-start"
                        }`}
                      >
                        <span className="text-xs sm:text-sm text-pink-400 font-semibold">
                          {momento.fecha}
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold mt-1">
                        {momento.titulo}
                      </h3>
                      <p className="text-gray-300 mt-1.5 text-sm sm:text-base leading-relaxed">
                        {momento.descripcion}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Espaciador simétrico en desktop */}
                <div className="hidden sm:block sm:w-[calc(50%-2rem)]" />
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center mt-12 px-6">
        <Link
          to="/nosotros"
          className="inline-block bg-pink-500 hover:bg-pink-600 transition rounded-full px-8 py-3 font-bold"
        >
          ← Volver a Nosotros
        </Link>
      </div>
    </div>
  );
}

export default Timeline;