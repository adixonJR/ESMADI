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
    <section className="px-4 sm:px-6 py-6 max-w-md sm:max-w-lg mx-auto bg-[#1B1033]">
      <h1 className="text-xl font-bold text-[#FACC15] mb-6">Todos los juegos</h1>

      <div className="space-y-4">
        {juegos.map((juego) => (
          <div
            key={juego.id}
            className="bg-[#2A1847] border border-[#47356B] rounded-3xl p-5 relative"
          >
            {!juego.disponible && (
              <span className="absolute top-4 right-4 text-[#FACC15]">🔒</span>
            )}

            <div
              className={`w-11 h-11 rounded-xl bg-gradient-to-br ${juego.color} flex items-center justify-center text-xl mb-3`}
            >
              {juego.icono}
            </div>

            <h2 className="font-bold text-base text-white">{juego.nombre}</h2>
            <p className="text-[#B8B5C9] text-sm mt-1">{juego.descripcion}</p>

            {juego.disponible && juego.to ? (
              <Link
                to={juego.to}
                className="mt-4 block w-full text-center rounded-xl py-2.5 text-sm font-bold bg-gradient-to-r from-[#EC4899] to-[#FB923C] text-white"
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

      <p className="text-center text-[11px] text-[#B8B5C9] mt-8 italic">
        Juega con respeto, comunicación y consentimiento mutuo 🤎
      </p>
    </section>
  );
}

export default Juegos;