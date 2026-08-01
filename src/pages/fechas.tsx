function Fechas() {
  const eventos = [
    {
      titulo: "Nuestro aniversario",
      fecha: "15 Marzo 2027",
      icono: "❤️",
      faltan: "225 días",
    },
    {
      titulo: "Cumpleaños de Adixon",
      fecha: "10 Octubre 2026",
      icono: "🎂",
      faltan: "71 días",
    },
    {
      titulo: "Cumpleaños de Mi Amor",
      fecha: "24 Diciembre 2026",
      icono: "🎉",
      faltan: "146 días",
    },
    {
      titulo: "San Valentín",
      fecha: "14 Febrero 2027",
      icono: "💝",
      faltan: "198 días",
    },
  ];

  return (
    <div className="min-h-screen bg-[#1B1033] text-white px-5 pt-24 pb-28">
      <h1 className="text-3xl font-bold text-pink-400 mb-2">
        📅 Fechas Especiales
      </h1>

      <p className="text-gray-400 mb-8">
        Nunca olvidemos nuestros momentos más importantes ❤️
      </p>

      <div className="space-y-5">
        {eventos.map((evento, index) => (
          <div
            key={index}
            className="bg-[#2A1847] rounded-3xl p-5 border border-white/10 shadow-lg"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">
                  {evento.icono} {evento.titulo}
                </h2>

                <p className="text-gray-300 mt-1">
                  {evento.fecha}
                </p>
              </div>

              <div className="bg-pink-500/20 text-pink-300 px-4 py-2 rounded-xl font-semibold">
                {evento.faltan}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Fechas;