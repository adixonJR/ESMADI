import { Flame, Lock, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CienCosas from "../conponents/CienCosas";
import { useState, useEffect } from "react";

function Progreso() {
  const navigate = useNavigate();
  const [mostrarCienCosas, setMostrarCienCosas] = useState(false);
  const [animar, setAnimar] = useState(false);

  useEffect(() => {
    // Dispara las barras de progreso un frame después del montaje,
    // así el navegador registra el estado inicial (0%) antes de animar.
    const id = requestAnimationFrame(() => setAnimar(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (mostrarCienCosas) {
    return <CienCosas onVolver={() => setMostrarCienCosas(false)} />;
  }

  const logros = [
    {
      titulo: "100 cosas por hacer",
      descripcion: "100 cosas a lo largo de nuestra vida",
      icono: "⏳",
      conseguido: true,
    },
    {
      titulo: "cosas por hacer",
      descripcion: "cosas por hacer dependiendo el tiempo",
      icono: "⏱️",
      conseguido: true,
    },
    {
      titulo: "Primer juego completado",
      descripcion: "Completaste tu primera aventura juntos.",
      icono: "🏆",
      conseguido: true,
    },
    {
      titulo: "Pareja exploradora",
      descripcion: "Han jugado varios juegos juntos.",
      icono: "🌎",
      conseguido: true,
    },
    {
      titulo: "Grandes recuerdos",
      descripcion: "Acumula momentos especiales.",
      icono: "💖",
      conseguido: true,
    },
    {
      titulo: "Racha de fuego",
      descripcion: "Jueguen 7 días seguidos.",
      icono: "🔥",
      conseguido: false,
    },
    {
      titulo: "Complicidad total",
      descripcion: "Completen 20 retos de la categoría Complicidad.",
      icono: "🤝",
      conseguido: false,
    },
    {
      titulo: "Maestros del romance",
      descripcion: "Alcancen el nivel 100% de pareja.",
      icono: "👑",
      conseguido: false,
    },
  ];

  const estadisticas = [
    { label: "Juegos jugados", valor: "12", icono: "🎮" },
    { label: "Retos completados", valor: "47", icono: "⚡" },
    { label: "Racha actual", valor: "3 días", icono: "🔥" },
  ];

  const categorias = [
    { nombre: "Romántico", progreso: 80, color: "bg-[#EC4899]" },
    { nombre: "Complicidad", progreso: 55, color: "bg-[#FACC15]" },
    { nombre: "Retos", progreso: 40, color: "bg-[#FB923C]" },
    { nombre: "Preguntas", progreso: 70, color: "bg-[#D946EF]" },
  ];

  const handleLogroClick = (titulo: string) => {
    if (titulo === "100 cosas por hacer") {
      setMostrarCienCosas(true);
    } else if (titulo === "cosas por hacer") {
      navigate("/metas");
    }
  };

  return (
    <section className="px-4 sm:px-6 py-6 sm:py-10 bg-[#1B1033]">
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.85) translateY(10px); }
          60% { opacity: 1; transform: scale(1.03) translateY(0); }
          100% { transform: scale(1); }
        }
        @keyframes numberRise {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes lockFade {
          from { opacity: 0; transform: scale(0.7); }
          to { opacity: 1; transform: scale(1); }
        }
        .prog-header {
          animation: fadeIn 0.5s ease both;
        }
        .prog-stat {
          animation: fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .prog-stat:hover {
          transform: translateY(-2px);
          border-color: #6b4fa3;
        }
        .prog-stat-valor {
          animation: numberRise 0.5s ease both;
          animation-delay: 0.3s;
        }
        .prog-card {
          animation: fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .prog-bar-fill {
          transition: width 1.1s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .prog-cat-bar {
          transition: width 0.9s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .prog-logro {
          animation: popIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
          transition: transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
        }
        .prog-logro-conseguido:hover {
          transform: translateY(-3px) scale(1.03);
          box-shadow: 0 10px 26px -10px rgba(236, 72, 153, 0.35);
        }
        .prog-logro-conseguido:active {
          transform: scale(0.98);
        }
        .prog-logro-icono {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .prog-logro-conseguido:hover .prog-logro-icono {
          transform: scale(1.15) rotate(-4deg);
        }
        .prog-lock {
          animation: lockFade 0.4s ease both;
        }
        @media (prefers-reduced-motion: reduce) {
          .prog-header, .prog-stat, .prog-stat-valor, .prog-card, .prog-logro, .prog-logro-icono, .prog-lock {
            animation: none !important;
            transition: none !important;
          }
          .prog-bar-fill, .prog-cat-bar {
            transition: none !important;
          }
        }
      `}</style>

      <div className="prog-header text-center mb-8 sm:mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-white"> Progreso</h1>
        <p className="text-[#B8B5C9] mt-3 text-sm sm:text-base">
          Mira todos los logros que han conseguido
        </p>
      </div>

      <div className="max-w-4xl mx-auto">

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {estadisticas.map((stat, i) => (
            <div
              key={i}
              className="prog-stat bg-[#2A1847] border border-[#47356B] rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-center"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="text-2xl sm:text-3xl">{stat.icono}</div>
              <p className="prog-stat-valor text-xl sm:text-2xl font-bold text-[#EC4899] mt-2">
                {stat.valor}
              </p>
              <p className="text-[#B8B5C9] text-xs sm:text-sm mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Nivel de pareja */}
        <div
          className="prog-card bg-[#2A1847] border border-[#47356B] rounded-3xl p-5 sm:p-6 mb-6 sm:mb-8"
          style={{ animationDelay: "150ms" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Nivel de pareja ❤️</h2>
            <span className="flex items-center gap-1 text-[#FB923C] text-sm font-semibold">
              <Flame size={16} /> Racha 3
            </span>
          </div>
          <div className="w-full bg-[#1B1033] border border-[#47356B] rounded-full h-5">
            <div
              className="prog-bar-fill bg-gradient-to-r from-[#EC4899] to-[#FB923C] h-5 rounded-full"
              style={{ width: animar ? "65%" : "0%" }}
            />
          </div>
          <p className="mt-3 text-[#B8B5C9] text-sm sm:text-base">
            65% completado - ¡Sigan creando recuerdos!
          </p>
        </div>

        {/* Progreso por categoría */}
        <div
          className="prog-card bg-[#2A1847] border border-[#47356B] rounded-3xl p-5 sm:p-6 mb-6 sm:mb-8"
          style={{ animationDelay: "220ms" }}
        >
          <h2 className="text-xl sm:text-2xl font-bold mb-5 text-white">
            Progreso por categoría
          </h2>
          <div className="space-y-4">
            {categorias.map((cat, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5 text-sm sm:text-base">
                  <span className="font-medium text-white">{cat.nombre}</span>
                  <span className="text-[#B8B5C9]">{cat.progreso}%</span>
                </div>
                <div className="w-full bg-[#1B1033] border border-[#47356B] rounded-full h-2.5">
                  <div
                    className={`${cat.color} prog-cat-bar h-2.5 rounded-full`}
                    style={{
                      width: animar ? `${cat.progreso}%` : "0%",
                      transitionDelay: `${i * 100}ms`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logros */}
        <div className="mb-2">
          <h2 className="text-xl sm:text-2xl font-bold mb-5 flex items-center gap-2 text-white">
            <Trophy className="text-[#FACC15]" size={22} /> Logros
          </h2>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
            {logros.map((logro, index) => {
              const esClickeable =
                logro.titulo === "100 cosas por hacer" ||
                logro.titulo === "cosas por hacer";

              return (
                <div
                  key={index}
                  onClick={
                    esClickeable ? () => handleLogroClick(logro.titulo) : undefined
                  }
                  style={{ animationDelay: `${300 + index * 60}ms` }}
                  className={`prog-logro relative p-5 sm:p-6 rounded-3xl text-center border border-[#47356B] ${
                    logro.conseguido
                      ? "prog-logro-conseguido bg-[#2A1847]"
                      : "bg-[#2A1847]/50 opacity-60"
                  } ${esClickeable ? "cursor-pointer" : ""}`}
                >
                  {!logro.conseguido && (
                    <span className="prog-lock absolute top-4 right-4 text-[#B8B5C9]">
                      <Lock size={16} />
                    </span>
                  )}
                  <div className="prog-logro-icono text-4xl sm:text-5xl mb-3">
                    {logro.icono}
                  </div>
                  <h3 className="font-bold text-lg sm:text-xl text-white">{logro.titulo}</h3>
                  <p className="text-[#B8B5C9] mt-2 text-xs sm:text-sm">
                    {logro.descripcion}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}

export default Progreso;