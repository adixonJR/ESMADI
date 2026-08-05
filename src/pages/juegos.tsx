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
        .juego-card {
          animation: fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .juego-card:hover {
          transform: translateY(-3px);
          border-color: #6b4fa3;
          box-shadow: 0 8px 24px -8px rgba(236, 72, 153, 0.25);
        }
        .juego-icono {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .juego-card:hover .juego-icono {
          transform: scale(1.1) rotate(-6deg);
        }
        .juego-lock {
          animation: lockPulse 2.4s ease-in-out infinite;
        }
        .juego-btn-activo {
          transition: transform 0.15s ease, filter 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 4px 14px -4px rgba(236, 72, 153, 0.5);
        }
        .juego-btn-activo:hover {
          filter: brightness(1.08);
          box-shadow: 0 6px 18px -4px rgba(236, 72, 153, 0.6);
        }
        .juego-btn-activo:active {
          transform: scale(0.97);
        }
        .juego-titulo {
          animation: titleIn 0.4s ease both;
        }
        .juego-footer {
          animation: footerFade 0.6s ease 0.5s both;
        }
        @media (prefers-reduced-motion: reduce) {
          .juego-card, .juego-icono, .juego-lock, .juego-btn-activo, .juego-titulo, .juego-footer {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <h1 className="juego-titulo text-xl font-bold text-[#FACC15] mb-6">
        Todos los juegos
      </h1>

      <div className="space-y-4">
        {juegos.map((juego, index) => (
          <div
            key={juego.id}
            className="juego-card bg-[#2A1847] border border-[#47356B] rounded-3xl p-5 relative"
            style={{ animationDelay: `${index * 90}ms` }}
          >
            {!juego.disponible && (
              <span className="juego-lock absolute top-4 right-4 text-[#FACC15]">
                🔒
              </span>
            )}

            <div
              className={`juego-icono w-11 h-11 rounded-xl bg-gradient-to-br ${juego.color} flex items-center justify-center text-xl mb-3`}
            >
              {juego.icono}
            </div>

            <h2 className="font-bold text-base text-white">{juego.nombre}</h2>
            <p className="text-[#B8B5C9] text-sm mt-1">{juego.descripcion}</p>

            {juego.disponible && juego.to ? (
              <Link
                to={juego.to}
                className="juego-btn-activo mt-4 block w-full text-center rounded-xl py-2.5 text-sm font-bold bg-gradient-to-r from-[#EC4899] to-[#FB923C] text-white"
              >
                Jugar Ahora
              </Link>
            ) : (
              <button
                disabled
                className="mt-4 w-full rounded-xl py-2.5 text-sm font-bold bg-[#352257] text-[#B8B5C9] cursor-not-allowed"
              >
                Próximamente
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="juego-footer text-center text-[11px] text-[#B8B5C9] mt-8 italic">
        Juega con respeto, comunicación y consentimiento mutuo 🤎
      </p>
    </section>
  );
}

export default Juegos;