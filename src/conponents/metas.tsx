import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../lib/supabase.js";
import {
  CalendarDays,
  Rocket,
  Mountain,
  Infinity as InfinityIcon,
  Plus,
  Check,
  Trash2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PartyPopper,
  Target,
  Calendar as CalendarIcon,
  Trophy,
  ArrowLeft,
  X,
} from "lucide-react";

interface Tarea {
  id: number;
  plazo: string;
  texto: string;
  hecha: boolean;
  fecha: string | null;
}

interface Plazo {
  key: string;
  titulo: string;
  descripcion: string;
  icono: React.ReactNode;
  color: string;
  dot: string;
  glow: string;
}

const plazosBase: Plazo[] = [
  {
    key: "este-anio",
    titulo: "En este año",
    descripcion: "Metas y planes para los próximos 12 meses.",
    icono: <CalendarDays size={26} />,
    color: "from-pink-500 to-rose-400",
    dot: "bg-pink-500",
    glow: "shadow-pink-500/30",
  },
  {
    key: "5-anios",
    titulo: "De aquí a 5 años",
    descripcion: "Sueños a mediano plazo como pareja.",
    icono: <Rocket size={26} />,
    color: "from-orange-400 to-yellow-400",
    dot: "bg-orange-400",
    glow: "shadow-orange-400/30",
  },
  {
    key: "10-anios",
    titulo: "De aquí a 10 años",
    descripcion: "Grandes proyectos a largo plazo.",
    icono: <Mountain size={26} />,
    color: "from-purple-500 to-fuchsia-500",
    dot: "bg-purple-500",
    glow: "shadow-purple-500/30",
  },
  {
    key: "toda-la-vida",
    titulo: "Toda la vida",
    descripcion: "Esas metas que quieren cumplir juntos siempre.",
    icono: <InfinityIcon size={26} />,
    color: "from-indigo-500 to-pink-500",
    dot: "bg-indigo-500",
    glow: "shadow-indigo-500/30",
  },
];

const nombresMes = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const diasSemana = ["D", "L", "M", "M", "J", "V", "S"];

