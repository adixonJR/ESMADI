import { Flame, Lock, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CienCosas from "../conponents/CienCosas";
import { useState } from "react";

function Progreso() {
  const navigate = useNavigate();
  const [mostrarCienCosas, setMostrarCienCosas] = useState(false);

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
    { nombre: "Romántico", progreso: 80, color: "bg-pink-500" },
    { nombre: "Complicidad", progreso: 55, color: "bg-yellow-400" },
    { nombre: "Retos", progreso: 40, color: "bg-orange-400" },
    { nombre: "Preguntas", progreso: 70, color: "bg-fuchsia-500" },
  ];

  const handleLogroClick = (titulo: string) => {
    if (titulo === "100 cosas por hacer") {
      setMostrarCienCosas(true);
    } else if (titulo === "cosas por hacer") {
      navigate("/metas");
    }
  };

  return (
    <section className="px-4 sm:px-6 py-6 sm:py-10">
      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold">📊 Progreso</h1>
        <p className="text-gray-300 mt-3 text-sm sm:text-base">
          Mira todos los logros que han conseguido
        </p>
      </div>

      <div className="max-w-4xl mx-auto">

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {estadisticas.map((stat, i) => (
            <div
              key={i}
              className="bg-white/10 backdrop-blur rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-center"
            >
              <div className="text-2xl sm:text-3xl">{stat.icono}</div>
              <p className="text-xl sm:text-2xl font-bold text-pink-400 mt-2">
                {stat.valor}
              </p>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Nivel de pareja */}
        <div className="bg-white/10 backdrop-blur rounded-3xl p-5 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold">Nivel de pareja ❤️</h2>
            <span className="flex items-center gap-1 text-orange-400 text-sm font-semibold">
              <Flame size={16} /> Racha 3
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-5">
            <div
              className="bg-gradient-to-r from-pink-500 to-orange-400 h-5 rounded-full transition-all"
              style={{ width: "65%" }}
            />
          </div>
          <p className="mt-3 text-gray-300 text-sm sm:text-base">
            65% completado - ¡Sigan creando recuerdos!
          </p>
        </div>

        {/* Progreso por categoría */}
        <div className="bg-white/10 backdrop-blur rounded-3xl p-5 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-5">
            Progreso por categoría
          </h2>
          <div className="space-y-4">
            {categorias.map((cat, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5 text-sm sm:text-base">
                  <span className="font-medium">{cat.nombre}</span>
                  <span className="text-gray-400">{cat.progreso}%</span>
                </div>
                <div className="w-full bg-gray-700/60 rounded-full h-2.5">
                  <div
                    className={`${cat.color} h-2.5 rounded-full transition-all`}
                    style={{ width: `${cat.progreso}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logros */}
        <div className="mb-2">
          <h2 className="text-xl sm:text-2xl font-bold mb-5 flex items-center gap-2">
            <Trophy className="text-yellow-400" size={22} /> Logros
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
                  className={`relative p-5 sm:p-6 rounded-3xl text-center transition ${
                    logro.conseguido
                      ? "bg-white/10 hover:scale-105"
                      : "bg-white/5 opacity-60"
                  } ${esClickeable ? "cursor-pointer" : ""}`}
                >
                  {!logro.conseguido && (
                    <span className="absolute top-4 right-4 text-gray-400">
                      <Lock size={16} />
                    </span>
                  )}
                  <div className="text-4xl sm:text-5xl mb-3">{logro.icono}</div>
                  <h3 className="font-bold text-lg sm:text-xl">{logro.titulo}</h3>
                  <p className="text-gray-300 mt-2 text-xs sm:text-sm">
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