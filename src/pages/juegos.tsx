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
      color: "from-pink-500 to-red-500",
      disponible: true,
    },
    {
      id: 2,
      key: "memoria",
      to: null,
      nombre: "Memoria",
      descripcion: "Encuentra las parejas y demuestra tu memoria.",
      icono: "🧠",
      color: "from-purple-500 to-indigo-500",
      disponible: false,
    },
    {
      id: 3,
      key: "retos",
      to: null,
      nombre: "Retos",
      descripcion: "Completa retos divertidos juntos.",
      icono: "🎯",
      color: "from-yellow-500 to-orange-500",
      disponible: false,
    },
    {
      id: 4,
      key: "quiz",
      to: null,
      nombre: "Quiz de Pareja",
      descripcion: "Descubre qué tanto conocen sus gustos.",
      icono: "💑",
      color: "from-blue-500 to-cyan-500",
      disponible: false,
    },
  ];

  return (
    <section className="px-4 sm:px-6 py-6 max-w-md sm:max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-yellow-300 mb-6">Todos los juegos</h1>

      <div className="space-y-4">
        {juegos.map((juego) => (
          <div
            key={juego.id}
            className="bg-[#241539] border border-white/10 rounded-3xl p-5 relative"
          >
            {!juego.disponible && (
              <span className="absolute top-4 right-4 text-yellow-500">🔒</span>
            )}

            <div
              className={`w-11 h-11 rounded-xl bg-gradient-to-br ${juego.color} flex items-center justify-center text-xl mb-3`}
            >
              {juego.icono}
            </div>

            <h2 className="font-bold text-base">{juego.nombre}</h2>
            <p className="text-gray-400 text-sm mt-1">{juego.descripcion}</p>

            {juego.disponible && juego.to ? (
              <Link
                to={juego.to}
                className="mt-4 block w-full text-center rounded-xl py-2.5 text-sm font-bold bg-gradient-to-r from-pink-500 to-orange-400 text-white"
              >
                Jugar Ahora
              </Link>
            ) : (
              <button
                disabled
                className="mt-4 w-full rounded-xl py-2.5 text-sm font-bold bg-[#3D2B61] text-gray-500 cursor-not-allowed"
              >
                Próximamente
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="text-center text-[11px] text-gray-500 mt-8 italic">
        Juega con respeto, comunicación y consentimiento mutuo 🤎
      </p>
    </section>
  );
}

export default Juegos;