function Metas() {
  const navigate = useNavigate();

  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [mostrarCumplidas, setMostrarCumplidas] = useState(false);
  const [abierto, setAbierto] = useState<string | null>("este-anio");

  // Ahora es una lista plana que viene de Supabase
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nuevaTarea, setNuevaTarea] = useState("");
  const [nuevaFecha, setNuevaFecha] = useState("");

  const hoy = new Date();
  const [mesActual, setMesActual] = useState(hoy.getMonth());
  const [anioActual, setAnioActual] = useState(hoy.getFullYear());
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);

  // --- Cargar metas desde Supabase al montar ---
  useEffect(() => {
    cargarMetas();
  }, []);

  async function cargarMetas() {
    setCargando(true);
    const { data, error } = await supabase
      .from("metas")
      .select("*")
      .order("creado_en", { ascending: true });

    if (error) {
      console.error(error);
      setError("No se pudieron cargar las metas.");
    } else {
      setTareas(data as Tarea[]);
      setError(null);
    }
    setCargando(false);
  }

  const toggleAbierto = (key: string) => {
    setAbierto(abierto === key ? null : key);
    setNuevaTarea("");
    setNuevaFecha("");
  };

  // --- Agregar tarea (insert en Supabase) ---
  const agregarTarea = async (plazo: string) => {
    if (!nuevaTarea.trim()) return;

    const nueva = {
      plazo,
      texto: nuevaTarea.trim(),
      hecha: false,
      fecha: nuevaFecha || null,
    };

    // Optimista: la agregamos localmente mientras se guarda
    const { data, error } = await supabase
      .from("metas")
      .insert(nueva)
      .select()
      .single();

    if (error) {
      console.error(error);
      setError("No se pudo guardar la meta.");
      return;
    }

    setTareas((prev) => [...prev, data as Tarea]);
    setNuevaTarea("");
    setNuevaFecha("");
  };

  // --- Marcar/desmarcar hecha (update en Supabase) ---
  const toggleHecha = async (id: number) => {
    const tarea = tareas.find((t) => t.id === id);
    if (!tarea) return;

    const nuevoEstado = !tarea.hecha;

    // Optimista
    setTareas((prev) => prev.map((t) => (t.id === id ? { ...t, hecha: nuevoEstado } : t)));

    const { error } = await supabase
      .from("metas")
      .update({ hecha: nuevoEstado })
      .eq("id", id);

    if (error) {
      console.error(error);
      // revertir si falla
      setTareas((prev) => prev.map((t) => (t.id === id ? { ...t, hecha: !nuevoEstado } : t)));
      setError("No se pudo actualizar la meta.");
    }
  };

  // --- Eliminar tarea (delete en Supabase) ---
  const eliminarTarea = async (id: number) => {
    const respaldo = tareas;
    setTareas((prev) => prev.filter((t) => t.id !== id));

    const { error } = await supabase.from("metas").delete().eq("id", id);

    if (error) {
      console.error(error);
      setTareas(respaldo); // revertir si falla
      setError("No se pudo eliminar la meta.");
    }
  };

  // --- Helpers derivados (agrupar por plazo) ---
  const tareasPorPlazo = (key: string) => tareas.filter((t) => t.plazo === key);

  const totalTareas = tareas.length;
  const totalCompletadas = tareas.filter((t) => t.hecha).length;
  const porcentajeGlobal = totalTareas === 0 ? 0 : Math.round((totalCompletadas / totalTareas) * 100);
  const cumplidas = tareas.filter((t) => t.hecha);

  const getPlazoInfo = (key: string) => plazosBase.find((p) => p.key === key)!;

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

  if (cargando) {
    return (
      <section className="px-3 sm:px-6 py-10 text-center text-gray-300">
        Cargando metas...
      </section>
    );
  }

  return (
    <section className="px-3 sm:px-6 py-5 sm:py-10 relative">
      <div className="max-w-4xl mx-auto w-full">

        {error && (
          <div className="bg-red-500/20 border border-red-500/40 text-red-200 text-sm rounded-xl px-4 py-2 mb-4">
            {error}
          </div>
        )}

        {/* Volver + botoncitos */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-gray-300 hover:text-white text-sm transition"
          >
            <ArrowLeft size={16} /> Volver
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMostrarCumplidas(true)}
              className="relative bg-white/10 hover:bg-white/20 transition rounded-full p-2 sm:p-2.5"
              title="Ver cumplidas"
            >
              <Trophy size={17} className="text-yellow-400" />
              {cumplidas.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-orange-400 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                  {cumplidas.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setMostrarCalendario(true)}
              className="bg-white/10 hover:bg-white/20 transition rounded-full p-2 sm:p-2.5"
              title="Ver calendario"
            >
              <CalendarIcon size={17} className="text-pink-300" />
            </button>
          </div>
        </div>

        <div className="text-center mb-5 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold flex items-center justify-center gap-2">
            <Target className="text-pink-400" size={28} />
            Cosas por hacer
          </h1>
          <p className="text-gray-300 mt-2 sm:mt-3 text-xs sm:text-base">
            Sus metas juntos, organizadas como quieran verlas
          </p>
        </div>

        {/* Resumen general */}
        <div className="bg-white/10 backdrop-blur rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-5 sm:mb-6">
          <div className="flex items-center justify-between mb-3 gap-2">
            <h2 className="font-bold text-base sm:text-xl">Progreso total</h2>
            <span className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent shrink-0">
              {porcentajeGlobal}%
            </span>
          </div>
          <div className="w-full bg-gray-700/60 rounded-full h-2.5 sm:h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-pink-500 via-fuchsia-500 to-orange-400 h-2.5 sm:h-3 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${porcentajeGlobal}%` }}
            />
          </div>
          <p className="text-gray-400 text-xs sm:text-sm mt-2">
            {totalCompletadas} de {totalTareas} metas cumplidas en total
          </p>
        </div>

        {/* ---------- LISTA (vista principal) ---------- */}
        <div className="space-y-4 sm:space-y-5">
          {plazosBase.map((plazo) => {
            const estaAbierto = abierto === plazo.key;
            const listaTareas = tareasPorPlazo(plazo.key);
            const completadas = listaTareas.filter((t) => t.hecha).length;
            const total = listaTareas.length;
            const porcentaje = total === 0 ? 0 : Math.round((completadas / total) * 100);
            const completoTodo = total > 0 && completadas === total;

            return (
              <div
                key={plazo.key}
                className={`rounded-2xl sm:rounded-3xl overflow-hidden bg-white/10 backdrop-blur transition-shadow duration-300 shadow-lg ${
                  estaAbierto ? plazo.glow : ""
                }`}
              >
                <button
                  onClick={() => toggleAbierto(plazo.key)}
                  className={`w-full bg-gradient-to-r ${plazo.color} p-4 sm:p-6 
                  flex items-center justify-between gap-3 sm:gap-4 hover:brightness-110 active:scale-[0.99] transition text-left`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="bg-white/20 rounded-full p-2.5 sm:p-3 text-white shrink-0 relative">
                      {plazo.icono}
                      {completoTodo && (
                        <span className="absolute -top-1.5 -right-1.5 bg-yellow-300 rounded-full p-1 shadow">
                          <PartyPopper size={12} className="text-orange-600" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-base sm:text-xl text-white flex items-center gap-2 flex-wrap">
                        {plazo.titulo}
                        {completoTodo && (
                          <span className="text-[10px] sm:text-xs bg-white/25 px-2 py-0.5 rounded-full font-semibold">
                            ¡Completado! 🎉
                          </span>
                        )}
                      </h3>
                      <p className="text-white/80 text-xs sm:text-sm mt-1 truncate">{plazo.descripcion}</p>
                      {total > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="w-20 sm:w-32 bg-black/20 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-white h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${porcentaje}%` }}
                            />
                          </div>
                          <span className="text-white/80 text-[11px] sm:text-xs font-medium shrink-0">
                            {completadas}/{total}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronDown
                    size={20}
                    className={`text-white shrink-0 transition-transform duration-300 ${estaAbierto ? "rotate-180" : ""}`}
                  />
                </button>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    estaAbierto ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="p-4 sm:p-6 bg-white/5">
                      <div className="space-y-2 mb-4">
                        {listaTareas.length === 0 && (
                          <div className="text-center py-6">
                            <div className="text-3xl mb-2">✨</div>
                            <p className="text-gray-400 text-sm">Todavía no hay metas acá.</p>
                            <p className="text-gray-500 text-xs mt-1">¡Agreguen la primera abajo!</p>
                          </div>
                        )}
                        {listaTareas.map((tarea) => (
                          <div
                            key={tarea.id}
                            className={`flex items-center justify-between gap-2 sm:gap-3 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 transition-all ${
                              tarea.hecha ? "bg-white/5" : "bg-white/10 hover:bg-white/[0.14]"
                            }`}
                          >
                            <button
                              onClick={() => toggleHecha(tarea.id)}
                              className="flex items-center gap-2 sm:gap-3 flex-1 text-left min-w-0"
                            >
                              <span
                                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                  tarea.hecha
                                    ? `bg-gradient-to-r ${plazo.color} border-transparent scale-105`
                                    : "border-gray-400"
                                }`}
                              >
                                {tarea.hecha && <Check size={10} className="text-white" />}
                              </span>
                              <span className="min-w-0">
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
                            <button
                              onClick={() => eliminarTarea(tarea.id)}
                              className="text-gray-500 hover:text-red-400 transition shrink-0 p-1"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={nuevaTarea}
                          onChange={(e) => setNuevaTarea(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") agregarTarea(plazo.key); }}
                          placeholder="Nueva meta..."
                          className="flex-1 bg-white/10 rounded-full px-4 py-2 text-sm sm:text-base 
                          text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-pink-400 transition"
                        />
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={nuevaFecha}
                            onChange={(e) => setNuevaFecha(e.target.value)}
                            className="bg-white/10 rounded-full px-3 py-2 text-xs sm:text-sm text-white outline-none 
                            focus:ring-2 focus:ring-pink-400 transition [color-scheme:dark] flex-1 sm:flex-none"
                          />
                          <button
                            onClick={() => agregarTarea(plazo.key)}
                            className={`bg-gradient-to-r ${plazo.color} rounded-full p-2.5 
                            hover:brightness-110 active:scale-95 transition shrink-0 shadow-md`}
                          >
                            <Plus size={20} className="text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------- MODAL CALENDARIO ---------- */}
      {mostrarCalendario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a0f2e] w-full max-w-md sm:max-w-lg rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto relative shadow-2xl">
            <button
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
              <button onClick={() => cambiarMes(-1)} className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition">
                <ChevronLeft size={18} />
              </button>
              <h3 className="font-bold text-sm sm:text-lg text-center">
                {nombresMes[mesActual]} {anioActual}
              </h3>
              <button onClick={() => cambiarMes(1)} className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition">
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
                    key={i}
                    onClick={() => setDiaSeleccionado(seleccionado ? null : fechaStr)}
                    className={`aspect-square min-w-0 rounded-lg sm:rounded-2xl flex flex-col items-center justify-center gap-0.5 
                    transition-all text-[10px] sm:text-sm relative p-0.5
                    ${seleccionado
                        ? "bg-gradient-to-br from-pink-500 to-orange-400 text-white shadow-lg scale-105"
                        : esHoy(dia)
                        ? "bg-white/20 text-white font-bold ring-1 ring-pink-400"
                        : "hover:bg-white/10 text-gray-200"
                    }`}
                  >
                    <span>{dia}</span>
                    {tareasDelDia.length > 0 && (
                      <div className="flex gap-0.5">
                        {tareasDelDia.slice(0, 3).map((t, idx) => (
                          <span
                            key={idx}
                            className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${
                              seleccionado ? "bg-white" : getPlazoInfo(t.plazo).dot
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
                  <CalendarDays size={15} className="text-pink-400 shrink-0" />
                  {diaSeleccionado.split("-").reverse().join("/")}
                </h3>
                {tareasEnFecha(diaSeleccionado).length === 0 ? (
                  <p className="text-gray-400 text-xs sm:text-sm text-center py-3">No hay metas para este día.</p>
                ) : (
                  <div className="space-y-2">
                    {tareasEnFecha(diaSeleccionado).map((t) => {
                      const plazoInfo = getPlazoInfo(t.plazo);
                      return (
                        <div key={t.id} className="flex items-center gap-2 sm:gap-3 bg-white/5 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3">
                          <button
                            onClick={() => toggleHecha(t.id)}
                            className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                              t.hecha ? `bg-gradient-to-r ${plazoInfo.color} border-transparent` : "border-gray-400"
                            }`}
                          >
                            {t.hecha && <Check size={10} className="text-white" />}
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs sm:text-sm break-words ${t.hecha ? "line-through text-gray-500" : "text-white"}`}>
                              {t.texto}
                            </p>
                            <span className={`inline-block text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r ${plazoInfo.color} text-white mt-1`}>
                              {plazoInfo.titulo}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-3 mt-4 sm:mt-5 pt-4 border-t border-white/10">
              {plazosBase.map((p) => (
                <div key={p.key} className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-300">
                  <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                  {p.titulo}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------- MODAL CUMPLIDAS ---------- */}
      {mostrarCumplidas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a0f2e] w-full max-w-md sm:max-w-lg rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto relative shadow-2xl">
            <button
              onClick={() => setMostrarCumplidas(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/10 hover:bg-white/20 transition rounded-full p-1.5"
            >
              <X size={16} className="text-white" />
            </button>

            <div className="text-center mb-5 sm:mb-6">
              <div className="text-3xl sm:text-4xl mb-2">🏆</div>
              <h2 className="font-bold text-lg sm:text-2xl px-2">
                {cumplidas.length} {cumplidas.length === 1 ? "meta cumplida" : "metas cumplidas"}
              </h2>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">Todo lo que ya lograron juntos</p>
            </div>

            {cumplidas.length === 0 ? (
              <p className="text-gray-400 text-xs sm:text-sm text-center py-8">
                Todavía no marcaron ninguna meta como cumplida.
              </p>
            ) : (
              <div className="space-y-2">
                {cumplidas.map((t) => {
                  const plazoInfo = getPlazoInfo(t.plazo);
                  return (
                    <div
                      key={t.id}
                      className="flex items-center gap-2 sm:gap-3 bg-white/5 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3"
                    >
                      <span className={`bg-gradient-to-r ${plazoInfo.color} rounded-full p-1.5 shrink-0`}>
                        <Check size={11} className="text-white" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-base text-white break-words">{t.texto}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`inline-block text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r ${plazoInfo.color} text-white`}>
                            {plazoInfo.titulo}
                          </span>
                          {t.fecha && (
                            <span className="text-[10px] sm:text-[11px] text-gray-400">
                              {t.fecha.split("-").reverse().join("/")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default Metas;