import { useState } from "react";
import {
  Check,
  ArrowLeft,
  Heart,
  Calendar as CalendarIcon,
  Trophy,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  X,
} from "lucide-react";

interface Tarea {
  id: number;
  texto: string;
  hecha: boolean;
  fecha: string | null; // "YYYY-MM-DD"
}

const listaCien: string[] = [
  "Ver el amanecer juntos", "Ver el atardecer desde un mirador", "Hacer un picnic en el parque",
  "Cocinar una receta nueva juntos", "Tener una noche de juegos de mesa", "Acampar bajo las estrellas",
  "Ir a un autocine", "Andar en bici juntos", "Hacer una lista de reproducción compartida",
  "Aprender a bailar algo nuevo", "Tomar una clase de cocina", "Escribirse cartas a futuro",
  "Hacer un scrapbook de recuerdos", "Ver toda una saga de películas en un fin de semana",
  "Ir a acampar a la montaña", "Visitar un pueblo que no conozcan", "Hacer senderismo juntos",
  "Ir a un concierto", "Ver las estrellas con telescopio", "Tener una cena a la luz de las velas",
  "Hacer un maratón de series", "Ir a un parque de diversiones", "Aprender un idioma juntos",
  "Plantar un árbol o una planta juntos", "Hacer un huerto en casa", "Adoptar una mascota",
  "Ir a la playa a ver el mar de noche", "Hacer una fogata y contar historias",
  "Ir a un spa juntos", "Tener un día sin celular", "Escribir 3 cosas que aman del otro",
  "Recrear su primera cita", "Ir a desayunar afuera un domingo", "Hacer un picnic con estrellas",
  "Cocinar el plato favorito del otro", "Ir a un museo", "Ir al teatro",
  "Hacer un tour gastronómico por la ciudad", "Probar comida de un país que no conocen",
  "Ir a nadar juntos", "Hacer una competencia de karaoke", "Armar un rompecabezas grande juntos",
  "Ver el amanecer desde la terraza", "Ir de camping sin señal de celular",
  "Hacer una excursión en kayak", "Aprender a tocar un instrumento juntos",
  "Ir a una feria o kermés", "Visitar una ciudad nueva por un fin de semana",
  "Hacer una caminata nocturna", "Ir a ver fuegos artificiales",
  "Hacer un altar de fotos juntos", "Tener una noche de spa casero",
  "Regalarse algo hecho a mano", "Hacer volar un barrilete/cometa",
  "Ir a un festival de música", "Tomar clases de baile de salón",
  "Hacer un viaje en tren", "Ir a acampar en la playa",
  "Ver una película en un idioma que no conocen con subtítulos",
  "Hacer una lista de metas de bucket list juntos", "Ir a montar a caballo",
  "Hacer una caminata con perros (propios o de un refugio)",
  "Visitar un mercado de pulgas juntos", "Ir a probar heladerías nuevas",
  "Hacer un brindis por sus logros del año", "Tener una noche temática de cine",
  "Ir a un balneario o piscina natural", "Hacer una excursión en bicicleta larga",
  "Aprender fotografía juntos y salir a tomar fotos", "Hacer un video con sus mejores recuerdos",
  "Ir a ver un partido en vivo", "Cocinar para otra pareja de amigos",
  "Hacer una noche de trivia", "Visitar una feria de artesanos",
  "Ir a un jardín botánico", "Hacer una ruta en auto sin planificar el destino",
  "Ir a nadar en un río o cascada", "Escribir una carta de gratitud al otro",
  "Hacer un ritual anual de repasar el año juntos", "Ir a un bar de juegos (pool, dardos, etc)",
  "Aprender a hacer pan casero juntos", "Ir a acampar a un lugar sin electricidad",
  "Hacer una caminata al amanecer para ver la ciudad despertar",
  "Ir a un planetario", "Hacer una tarde de repostería",
  "Visitar la casa donde creció el otro (si se puede)",
  "Hacer una lista de canciones que representen su relación",
  "Ir a probar un restaurante de alta cocina",
  "Tener una noche sin planes, solo improvisar", "Hacer un viaje solo con mochila",
  "Ir a esquiar o a la nieve", "Aprender yoga en pareja",
  "Hacer una excursión de avistamiento de aves o animales",
  "Ir a un crucero o paseo en barco", "Renovar sus votos o promesas de forma simbólica",
  "Hacer una cápsula del tiempo para abrir en el futuro",
  "Ir a ver un eclipse o lluvia de estrellas", "Vivir un día completo sin quejarse de nada",
  "Hacer las paces después de una discusión con una cena especial",
  "Crear una tradición anual propia de la pareja",
];

