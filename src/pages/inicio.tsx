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
import { Link } from "react-router-dom";

/* ---------- Helpers de fechas ---------- */

// Días transcurridos entre dos fechas
function diasEntre(desde: Date, hasta: Date) {
  const a = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate());
  const b = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate());
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// Día del año (1-366), usado para elegir mensaje/recuerdo "del día"
function diaDelAnio(fecha: Date) {
  const inicio = new Date(fecha.getFullYear(), 0, 0);
  const diff = fecha.getTime() - inicio.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// Días que faltan para la próxima ocurrencia de una fecha (mes/día), aunque ya haya pasado este año
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

function Inicio() {
  const fechaInicio = new Date("2022-05-22"); // 22 de mayo del 2022
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

  const recuerdos = [
    "Nuestro primer paseo juntos ❤️",
    "Ese día que no dejamos de reír 😂",
    "Nuestro primer abrazo 🥹",
    "La primera foto que nos tomamos 📸",
  ];

  // Mensaje y recuerdo "del día": cambian una vez al día, no en cada render
  const indiceDelDia = diaDelAnio(hoy);
  const mensaje = mensajes[indiceDelDia % mensajes.length];
  const recuerdo = recuerdos[indiceDelDia % recuerdos.length];

  // Próximas fechas con contador dinámico
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

  const explorarItems = [
    {
      id: "juegos",
      to: "/juegos",
      icon: Gamepad2,
      iconBg: "from-pink-500 to-orange-400",
      title: "Juegos",
      desc: "Preguntas, retos y minijuegos para compartir momentos juntos.",
      button: "Jugar ahora",
      buttonClass:
        "bg-gradient-to-r from-pink-500 to-orange-400 text-white",
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
      <div className="max-w-md sm:max-w-xl md:max-w-2xl mx-auto">

        {/* Saludo */}
        <section className="pt-5 flex items-start justify-between gap-3">
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
            className="shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 via-fuchsia-500 to-purple-500"
          >
            <div className="w-full h-full rounded-full bg-[#1B1033] flex items-center justify-center overflow-hidden">
              <Heart size={18} className="text-pink-400 fill-pink-400" />
            </div>
          </Link>
        </section>

        {/* Banner */}
        <section className="mt-6">
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
              <Heart className="fill-white shrink-0" size={40} />
            </div>
            <Link
              to="/nosotros"
              className="mt-6 inline-flex items-center gap-2 bg-white text-pink-600 font-semibold px-4 sm:px-5 py-2.5 sm:py-3 rounded-full text-sm sm:text-base"
            >
              Ver nuestra historia
              <ChevronRight size={18} />
            </Link>
          </div>
        </section>

        {/* Contador */}
        <section className="mt-6">
          <div className="bg-[#2A1847] rounded-3xl p-4 sm:p-5">
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
        </section>

        {/* Mensaje */}
        <section className="mt-5">
          <div className="bg-[#2A1847] rounded-3xl p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <Sparkles className="text-yellow-400" />
              <h3 className="font-bold text-lg sm:text-xl">
                Mensaje del día
              </h3>
            </div>
            <p className="text-gray-300 mt-4 italic text-sm sm:text-base">
              "{mensaje}"
            </p>
          </div>
        </section>

        {/* Recuerdo */}
        <section className="mt-5">
          <div className="rounded-3xl p-4 sm:p-5 bg-gradient-to-r from-purple-700 to-pink-700">
            <div className="flex items-center gap-3">
              <Camera className="text-white" />
              <h3 className="font-bold text-lg sm:text-xl">
                Recuerdo del día
              </h3>
            </div>
            <p className="mt-4 text-white/90 text-sm sm:text-base">
              {recuerdo}
            </p>
          </div>
        </section>

        {/* Explorar — Carrusel de cuadraditos */}
        <section className="mt-8">
          <h2 className="text-lg sm:text-xl font-bold text-yellow-300 mb-4">
            Explorar
          </h2>
          <ExplorarCarrusel items={explorarItems} />
        </section>

        {/* Nuestra aventura */}
        <section className="mt-8">
          <h2 className="text-lg sm:text-xl font-bold text-yellow-300 mb-4">
            Nuestra aventura
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-[#2A1847] rounded-3xl p-4 sm:p-6 text-center">
              <Trophy className="mx-auto text-yellow-400" size={30} />
              <p className="text-gray-400 mt-3 text-sm sm:text-base">
                Logros
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-yellow-300 mt-2">
                12
              </h3>
            </div>
            <div className="bg-[#2A1847] rounded-3xl p-4 sm:p-6 text-center">
              <Flame className="mx-auto text-orange-400" size={30} />
              <p className="text-gray-400 mt-3 text-sm sm:text-base">
                Días juntos
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold text-pink-400 mt-2">
                <ContadorAnimado valor={diasJuntos} />
              </h3>
            </div>
          </div>
        </section>

        {/* Acciones rápidas */}
        <section className="mt-8">
          <h2 className="text-lg sm:text-xl font-bold text-yellow-300 mb-4">
            Acciones rápidas
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <button className="bg-[#2A1847] rounded-2xl p-3 sm:p-5 hover:bg-[#352257] transition">
              <Camera className="mx-auto text-pink-400" size={26} />
              <p className="mt-2 sm:mt-3 text-xs sm:text-sm">Fotos</p>
            </button>
            <button className="bg-[#2A1847] rounded-2xl p-3 sm:p-5 hover:bg-[#352257] transition">
              <Gift className="mx-auto text-purple-400" size={26} />
              <p className="mt-2 sm:mt-3 text-xs sm:text-sm">Recuerdos</p>
            </button>
            <button className="bg-[#2A1847] rounded-2xl p-3 sm:p-5 hover:bg-[#352257] transition">
              <Heart className="mx-auto text-red-400 fill-red-400" size={26} />
              <p className="mt-2 sm:mt-3 text-xs sm:text-sm">Carta</p>
            </button>
          </div>
        </section>

        {/* Próximas fechas */}
        <section className="mt-8">
          <h2 className="text-lg sm:text-xl font-bold text-yellow-300 mb-4">
            Próximas fechas ❤️
          </h2>
          <div className="bg-[#2A1847] rounded-3xl p-4 sm:p-5 space-y-4">
            {proximasFechas.map((item, i) => (
              <div key={item.titulo}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm sm:text-base">
                      {item.emoji} {item.titulo}
                    </p>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      {item.fechaTexto}
                    </p>
                  </div>
                  <span className="text-pink-400 text-xs sm:text-sm text-right">
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
        </section>
      </div>
    </div>
  );
}

/* ---------- Carrusel de Explorar (cuadraditos, varias tarjetas visibles) ---------- */
function ExplorarCarrusel({ items }) {
  const trackRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const pausedRef = useRef(false);
  const resumeTimeout = useRef(null);
  const isPointerDown = useRef(false);

  const getStep = () => {
    const track = trackRef.current;
    if (!track || !track.children[0]) return 0;
    const card = track.children[0];
    const style = window.getComputedStyle(track);
    const gap = parseFloat(style.columnGap || style.gap || "0");
    return card.offsetWidth + gap;
  };

  const scrollToIndex = (i) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(i, items.length - 1));
    track.scrollTo({ left: getStep() * clamped, behavior: "smooth" });
    setActiveIndex(clamped);
  };

  // Auto-avance
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

  // Detecta en qué tarjeta quedó al terminar de deslizar (scroll nativo)
  const handleScrollEnd = () => {
    const track = trackRef.current;
    if (!track) return;
    const step = getStep();
    if (!step) return;
    const nearest = Math.round(track.scrollLeft / step);
    setActiveIndex(Math.max(0, Math.min(nearest, items.length - 1)));
  };

  let scrollTimeout = useRef(null);
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
            <div className="bg-[#2A1847] rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-white/5 h-full flex flex-col">
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
                  className={`mt-3 text-center rounded-lg py-1.5 text-[11px] sm:text-xs font-semibold ${item.buttonClass}`}
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

      {/* Puntos indicadores */}
      <div className="flex justify-center gap-2 mt-3">
        {items.map((item, i) => (
          <button
            key={item.id}
            onClick={() => {
              scrollToIndex(i);
              pauseTemporarily();
            }}
            className={`h-1.5 rounded-full transition-all ${
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