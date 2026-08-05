import { useState, useEffect, useRef } from "react";
import {
  Heart,
  CalendarDays,
  Sparkles,
  Camera,
  Flame,
  Trophy,
  Gift,
  Gamepad2,
  BarChart3,
  BookHeart,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import supabase from "../lib/supabase.js";

/* ---------- Helpers de fechas ---------- */
function diasEntre(desde: Date, hasta: Date) {
  const a = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate());
  const b = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate());
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}
function diaDelAnio(fecha: Date) {
  const inicio = new Date(fecha.getFullYear(), 0, 0);
  const diff = fecha.getTime() - inicio.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
function diasHastaProximo(mes: number, dia: number) {
  const hoy = new Date();
  const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  let proxima = new Date(hoy.getFullYear(), mes - 1, dia);
  if (proxima < hoySinHora) {
    proxima = new Date(hoy.getFullYear() + 1, mes - 1, dia);
  }
  return Math.round((proxima.getTime() - hoySinHora.getTime()) / (1000 * 60 * 60 * 24));
}

/* ---------- Contador animado (efecto "van pasando los números") ---------- */
function ContadorAnimado({ valor, duracion = 1500 }: { valor: number; duracion?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let inicio: number | null = null;
    let frame: number;
    const paso = (timestamp: number) => {
      if (inicio === null) inicio = timestamp;
      const progreso = Math.min((timestamp - inicio) / duracion, 1);
      setDisplay(Math.floor(progreso * valor));
      if (progreso < 1) {
        frame = requestAnimationFrame(paso);
      } else {
        setDisplay(valor);
      }
    };
    frame = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(frame);
  }, [valor, duracion]);

  return <>{display.toLocaleString("es-ES")}</>;
}

/* ---------- Reveal: aparece con fade + slide cuando entra en pantalla ---------- */
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out will-change-transform ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

/* ---------- Tipos ---------- */
interface ExplorarItem {
  id: string;
  to: string | null;
  icon: LucideIcon;
  iconBg: string;
  title: string;
  desc: string;
  button: string;
  buttonClass: string;
  disabled?: boolean;
}

interface RecuerdoAlbum {
  id: string;
  image_path: string | null;
  descripcion: string | null;
}

