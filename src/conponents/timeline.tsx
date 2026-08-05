import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Heart, Loader2, Plus } from "lucide-react";
import supabase from "../lib/supabase.js";
import type { Momento } from "../lib/tipos";

function Timeline() {
  const [momentos, setMomentos] = useState<Momento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [visibles, setVisibles] = useState<boolean[]>([]);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const [progreso, setProgreso] = useState(0);

  // Trae los momentos desde Supabase
  useEffect(() => {
    const cargarMomentos = async () => {
      setCargando(true);
      const { data, error } = await supabase
        .from("momentos")
        .select("*")
        .order("orden", { ascending: true })
        .order("fecha_orden", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });

      if (error) {
        setError(error.message);
      } else {
        setMomentos(data ?? []);
        setVisibles((data ?? []).map(() => false));
      }
      setCargando(false);
    };

    cargarMomentos();
  }, []);

  // Revelado de cada tarjeta al entrar en pantalla
  useEffect(() => {
    if (momentos.length === 0) return;

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
  }, [momentos]);

  // Línea de progreso continua según el scroll dentro del contenedor de la timeline
  useEffect(() => {
    let ticking = false;

    const calcularProgreso = () => {
      const el = contenedorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const alturaVentana = window.innerHeight;

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
  }, [momentos]);

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
        <div className="flex-1">
          <h1 className="text-lg font-bold leading-tight">Nuestra línea del tiempo</h1>
          <p className="text-xs text-gray-400">Cada momento, un recuerdo</p>
        </div>
        <Link
          to="/AgregarMomento"
          className="p-2 rounded-full bg-pink-500 hover:bg-pink-600 transition"
          title="Agregar momento"
        >
          <Plus size={20} />
        </Link>
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

      {/* Estado de carga */}
      {cargando && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="animate-spin mb-3" size={28} />
          <p className="text-sm">Cargando momentos...</p>
        </div>
      )}

      {/* Estado de error */}
      {!cargando && error && (
        <div className="text-center py-20 px-6">
          <p className="text-red-400 font-medium">No se pudieron cargar los momentos.</p>
          <p className="text-gray-500 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Estado vacío */}
      {!cargando && !error && momentos.length === 0 && (
        <div className="text-center py-20 px-6">
          <p className="text-gray-400">Todavía no hay momentos guardados.</p>
          <Link
            to="/AgregarMomento"
            className="inline-block mt-4 bg-pink-500 hover:bg-pink-600 transition rounded-full px-6 py-2.5 font-semibold text-sm"
          >
            Agregar el primer momento
          </Link>
        </div>
      )}

      {/* Timeline con scroll */}
      {!cargando && !error && momentos.length > 0 && (
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
            {momentos.map((momento, index) => {
              const visible = visibles[index];
              const izquierda = index % 2 === 0;

              return (
                <div
                  key={momento.id}
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
                      transform: `${visible ? "scale(1)" : "scale(0.7)"}`,
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
                      transform: visible ? "translateY(0)" : "translateY(24px)",
                    }}
                  >
                    <div className="bg-white/10 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/[0.13] transition">
                      {momento.imagen_url && (
                        <img
                          src={momento.imagen_url}
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
      )}

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