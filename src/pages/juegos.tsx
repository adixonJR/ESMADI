import { Link } from "react-router-dom";

function Juegos() {
  const juegos = [
    {
      id: 1,
      key: "chispa",
      to: "/juegos/chispa",
      nombre: "Chispa",
      descripcion: "Cartas y retos para subir la temperatura, a su ritmo.",
      icono: "🎲",
      color: "from-[#EC4899] to-[#FB923C]",
      disponible: true,
    },
    {
      id: 2,
      key: "memoria",
      to: null,
      nombre: "Memoria",
      descripcion: "Encuentra las parejas y demuestra tu memoria.",
      icono: "🧠",
      color: "from-[#D946EF] to-[#EC4899]",
      disponible: false,
    },
    {
      id: 3,
      key: "retos",
      to: null,
      nombre: "Retos",
      descripcion: "Completa retos divertidos juntos.",
      icono: "🎯",
      color: "from-[#FACC15] to-[#FB923C]",
      disponible: false,
    },
    {
      id: 4,
      key: "quiz",
      to: null,
      nombre: "Quiz de Pareja",
      descripcion: "Descubre qué tanto conocen sus gustos.",
      icono: "💑",
      color: "from-[#D946EF] to-[#47356B]",
      disponible: false,
    },
  ];

  const disponibles = juegos.filter((j) => j.disponible);
  const proximos = juegos.filter((j) => !j.disponible);

  return (
    <section className="px-4 sm:px-6 py-6 max-w-md sm:max-w-lg mx-auto bg-[#1B1033] min-h-screen">
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes titleIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes lockPulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        @keyframes footerFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes iconFloat {
          0%, 100% { transform: translateY(0) rotate(-4deg); }
          50% { transform: translateY(-5px) rotate(4deg); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 10px 30px -10px rgba(236, 72, 153, 0.45); }
          50% { box-shadow: 0 14px 40px -8px rgba(251, 146, 60, 0.6); }
        }
        .juego-card {
          animation: fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
          transition: transform 0.25s ease, border-color 0.25s ease;
        }
        .juego-card:active {
          transform: scale(0.97);
        }
        .juego-destacado {
          animation:
            fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both,
            glowPulse 3.5s ease-in-out 0.6s infinite;
        }
        .juego-icono-grande {
          animation: iconFloat 3.2s ease-in-out infinite;
        }
        .juego-lock {
          animation: lockPulse 2.4s ease-in-out infinite;
        }
        .juego-btn-activo {
          transition: transform 0.15s ease, filter 0.2s ease;
        }
        .juego-btn-activo:active {
          transform: scale(0.97);
          filter: brightness(0.95);
        }
        .juego-titulo {
          animation: titleIn 0.4s ease both;
        }
        .juego-footer {
          animation: footerFade 0.6s ease 0.5s both;
        }
        @media (prefers-reduced-motion: reduce) {
          .juego-card, .juego-destacado, .juego-icono-grande, .juego-lock,
          .juego-btn-activo, .juego-titulo, .juego-footer {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      {/* Encabezado */}
      <div className="juego-titulo mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-[#FACC15]">Juegos</h1>
          <span className="text-[11px] font-semibold text-white/80 bg-white/10 border border-white/10 rounded-full px-3 py-1">
            {disponibles.length} de {juegos.length} disponibles
          </span>
        </div>
        <p className="text-[#B8B5C9] text-sm mt-1">
          Elijan uno y pásenla bien juntos.
        </p>
      </div>

      {/* Juegos disponibles (destacados) */}
      <div className="space-y-4">
        {disponibles.map((juego, index) => (
          <div
            key={juego.id}
            className={`juego-destacado relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br ${juego.color}`}
            style={{ animationDelay: `${index * 90}ms` }}
          >
            {/* Brillos decorativos */}
            <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/15 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-8 w-32 h-32 rounded-full bg-black/10 blur-2xl" />

            <div className="relative flex items-start justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wide bg-white/25 backdrop-blur-sm rounded-full px-3 py-1 text-white">
                ✨ Disponible
              </span>
              <div className="juego-icono-grande w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl">
                {juego.icono}
              </div>
            </div>

            <h2 className="relative mt-4 font-extrabold text-2xl text-white">
              {juego.nombre}
            </h2>
            <p className="relative text-white/90 text-sm mt-1 leading-relaxed">
              {juego.descripcion}
            </p>

            {juego.to && (
              <Link
                to={juego.to}
                className="juego-btn-activo relative mt-5 block w-full text-center rounded-2xl py-3 text-sm font-bold bg-white text-pink-600 shadow-lg"
              >
                Jugar ahora →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Próximamente */}
      {proximos.length > 0 && (
        <>
          <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wide text-white/50 px-1">
            Próximamente
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {proximos.map((juego, index) => (
              <div
                key={juego.id}
                className="juego-card relative bg-[#2A1847] border border-[#47356B] rounded-3xl p-4 flex flex-col"
                style={{ animationDelay: `${(index + disponibles.length) * 90}ms` }}
              >
                <span className="juego-lock absolute top-3 right-3 text-sm text-[#FACC15]">
                  🔒
                </span>

                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${juego.color} flex items-center justify-center text-xl mb-3 opacity-70`}
                >
                  {juego.icono}
                </div>

                <h3 className="font-bold text-sm text-white">{juego.nombre}</h3>
                <p className="text-[#B8B5C9] text-xs mt-1 leading-snug flex-1">
                  {juego.descripcion}
                </p>

                <span className="mt-3 text-center rounded-xl py-2 text-[11px] font-bold bg-[#352257] text-[#B8B5C9]">
                  Próximamente
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="juego-footer text-center text-[11px] text-[#B8B5C9] mt-8 italic">
        Juega con respeto, comunicación y consentimiento mutuo 🤎
      </p>
    </section>
  );
}

export default Juegos;