import { useState } from "react";
import { Link } from "react-router-dom";
import { Hourglass, ArrowLeft, Lock, Unlock, Plus, Calendar } from "lucide-react";

interface CapsulaMensaje {
  id: number;
  titulo: string;
  contenido: string;
  fechaApertura: string; // formato YYYY-MM-DD
}

function estaDesbloqueada(fechaApertura: string): boolean {
  const hoy = new Date();
  const apertura = new Date(fechaApertura + "T00:00:00");
  return hoy >= apertura;
}

function formatearFecha(fechaApertura: string): string {
  const apertura = new Date(fechaApertura + "T00:00:00");
  return apertura.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function CapsulaDelTiempo() {
  const [capsulas, setCapsulas] = useState<CapsulaMensaje[]>([
    {
      id: 1,
      titulo: "Para nuestro 2do aniversario",
      contenido:
        "Cuando leas esto espero que sigamos igual de enamorados que hoy.",
      fechaApertura: "2027-03-15",
    },
  ]);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [fechaApertura, setFechaApertura] = useState("");
  const [abiertas, setAbiertas] = useState<Record<number, boolean>>({});

  const agregarCapsula = () => {
    if (!titulo.trim() || !contenido.trim() || !fechaApertura) return;
    const nueva: CapsulaMensaje = {
      id: Date.now(),
      titulo: titulo.trim(),
      contenido: contenido.trim(),
      fechaApertura,
    };
    setCapsulas((prev) => [...prev, nueva]);
    setTitulo("");
    setContenido("");
    setFechaApertura("");
    setMostrarForm(false);
  };

  const alternarApertura = (id: number) => {
    setAbiertas((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="px-6 py-10 bg-[#120B1F] min-h-screen">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap');
        .fuente-elegante { font-family: 'Playfair Display', Georgia, serif; }
      `}</style>

      <div className="max-w-3xl mx-auto">
        {/* Volver */}
        <Link
          to="/nosotros"
          className="inline-flex items-center gap-2 text-[#C7C7D3] hover:text-white transition mb-8 text-sm"
        >
          <ArrowLeft size={18} />
          Volver a Nosotros
        </Link>

        {/* Título */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-5">
            <div className="border border-[#FF7EB6]/40 p-5 rounded-full">
              <Hourglass size={40} className="text-[#FF7EB6]" strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="fuente-elegante text-4xl sm:text-5xl font-bold tracking-tight text-white">
            Cápsula del tiempo
          </h1>
          <div className="w-14 h-px bg-[#B388FF]/60 mx-auto mt-4 mb-4" />
          <p className="text-[#C7C7D3] text-sm sm:text-base tracking-wide">
            Mensajes para abrir en el futuro
          </p>
        </div>

        {/* Lista de cápsulas */}
        <div className="space-y-4 mb-8">
          {capsulas.length === 0 && (
            <div className="bg-[#2B2145] rounded-3xl p-8 border border-[#453A67] text-center text-[#C7C7D3]">
              Todavía no hay mensajes guardados. Crea el primero 🕰️
            </div>
          )}

          {capsulas.map((capsula) => {
            const desbloqueada = estaDesbloqueada(capsula.fechaApertura);
            const abierta = abiertas[capsula.id];

            return (
              <div
                key={capsula.id}
                className="bg-[#2B2145] rounded-3xl p-6 border border-[#453A67]"
              >
                <div className="flex items-start gap-4">
                  <div className="border border-[#FF7EB6]/40 rounded-full p-3 shrink-0">
                    {desbloqueada ? (
                      <Unlock size={20} className="text-[#FF7EB6]" strokeWidth={1.5} />
                    ) : (
                      <Lock size={20} className="text-[#FF7EB6]" strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="fuente-elegante text-lg sm:text-xl font-semibold text-white">
                      {capsula.titulo}
                    </h3>
                    <p className="text-[#B388FF] text-sm font-medium flex items-center gap-1.5 mt-1">
                      <Calendar size={14} />
                      Se abre el {formatearFecha(capsula.fechaApertura)}
                    </p>

                    {desbloqueada ? (
                      abierta ? (
                        <p className="text-[#C7C7D3] mt-3 text-sm sm:text-base leading-relaxed">
                          {capsula.contenido}
                        </p>
                      ) : (
                        <button
                          onClick={() => alternarApertura(capsula.id)}
                          className="mt-3 bg-[#FF4D8D] hover:bg-[#E63A79] transition rounded-full px-5 py-2 text-sm font-semibold tracking-wide text-white"
                        >
                          Abrir mensaje
                        </button>
                      )
                    ) : (
                      <p className="text-[#8A83A0] mt-3 text-sm italic">
                        Este mensaje sigue sellado. Vuelve en esa fecha para leerlo 🔒
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Formulario para agregar */}
        {mostrarForm ? (
          <div className="bg-[#2B2145] rounded-3xl p-7 border border-[#453A67] space-y-4">
            <input
              type="text"
              placeholder="Título del mensaje"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full bg-[#1E1534] border border-[#453A67] rounded-xl px-4 py-3 text-white placeholder-[#8A83A0] outline-none focus:border-[#FF7EB6] transition"
            />
            <textarea
              placeholder="Escribe tu mensaje para el futuro..."
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              rows={4}
              className="w-full bg-[#1E1534] border border-[#453A67] rounded-xl px-4 py-3 text-white placeholder-[#8A83A0] outline-none focus:border-[#FF7EB6] transition resize-none"
            />
            <div>
              <label className="text-[#C7C7D3] text-sm mb-1.5 block">
                Fecha en la que se podrá abrir
              </label>
              <input
                type="date"
                value={fechaApertura}
                onChange={(e) => setFechaApertura(e.target.value)}
                className="w-full bg-[#1E1534] border border-[#453A67] rounded-xl px-4 py-3 text-white outline-none focus:border-[#FF7EB6] transition"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={agregarCapsula}
                className="flex-1 bg-[#FF4D8D] hover:bg-[#E63A79] transition rounded-full py-3 font-semibold tracking-wide text-white"
              >
                Sellar mensaje
              </button>
              <button
                onClick={() => setMostrarForm(false)}
                className="px-6 rounded-full py-3 font-semibold tracking-wide text-[#C7C7D3] border border-[#453A67] hover:border-[#FF7EB6]/50 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setMostrarForm(true)}
            className="w-full flex items-center justify-center gap-2 bg-[#FF4D8D] hover:bg-[#E63A79] transition rounded-full py-3 font-semibold tracking-wide text-white"
          >
            <Plus size={20} />
            Crear nueva cápsula
          </button>
        )}
      </div>
    </section>
  );
}

export default CapsulaDelTiempo;