function Inicio() {
  const fechaInicio = new Date("2022-05-22");
  const hoy = new Date();
  const diasJuntos = diasEntre(fechaInicio, hoy);
  const mensajes = [
    "Gracias por ser mi persona favorita ❤️",
    "Cada día contigo es un nuevo recuerdo ✨",
    "Contigo cualquier momento se vuelve especial 💕",
    "Siempre elegiría caminar a tu lado 🫶",
    "Eres mi lugar favorito para volver 🏡💗",
    "Contigo hasta lo simple se siente mágico 🌙",
    "Gracias por tantas risas y tantos abrazos 🤍",
    "Cada día te elijo un poco más 💫",
    "Tú y yo, siempre 🫂",
    "El amor contigo se siente fácil y bonito 🌸",
  ];
  const indiceDelDia = diaDelAnio(hoy);
  const mensaje = mensajes[indiceDelDia % mensajes.length];

  /* ---------- Recuerdo aleatorio (desde Supabase) ---------- */
  const [recuerdo, setRecuerdo] = useState<RecuerdoAlbum | null>(null);
  const [recuerdoUrl, setRecuerdoUrl] = useState<string | null>(null);
  const [cargandoRecuerdo, setCargandoRecuerdo] = useState(true);
  const [imagenCargada, setImagenCargada] = useState(false);

  useEffect(() => {
    let activo = true;

    const cargarRecuerdoAleatorio = async () => {
      setCargandoRecuerdo(true);

      const { data, error } = await supabase
        .from("album")
        .select("id, image_path, descripcion");

      if (!activo) return;

      if (error || !data || data.length === 0) {
        console.error("Error cargando recuerdo:", error);
        setCargandoRecuerdo(false);
        return;
      }

      const indiceAleatorio = Math.floor(Math.random() * data.length);
      const elegido = data[indiceAleatorio] as RecuerdoAlbum;
      setRecuerdo(elegido);

      if (elegido.image_path) {
        const { data: publicUrlData } = supabase.storage
          .from("fotos")
          .getPublicUrl(elegido.image_path);
        setRecuerdoUrl(publicUrlData?.publicUrl ?? null);
      } else {
        setRecuerdoUrl(null);
      }

      setCargandoRecuerdo(false);
    };

    cargarRecuerdoAleatorio();

    return () => {
      activo = false;
    };
  }, []);

  const proximasFechas = [
    {
      emoji: "🎂",
      titulo: "Cumpleaños de Adixon",
      fechaTexto: "25 Abril",
      dias: diasHastaProximo(4, 25),
    },
    {
      emoji: "🎂",
      titulo: "Cumpleaños de Esmeralda",
      fechaTexto: "7 Febrero",
      dias: diasHastaProximo(2, 7),
    },
    {
      emoji: "💘",
      titulo: "Aniversario",
      fechaTexto: "17 Marzo",
      dias: diasHastaProximo(3, 17),
    },
  ];

  const explorarItems: ExplorarItem[] = [
    {
      id: "juegos",
      to: "/juegos",
      icon: Gamepad2,
      iconBg: "from-pink-500 to-orange-400",
      title: "Juegos",
      desc: "Preguntas, retos y minijuegos para compartir momentos juntos.",
      button: "Jugar ahora",
      buttonClass: "bg-gradient-to-r from-pink-500 to-orange-400 text-white",
    },
    {
      id: "progreso",
      to: "/progreso",
      icon: BarChart3,
      iconBg: "from-blue-500 to-cyan-400",
      title: "Progreso",
      desc: "Descubre cuánto ha crecido su historia y los logros obtenidos.",
      button: "Ver progreso",
      buttonClass: "bg-[#3D2B61] text-gray-300",
    },
    {
      id: "historia",
      to: "/nosotros",
      icon: BookHeart,
      iconBg: "from-purple-500 to-fuchsia-500",
      title: "Nuestra Historia",
      desc: "Revive cada recuerdo, cada foto y los momentos más especiales.",
      button: "Explorar",
      buttonClass: "bg-[#3D2B61] text-gray-300",
    },
    {
      id: "cartas",
      to: null,
      icon: Heart,
      iconBg: "from-pink-500 to-red-500",
      title: "Cartas",
      desc: "Muy pronto podrás escribir cartas para guardar por siempre.",
      button: "Próximamente",
      buttonClass: "bg-[#3D2B61] text-gray-500",
      disabled: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#1B1033] text-white px-4 sm:px-6 md:px-8 pb-10">
      <style>{`
        @keyframes flotar {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animar-flotar { animation: flotar 3s ease-in-out infinite; }

        @keyframes brillo {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .brillo-esqueleto {
          background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.13) 37%, rgba(255,255,255,0.05) 63%);
          background-size: 400% 100%;
          animation: brillo 1.4s ease-in-out infinite;
        }
      `}</style>

      <div className="max-w-md sm:max-w-xl md:max-w-2xl mx-auto">
        {/* Saludo */}
        <Reveal className="pt-5 flex items-start justify-between gap-3" delay={0}>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">
              ¡Hola,
              <span className="text-pink-400"> Adixon!</span> ❤️
            </h2>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">
              Bienvenido a nuestro pequeño mundo.
            </p>
          </div>

          <Link
            to="/perfil"
            className="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 via-fuchsia-500 to-purple-500 transition-transform duration-150 active:scale-90 hover:scale-105"
          >
            <div className="w-full h-full rounded-full bg-[#1B1033] flex items-center justify-center overflow-hidden">
              <Heart size={18} className="text-pink-400 fill-pink-400" />
            </div>
          </Link>
        </Reveal>

        {/* Banner */}
        <Reveal className="mt-6" delay={80}>
          <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-orange-400 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">
                  Nuestro Espacio ❤️
                </h1>
                <p className="text-white/90 mt-2 text-sm sm:text-base">
                  <ContadorAnimado valor={diasJuntos} /> días creando recuerdos juntos.
                </p>
              </div>
              <Heart className="fill-white shrink-0 animar-flotar" size={40} />
            </div>
            <Link
              to="/nosotros"
              className="mt-6 inline-flex items-center gap-2 bg-white text-pink-600 font-semibold px-4 sm:px-5 py-2.5 sm:py-3 rounded-full text-sm sm:text-base transition-transform duration-150 hover:scale-[1.03] active:scale-95"
            >
              Ver nuestra historia
              <ChevronRight size={18} />
            </Link>
          </div>
        </Reveal>

        {/* Contador */}
        <Reveal className="mt-6" delay={140}>
          <div className="bg-[#2A1847] rounded-3xl p-4 sm:p-5 transition-shadow hover:shadow-lg hover:shadow-pink-500/10">
            <div className="flex items-center gap-3">
              <CalendarDays className="text-pink-400" />
              <h3 className="font-bold text-lg sm:text-xl">
                Tiempo juntos
              </h3>
            </div>
            <div className="mt-5 text-center">
              <p className="text-5xl sm:text-6xl font-bold text-pink-400">
                <ContadorAnimado valor={diasJuntos} />
              </p>
              <p className="text-gray-300 mt-2 text-sm sm:text-base">
                días compartiendo momentos ❤️
              </p>
            </div>
          </div>
        </Reveal>

        {/* Mensaje */}
        <Reveal className="mt-5">
          <div className="bg-[#2A1847] rounded-3xl p-4 sm:p-5 transition-shadow hover:shadow-lg hover:shadow-yellow-400/10">
            <div className="flex items-center gap-3">
              <Sparkles className="text-yellow-400 animate-pulse" />
              <h3 className="font-bold text-lg sm:text-xl">
                Mensaje del día
              </h3>
            </div>
            <p className="text-gray-300 mt-4 italic text-sm sm:text-base">
              "{mensaje}"
            </p>
          </div>
        </Reveal>

        {/* Recuerdo (aleatorio, desde Supabase) */}
        <Reveal className="mt-5">
          <div className="rounded-3xl overflow-hidden bg-gradient-to-r from-purple-700 to-pink-700">
            <div className="flex items-center gap-3 p-4 sm:p-5 pb-0">
              <Camera className="text-white" />
              <h3 className="font-bold text-lg sm:text-xl">
                Recuerdo del día
              </h3>
            </div>

            {cargandoRecuerdo ? (
              <div className="p-4 sm:p-5 pt-4 space-y-3">
                <div className="w-full h-48 sm:h-56 rounded-2xl brillo-esqueleto" />
                <div className="h-3.5 w-3/4 rounded-full brillo-esqueleto" />
              </div>
            ) : recuerdo ? (
              <>
                {recuerdoUrl && (
                  <div className="relative w-full h-48 sm:h-56 mt-4 overflow-hidden">
                    {!imagenCargada && (
                      <div className="absolute inset-0 brillo-esqueleto" />
                    )}
                    <img
                      src={recuerdoUrl}
                      alt={recuerdo.descripcion || "Recuerdo"}
                      onLoad={() => setImagenCargada(true)}
                      className={`w-full h-full object-cover transition-opacity duration-500 ${
                        imagenCargada ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  </div>
                )}
                <p className="text-white/90 text-sm sm:text-base p-4 sm:p-5 pt-3">
                  {recuerdo.descripcion || "Un recuerdo especial ❤️"}
                </p>
              </>
            ) : (
              <p className="mt-4 text-white/80 text-sm sm:text-base p-4 sm:p-5 pt-2">
                Aún no hay recuerdos guardados en el álbum.
              </p>
            )}
          </div>
        </Reveal>

        {/* Explorar — Carrusel de cuadraditos */}
        <Reveal className="mt-8">
          <h2 className="text-lg sm:text-xl font-bold text-yellow-300 mb-4">
            Explorar
          </h2>
          <ExplorarCarrusel items={explorarItems} />
        </Reveal>

        {/* Nuestra aventura */}
        <Reveal className="mt-8">
          <h2 className="text-lg sm:text-xl font-bold text-yellow-300 mb-4">
            Nuestra aventura
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-[#2A1847] rounded-3xl p-4 sm:p-6 text-center transition-transform duration-150 hover:-translate-y-0.5 active:scale-95">
              <Trophy className="mx-auto text-yellow-400" size={30} />
              <p className="text-gray-400 mt-3 text-sm sm:text-base">
                Logros
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-yellow-300 mt-2">
                12
              </h3>
            </div>
            <div className="bg-[#2A1847] rounded-3xl p-4 sm:p-6 text-center transition-transform duration-150 hover:-translate-y-0.5 active:scale-95">
              <Flame className="mx-auto text-orange-400" size={30} />
              <p className="text-gray-400 mt-3 text-sm sm:text-base">
                Días juntos
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-pink-400 mt-2">
                <ContadorAnimado valor={diasJuntos} />
              </h3>
            </div>
          </div>
        </Reveal>

        {/* Acciones rápidas */}
        <Reveal className="mt-8">
          <h2 className="text-lg sm:text-xl font-bold text-yellow-300 mb-4">
            Acciones rápidas
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <button className="bg-[#2A1847] rounded-2xl p-3 sm:p-5 transition-all duration-150 hover:bg-[#352257] active:scale-90">
              <Camera className="mx-auto text-pink-400" size={26} />
              <p className="mt-2 sm:mt-3 text-xs sm:text-sm">Fotos</p>
            </button>
            <button className="bg-[#2A1847] rounded-2xl p-3 sm:p-5 transition-all duration-150 hover:bg-[#352257] active:scale-90">
              <Gift className="mx-auto text-purple-400" size={26} />
              <p className="mt-2 sm:mt-3 text-xs sm:text-sm">Recuerdos</p>
            </button>
            <button className="bg-[#2A1847] rounded-2xl p-3 sm:p-5 transition-all duration-150 hover:bg-[#352257] active:scale-90">
              <Heart className="mx-auto text-red-400 fill-red-400" size={26} />
              <p className="mt-2 sm:mt-3 text-xs sm:text-sm">Carta</p>
            </button>
          </div>
        </Reveal>

        {/* Próximas fechas */}
        <Reveal className="mt-8">
          <h2 className="text-lg sm:text-xl font-bold text-yellow-300 mb-4">
            Próximas fechas ❤️
          </h2>
          <div className="bg-[#2A1847] rounded-3xl p-4 sm:p-5 space-y-4">
            {proximasFechas.map((item, i) => (
              <div key={item.titulo}>
                <div className="flex items-center justify-between gap-2 rounded-xl transition-colors hover:bg-white/5 -mx-2 px-2 py-1">
                  <div>
                    <p className="font-semibold text-sm sm:text-base">
                      {item.emoji} {item.titulo}
                    </p>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      {item.fechaTexto}
                    </p>
                  </div>
                  <span
                    className={`text-pink-400 text-xs sm:text-sm text-right ${
                      item.dias === 0 ? "animate-pulse font-semibold" : ""
                    }`}
                  >
                    {item.dias === 0
                      ? "¡Es hoy! 🎉"
                      : item.dias === 1
                      ? "Falta 1 día"
                      : `Faltan ${item.dias} días`}
                  </span>
                </div>
                {i < proximasFechas.length - 1 && (
                  <div className="border-t border-white/10 mt-4"></div>
                )}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
}

/* ---------- Carrusel de Explorar (cuadraditos, varias tarjetas visibles) ---------- */
function ExplorarCarrusel({ items }: { items: ExplorarItem[] }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const pausedRef = useRef(false);
  const resumeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPointerDown = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getStep = () => {
    const track = trackRef.current;
    if (!track || !track.children[0]) return 0;
    const card = track.children[0] as HTMLElement;
    const style = window.getComputedStyle(track);
    const gap = parseFloat(style.columnGap || style.gap || "0");
    return card.offsetWidth + gap;
  };
  const scrollToIndex = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(i, items.length - 1));
    track.scrollTo({ left: getStep() * clamped, behavior: "smooth" });
    setActiveIndex(clamped);
  };
  useEffect(() => {
    const id = setInterval(() => {
      if (pausedRef.current) return;
      const track = trackRef.current;
      if (!track) return;
      const maxScroll = track.scrollWidth - track.clientWidth;
      const step = getStep();
      const next = track.scrollLeft + step >= maxScroll - 5 ? 0 : activeIndex + 1;
      scrollToIndex(next);
    }, 3200);
    return () => clearInterval(id);
  }, [activeIndex, items.length]);
  const pauseTemporarily = () => {
    pausedRef.current = true;
    if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
    resumeTimeout.current = setTimeout(() => {
      pausedRef.current = false;
    }, 4500);
  };
  const handleScrollEnd = () => {
    const track = trackRef.current;
    if (!track) return;
    const step = getStep();
    if (!step) return;
    const nearest = Math.round(track.scrollLeft / step);
    setActiveIndex(Math.max(0, Math.min(nearest, items.length - 1)));
  };
  const onScroll = () => {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(handleScrollEnd, 100);
  };

  return (
    <div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <div
        ref={trackRef}
        onScroll={onScroll}
        onPointerDown={() => {
          isPointerDown.current = true;
          pauseTemporarily();
        }}
        onPointerUp={() => {
          isPointerDown.current = false;
        }}
        className="no-scrollbar flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth"
      >
        {items.map((item) => {
          const Icon = item.icon;
          const inner = (
            <div className="bg-[#2A1847] rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-white/5 h-full flex flex-col transition-transform duration-150 hover:-translate-y-1 active:scale-95">
              <div
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${item.iconBg} flex items-center justify-center shadow-lg`}
              >
                <Icon size={18} />
              </div>
              <h3 className="mt-3 text-sm sm:text-base font-bold leading-tight">
                {item.title}
              </h3>
              <p className="text-gray-400 text-[10px] sm:text-xs mt-1.5 leading-snug flex-1">
                {item.desc}
              </p>
              {item.to && !item.disabled ? (
                <Link
                  to={item.to}
                  className={`mt-3 text-center rounded-lg py-1.5 text-[11px] sm:text-xs font-semibold transition-transform duration-150 active:scale-95 ${item.buttonClass}`}
                >
                  {item.button}
                </Link>
              ) : (
                <button
                  disabled
                  className={`mt-3 w-full rounded-lg py-1.5 text-[11px] sm:text-xs cursor-not-allowed ${item.buttonClass}`}
                >
                  {item.button}
                </button>
              )}
            </div>
          );
          return (
            <div
              key={item.id}
              className="snap-start shrink-0 w-[128px] sm:w-[160px] md:w-[180px]"
            >
              {inner}
            </div>
          );
        })}
      </div>
      <div className="flex justify-center gap-2 mt-3">
        {items.map((item, i) => (
          <button
            key={item.id}
            onClick={() => {
              scrollToIndex(i);
              pauseTemporarily();
            }}
            className={`h-1.5 rounded-full transition-all duration-300 active:scale-90 ${
              i === activeIndex ? "w-5 bg-pink-400" : "w-1.5 bg-white/20"
            }`}
            aria-label={`Ir a la tarjeta ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default Inicio;