const nombresMes = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const diasSemana = ["D", "L", "M", "M", "J", "V", "S"];

interface CienCosasProps {
  onVolver: () => void;
}

function CienCosas({ onVolver }: CienCosasProps) {
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [mostrarRealizados, setMostrarRealizados] = useState(false);
  const [editandoFechaId, setEditandoFechaId] = useState<number | null>(null);

  const [tareas, setTareas] = useState<Tarea[]>(
    listaCien.map((texto, i) => ({ id: i + 1, texto, hecha: false, fecha: null }))
  );

  const hoy = new Date();
  const [mesActual, setMesActual] = useState(hoy.getMonth());
  const [anioActual, setAnioActual] = useState(hoy.getFullYear());
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

  const toggleHecha = (id: number) => {
    setTareas((prev) =>
      prev.map((t) => (t.id === id ? { ...t, hecha: !t.hecha } : t))
    );
  };

  const asignarFecha = (id: number, fecha: string) => {
    setTareas((prev) =>
      prev.map((t) => (t.id === id ? { ...t, fecha: fecha || null } : t))
    );
  };

  const completadas = tareas.filter((t) => t.hecha);
  const porcentaje = Math.round((completadas.length / tareas.length) * 100);

  // --- Lógica de calendario ---
  const primerDiaMes = new Date(anioActual, mesActual, 1).getDay();
  const diasEnMes = new Date(anioActual, mesActual + 1, 0).getDate();
  const celdas: (number | null)[] = [
    ...Array(primerDiaMes).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ];

  const formatearFecha = (dia: number) => {
    const mm = String(mesActual + 1).padStart(2, "0");
    const dd = String(dia).padStart(2, "0");
    return `${anioActual}-${mm}-${dd}`;
  };

  const tareasEnFecha = (fecha: string) => tareas.filter((t) => t.fecha === fecha);

  const cambiarMes = (delta: number) => {
    let nuevoMes = mesActual + delta;
    let nuevoAnio = anioActual;
    if (nuevoMes < 0) { nuevoMes = 11; nuevoAnio -= 1; }
    else if (nuevoMes > 11) { nuevoMes = 0; nuevoAnio += 1; }
    setMesActual(nuevoMes);
    setAnioActual(nuevoAnio);
    setDiaSeleccionado(null);
  };

  const esHoy = (dia: number) =>
    dia === hoy.getDate() && mesActual === hoy.getMonth() && anioActual === hoy.getFullYear();

  const handleVolver = () => {
    onVolver();
  };

  return (
    <section className="px-3 sm:px-6 py-5 sm:py-10 relative">
      <div className="max-w-4xl mx-auto w-full">

        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <button
            type="button"
            onClick={handleVolver}
            className="inline-flex items-center gap-1 text-gray-300 hover:text-white text-sm transition cursor-pointer"
          >
            <ArrowLeft size={16} /> Volver
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMostrarRealizados(true)}
              className="relative bg-white/10 hover:bg-white/20 transition rounded-full p-2 sm:p-2.5"
              title="Ver cumplidas"
            >
              <Trophy size={17} className="text-yellow-400" />
              {completadas.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                  {completadas.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setMostrarCalendario(true)}
              className="bg-white/10 hover:bg-white/20 transition rounded-full p-2 sm:p-2.5"
              title="Ver calendario"
            >
              <CalendarIcon size={17} className="text-pink-300" />
            </button>
          </div>
        </div>

        <div className="text-center mb-5 sm:mb-8 px-1">
          <h1 className="text-2xl sm:text-4xl font-bold flex items-center justify-center gap-2 flex-wrap">
            <Heart className="text-red-400 shrink-0" size={26} />
            <span>100 cosas juntos</span>
          </h1>
          <p className="text-gray-300 mt-2 sm:mt-3 text-xs sm:text-base">
            Una lista gigante de ideas para hacer en pareja
          </p>
        </div>

        {/* Progreso general */}
        <div className="bg-white/10 backdrop-blur rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-5 sm:mb-6">
          <div className="flex items-center justify-between mb-3 gap-2">
            <h2 className="font-bold text-base sm:text-xl">Progreso</h2>
            <span className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent shrink-0">
              {porcentaje}%
            </span>
          </div>
          <div className="w-full bg-gray-700/60 rounded-full h-2.5 sm:h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-red-500 to-pink-500 h-2.5 sm:h-3 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
          <p className="text-gray-400 text-xs sm:text-sm mt-2">
            {completadas.length} de {tareas.length} cosas hechas
          </p>
        </div>

        {/* ---------- LISTA ---------- */}
        <div className="bg-white/10 backdrop-blur rounded-2xl sm:rounded-3xl p-3 sm:p-6">
          <div className="space-y-2">
            {tareas.map((tarea, idx) => {
              const editandoEsta = editandoFechaId === tarea.id;
              return (
                <div
                  key={tarea.id}
                  className={`rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 transition-all ${
                    tarea.hecha ? "bg-white/5" : "bg-white/10 hover:bg-white/[0.14]"
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => toggleHecha(tarea.id)}
                      className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 text-left"
                    >
                      <span className="text-[9px] sm:text-[10px] text-gray-500 w-5 sm:w-6 shrink-0">
                        {idx + 1}.
                      </span>
                      <span
                        className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                          tarea.hecha
                            ? "bg-gradient-to-r from-red-500 to-pink-500 border-transparent scale-105"
                            : "border-gray-400"
                        }`}
                      >
                        {tarea.hecha && <Check size={10} className="text-white" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-xs sm:text-base break-words sm:truncate transition ${
                            tarea.hecha ? "line-through text-gray-500" : "text-white"
                          }`}
                        >
                          {tarea.texto}
                        </span>
                        {tarea.fecha && (
                          <span className="text-[10px] sm:text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                            <CalendarDays size={10} />
                            {tarea.fecha.split("-").reverse().join("/")}
                          </span>
                        )}
                      </span>
                    </button>

                    {/* Botón calendario individual */}
                    <button
                      type="button"
                      onClick={() =>
                        setEditandoFechaId(editandoEsta ? null : tarea.id)
                      }
                      className={`shrink-0 rounded-full p-1.5 transition ${
                        tarea.fecha
                          ? "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                          : "bg-white/10 text-gray-400 hover:text-white hover:bg-white/20"
                      }`}
                      title="Asignar fecha"
                    >
                      <CalendarDays size={14} />
                    </button>
                  </div>

                  {/* Selector de fecha desplegable, solo si está editando este ítem */}
                  {editandoEsta && (
                    <div className="mt-2 pl-6 sm:pl-8 flex items-center gap-2">
                      <input
                        type="date"
                        value={tarea.fecha ?? ""}
                        onChange={(e) => asignarFecha(tarea.id, e.target.value)}
                        autoFocus
                        className="bg-white/10 rounded-full px-3 py-1.5 text-xs text-gray-200 outline-none 
                        focus:ring-2 focus:ring-pink-400 transition [color-scheme:dark] w-36 sm:w-auto"
                      />
                      {tarea.fecha && (
                        <button
                          type="button"
                          onClick={() => asignarFecha(tarea.id, "")}
                          className="text-gray-400 hover:text-red-400 transition text-xs"
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ---------- MODAL CALENDARIO ---------- */}
      {mostrarCalendario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a0f2e] w-full max-w-md sm:max-w-lg rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto relative shadow-2xl">
            <button
              type="button"
              onClick={() => setMostrarCalendario(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/10 hover:bg-white/20 transition rounded-full p-1.5"
            >
              <X size={16} className="text-white" />
            </button>

            <h2 className="font-bold text-lg sm:text-xl flex items-center gap-2 mb-4">
              <CalendarIcon size={18} className="text-pink-300" />
              Calendario
            </h2>

            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <button type="button" onClick={() => cambiarMes(-1)} className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition">
                <ChevronLeft size={18} />
              </button>
              <h3 className="font-bold text-sm sm:text-lg text-center">
                {nombresMes[mesActual]} {anioActual}
              </h3>
              <button type="button" onClick={() => cambiarMes(1)} className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition">
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="grid grid-cols-7 mb-1.5 sm:mb-2">
              {diasSemana.map((d, i) => (
                <div key={i} className="text-center text-[10px] sm:text-sm text-gray-400 font-semibold py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5 sm:gap-1.5">
              {celdas.map((dia, i) => {
                if (dia === null) return <div key={i} />;
                const fechaStr = formatearFecha(dia);
                const tareasDelDia = tareasEnFecha(fechaStr);
                const seleccionado = diaSeleccionado === fechaStr;

                return (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setDiaSeleccionado(seleccionado ? null : fechaStr)}
                    className={`aspect-square min-w-0 rounded-lg sm:rounded-2xl flex flex-col items-center justify-center gap-0.5 
                    transition-all text-[10px] sm:text-sm relative p-0.5
                    ${
                      seleccionado
                        ? "bg-gradient-to-br from-red-500 to-pink-500 text-white shadow-lg scale-105"
                        : esHoy(dia)
                        ? "bg-white/20 text-white font-bold ring-1 ring-pink-400"
                        : "hover:bg-white/10 text-gray-200"
                    }`}
                  >
                    <span>{dia}</span>
                    {tareasDelDia.length > 0 && (
                      <div className="flex gap-0.5">
                        {tareasDelDia.slice(0, 3).map((t) => (
                          <span
                            key={t.id}
                            className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${
                              seleccionado ? "bg-white" : "bg-red-400"
                            } ${t.hecha ? "opacity-40" : ""}`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {diaSeleccionado && (
              <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-white/10">
                <h3 className="font-bold text-xs sm:text-base mb-3 flex items-center gap-2">
                  <CalendarDays size={15} className="text-red-400 shrink-0" />
                  {diaSeleccionado.split("-").reverse().join("/")}
                </h3>
                {tareasEnFecha(diaSeleccionado).length === 0 ? (
                  <p className="text-gray-400 text-xs sm:text-sm text-center py-3">
                    No hay planes para este día.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {tareasEnFecha(diaSeleccionado).map((t) => (
                      <div key={t.id} className="flex items-center gap-2 sm:gap-3 bg-white/5 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3">
                        <button
                          type="button"
                          onClick={() => toggleHecha(t.id)}
                          className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                            t.hecha
                              ? "bg-gradient-to-r from-red-500 to-pink-500 border-transparent"
                              : "border-gray-400"
                          }`}
                        >
                          {t.hecha && <Check size={10} className="text-white" />}
                        </button>
                        <p className={`text-xs sm:text-sm break-words flex-1 min-w-0 ${t.hecha ? "line-through text-gray-500" : "text-white"}`}>
                          {t.texto}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------- MODAL REALIZADOS ---------- */}
      {mostrarRealizados && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a0f2e] w-full max-w-md sm:max-w-lg rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto relative shadow-2xl">
            <button
              type="button"
              onClick={() => setMostrarRealizados(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/10 hover:bg-white/20 transition rounded-full p-1.5"
            >
              <X size={16} className="text-white" />
            </button>

            <div className="text-center mb-5 sm:mb-6">
              <div className="text-3xl sm:text-4xl mb-2">🏆</div>
              <h2 className="font-bold text-lg sm:text-2xl px-2">
                {completadas.length} {completadas.length === 1 ? "cosa realizada" : "cosas realizadas"}
              </h2>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">Todo lo que ya tacharon de la lista</p>
            </div>

            {completadas.length === 0 ? (
              <p className="text-gray-400 text-xs sm:text-sm text-center py-8">
                Todavía no marcaron ninguna como hecha.
              </p>
            ) : (
              <div className="space-y-2">
                {completadas.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 sm:gap-3 bg-white/5 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3">
                    <span className="bg-gradient-to-r from-red-500 to-pink-500 rounded-full p-1.5 shrink-0">
                      <Check size={11} className="text-white" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-base text-white break-words">{t.texto}</p>
                      {t.fecha && (
                        <span className="text-[10px] sm:text-[11px] text-gray-400">
                          {t.fecha.split("-").reverse().join("/")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default CienCosas;