import { useState, useMemo } from "react";

type Sintoma = "cólicos" | "cansancio" | "ánimo bajo" | "hinchazón" | "dolor cabeza" | "buen ánimo";

interface RegistroDia {
  fecha: string; // YYYY-MM-DD
  sintomas: Sintoma[];
  nota: string;
}

interface InfoFase {
  nombre: string;
  color: string;
  claseCalendario: string;
  icono: string;
  descripcion: string;
}

const SINTOMAS_DISPONIBLES: { key: Sintoma; icono: string }[] = [
  { key: "cólicos", icono: "😣" },
  { key: "cansancio", icono: "🥱" },
  { key: "ánimo bajo", icono: "😔" },
  { key: "hinchazón", icono: "🎈" },
  { key: "dolor cabeza", icono: "🤕" },
  { key: "buen ánimo", icono: "😊" },
];

const DIAS_SEMANA = ["D", "L", "M", "M", "J", "V", "S"];

const LS_HISTORIAL = "ciclo_historial_inicios";
const LS_INICIO_LEGACY = "ciclo_ultima_fecha_inicio";
const LS_DURACION_CICLO = "ciclo_duracion_dias";
const LS_DURACION_PERIODO = "ciclo_duracion_periodo";
const LS_REGISTROS = "ciclo_registros";

function hoyISO() {
  return new Date().toISOString().split("T")[0];
}

function sumarDias(fechaISO: string, dias: number) {
  const fecha = new Date(fechaISO + "T00:00:00");
  fecha.setDate(fecha.getDate() + dias);
  return fecha.toISOString().split("T")[0];
}

function diferenciaDias(fechaA: string, fechaB: string) {
  const a = new Date(fechaA + "T00:00:00").getTime();
  const b = new Date(fechaB + "T00:00:00").getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function formatearFecha(fechaISO: string) {
  return new Date(fechaISO + "T00:00:00").toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function cargarHistorial(): string[] {
  try {
    const guardado = JSON.parse(localStorage.getItem(LS_HISTORIAL) || "[]");
    if (Array.isArray(guardado) && guardado.length > 0) return guardado.sort();
  } catch {
    /* noop */
  }
  const legacy = localStorage.getItem(LS_INICIO_LEGACY);
  return legacy ? [legacy] : [];
}

function calcularFase(diaCicloBruto: number, duracionCiclo: number, duracionPeriodo: number): InfoFase {
  const diaCiclo = ((diaCicloBruto - 1) % duracionCiclo) + 1;
  const diaOvulacion = duracionCiclo - 14;
  const ventanaFertilInicio = diaOvulacion - 5;
  const ventanaFertilFin = diaOvulacion + 1;

  if (diaCiclo <= duracionPeriodo) {
    return {
      nombre: "Menstrual",
      color: "from-[#EC4899] to-[#FB923C]",
      claseCalendario: "bg-[#EC4899]/30 border-[#EC4899]/60",
      icono: "🩸",
      descripcion: "Periodo en curso.",
    };
  }
  if (diaCiclo >= ventanaFertilInicio && diaCiclo <= ventanaFertilFin) {
    return {
      nombre: "Ventana fértil",
      color: "from-[#D946EF] to-[#EC4899]",
      claseCalendario: "bg-[#D946EF]/25 border-[#D946EF]/50",
      icono: "🌸",
      descripcion:
        diaCiclo === diaOvulacion
          ? "Día estimado de ovulación."
          : "Días de mayor probabilidad de fertilidad.",
    };
  }
  if (diaCiclo < ventanaFertilInicio) {
    return {
      nombre: "Folicular",
      color: "from-[#FACC15] to-[#FB923C]",
      claseCalendario: "bg-[#FACC15]/15 border-[#FACC15]/40",
      icono: "🌱",
      descripcion: "Fase previa a la ovulación.",
    };
  }
  return {
    nombre: "Lútea",
    color: "from-[#47356B] to-[#D946EF]",
    claseCalendario: "bg-[#47356B]/50 border-[#7B5FB8]/50",
    icono: "🌙",
    descripcion: "Fase posterior a la ovulación.",
  };
}

/** Devuelve info de fase para cualquier fecha, extendiendo predicciones hasta `limiteFuturo`. */
function infoParaFecha(
  fecha: string,
  historial: string[],
  duracionCiclo: number,
  duracionPeriodo: number,
  limiteFuturo: string
): { diaCiclo: number; fase: InfoFase; esPrediccion: boolean } | null {
  if (historial.length === 0) return null;

  const ultimoReal = historial[historial.length - 1];
  const inicios = [...historial];
  let cursor = ultimoReal;
  while (cursor < limiteFuturo) {
    cursor = sumarDias(cursor, duracionCiclo);
    inicios.push(cursor);
  }

  let inicioCiclo: string | null = null;
  for (let i = inicios.length - 1; i >= 0; i--) {
    if (inicios[i] <= fecha) {
      inicioCiclo = inicios[i];
      break;
    }
  }
  if (!inicioCiclo) return null;

  const diaCiclo = diferenciaDias(inicioCiclo, fecha) + 1;
  const fase = calcularFase(diaCiclo, duracionCiclo, duracionPeriodo);
  return { diaCiclo, fase, esPrediccion: inicioCiclo > ultimoReal };
}

function generarDiasMes(mesVisible: Date) {
  const anio = mesVisible.getFullYear();
  const mes = mesVisible.getMonth();
  const primerDiaSemana = new Date(anio, mes, 1).getDay();
  const inicioGrid = new Date(anio, mes, 1 - primerDiaSemana);

  return Array.from({ length: 42 }, (_, i) => {
    const fecha = new Date(inicioGrid);
    fecha.setDate(inicioGrid.getDate() + i);
    return {
      iso: fecha.toISOString().split("T")[0],
      dia: fecha.getDate(),
      delMes: fecha.getMonth() === mes,
    };
  });
}

export default function Ciclo() {
  const [historial, setHistorial] = useState<string[]>(cargarHistorial);
  const [duracionCiclo, setDuracionCiclo] = useState<number>(
    () => Number(localStorage.getItem(LS_DURACION_CICLO)) || 28
  );
  const [duracionPeriodo, setDuracionPeriodo] = useState<number>(
    () => Number(localStorage.getItem(LS_DURACION_PERIODO)) || 5
  );
  const [registros, setRegistros] = useState<Record<string, RegistroDia>>(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_REGISTROS) || "{}");
    } catch {
      return {};
    }
  });
  const [mostrarConfig, setMostrarConfig] = useState(historial.length === 0);
  const [diaSeleccionado, setDiaSeleccionado] = useState<string>(hoyISO());
  const [mesVisible, setMesVisible] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [fechaManual, setFechaManual] = useState<string>(hoyISO());

  const guardarHistorial = (nuevo: string[]) => {
    const ordenado = [...new Set(nuevo)].sort();
    setHistorial(ordenado);
    localStorage.setItem(LS_HISTORIAL, JSON.stringify(ordenado));
  };

  const guardarDuracionCiclo = (v: number) => {
    setDuracionCiclo(v);
    localStorage.setItem(LS_DURACION_CICLO, String(v));
  };

  const guardarDuracionPeriodo = (v: number) => {
    setDuracionPeriodo(v);
    localStorage.setItem(LS_DURACION_PERIODO, String(v));
  };

  const guardarRegistros = (nuevo: Record<string, RegistroDia>) => {
    setRegistros(nuevo);
    localStorage.setItem(LS_REGISTROS, JSON.stringify(nuevo));
  };

  const agregarInicio = (fecha: string) => {
    guardarHistorial([...historial, fecha]);
    setMostrarConfig(false);
  };

  const quitarInicio = (fecha: string) => {
    guardarHistorial(historial.filter((f) => f !== fecha));
  };

  // Duración de ciclos pasados, calculada a partir del historial real
  const duracionesReales = useMemo(() => {
    const diffs: { desde: string; hasta: string; dias: number }[] = [];
    for (let i = 1; i < historial.length; i++) {
      diffs.push({
        desde: historial[i - 1],
        hasta: historial[i],
        dias: diferenciaDias(historial[i - 1], historial[i]),
      });
    }
    return diffs;
  }, [historial]);

  const promedioReal = useMemo(() => {
    if (duracionesReales.length === 0) return null;
    const suma = duracionesReales.reduce((acc, d) => acc + d.dias, 0);
    return Math.round(suma / duracionesReales.length);
  }, [duracionesReales]);

  const infoHoy = useMemo(() => {
    if (historial.length === 0) return null;
    const limite = sumarDias(hoyISO(), duracionCiclo * 2);
    return infoParaFecha(hoyISO(), historial, duracionCiclo, duracionPeriodo, limite);
  }, [historial, duracionCiclo, duracionPeriodo]);

  const proximoInicio = useMemo(() => {
    if (historial.length === 0) return null;
    const ultimo = historial[historial.length - 1];
    let cursor = ultimo;
    while (cursor <= hoyISO()) cursor = sumarDias(cursor, duracionCiclo);
    return cursor;
  }, [historial, duracionCiclo]);

  const diasGrid = useMemo(() => generarDiasMes(mesVisible), [mesVisible]);

  const limiteFuturoCalendario = useMemo(
    () => diasGrid[diasGrid.length - 1]?.iso ?? hoyISO(),
    [diasGrid]
  );

  const registroSeleccionado: RegistroDia = registros[diaSeleccionado] || {
    fecha: diaSeleccionado,
    sintomas: [],
    nota: "",
  };

  const toggleSintoma = (sintoma: Sintoma) => {
    const actual = registros[diaSeleccionado] || { fecha: diaSeleccionado, sintomas: [], nota: "" };
    const yaTiene = actual.sintomas.includes(sintoma);
    guardarRegistros({
      ...registros,
      [diaSeleccionado]: {
        ...actual,
        sintomas: yaTiene ? actual.sintomas.filter((s) => s !== sintoma) : [...actual.sintomas, sintoma],
      },
    });
  };

  const actualizarNota = (nota: string) => {
    const actual = registros[diaSeleccionado] || { fecha: diaSeleccionado, sintomas: [], nota: "" };
    guardarRegistros({ ...registros, [diaSeleccionado]: { ...actual, nota } });
  };

  const cambiarMes = (delta: number) => {
    const nuevo = new Date(mesVisible);
    nuevo.setMonth(nuevo.getMonth() + delta);
    setMesVisible(nuevo);
  };

  return (
    <div className="min-h-screen bg-[#1B1033] text-white px-5 pt-24 pb-28">
      <style>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .ciclo-header { animation: fadeIn 0.5s ease both; }
        .ciclo-card { animation: fadeSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        .ciclo-dia { transition: transform 0.12s ease, filter 0.15s ease; }
        .ciclo-dia:hover { transform: scale(1.08); filter: brightness(1.15); }
        .ciclo-chip { transition: transform 0.15s ease; }
        .ciclo-chip:hover { transform: translateY(-1px); }
        .ciclo-chip:active { transform: scale(0.96); }
        .ciclo-btn { transition: transform 0.15s ease, filter 0.2s ease; }
        .ciclo-btn:hover { filter: brightness(1.08); }
        .ciclo-btn:active { transform: scale(0.97); }
        @media (prefers-reduced-motion: reduce) {
          .ciclo-header, .ciclo-card, .ciclo-dia, .ciclo-chip, .ciclo-btn { animation: none !important; transition: none !important; }
        }
      `}</style>

      <div className="ciclo-header mb-6">
        <h1 className="text-3xl font-bold text-[#EC4899] mb-2">🌸 Ciclo</h1>
        <p className="text-gray-400">
          Calendario, predicciones y registro de síntomas.
        </p>
      </div>

      {/* Configuración inicial */}
      {mostrarConfig && (
        <div className="ciclo-card bg-[#2A1847] border border-white/10 rounded-3xl p-5 mb-6">
          <h2 className="font-bold text-lg mb-4">Configurar ciclo</h2>

          <label className="block text-sm text-gray-400 mb-1">
            Agregar fecha de inicio de un periodo
          </label>
          <div className="flex gap-3 mb-4">
            <input
              type="date"
              value={fechaManual}
              max={hoyISO()}
              onChange={(e) => setFechaManual(e.target.value)}
              className="flex-1 bg-[#1B1033] border border-white/10 rounded-xl px-4 py-2.5 text-white"
            />
            <button
              onClick={() => agregarInicio(fechaManual)}
              className="ciclo-btn px-5 rounded-xl font-semibold bg-gradient-to-r from-[#EC4899] to-[#FB923C] text-white"
            >
              Agregar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Duración del ciclo (días)</label>
              <input
                type="number"
                min={20}
                max={45}
                value={duracionCiclo}
                onChange={(e) => guardarDuracionCiclo(Number(e.target.value))}
                className="w-full bg-[#1B1033] border border-white/10 rounded-xl px-4 py-2.5 text-white"
              />
              {promedioReal && (
                <p className="text-xs text-gray-500 mt-1">Promedio real registrado: {promedioReal} días</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Duración del periodo (días)</label>
              <input
                type="number"
                min={2}
                max={10}
                value={duracionPeriodo}
                onChange={(e) => guardarDuracionPeriodo(Number(e.target.value))}
                className="w-full bg-[#1B1033] border border-white/10 rounded-xl px-4 py-2.5 text-white"
              />
            </div>
          </div>

          {historial.length > 0 && (
            <>
              <p className="text-sm text-gray-400 mb-2">Fechas registradas</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {historial.map((f) => (
                  <span
                    key={f}
                    className="flex items-center gap-2 bg-[#1B1033] border border-white/10 rounded-full px-3 py-1 text-xs"
                  >
                    {formatearFecha(f)}
                    <button onClick={() => quitarInicio(f)} className="text-gray-500 hover:text-[#EC4899]">
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </>
          )}

          {historial.length > 0 && (
            <button
              onClick={() => setMostrarConfig(false)}
              className="ciclo-btn w-full rounded-xl py-2.5 font-semibold bg-[#1B1033] border border-white/10 text-gray-300"
            >
              Listo
            </button>
          )}
        </div>
      )}

      {historial.length > 0 && !mostrarConfig && (
        <>
          {/* Resumen de hoy */}
          {infoHoy && (
            <div
              className={`ciclo-card bg-gradient-to-br ${infoHoy.fase.color} rounded-3xl p-6 mb-5 relative overflow-hidden`}
            >
              <button
                onClick={() => setMostrarConfig(true)}
                className="absolute top-4 right-4 text-white/80 text-sm underline"
              >
                Editar
              </button>
              <div className="text-4xl mb-2">{infoHoy.fase.icono}</div>
              <p className="text-white/80 text-sm">Día {infoHoy.diaCiclo} del ciclo</p>
              <h2 className="text-2xl font-bold text-white mt-1">{infoHoy.fase.nombre}</h2>
              <p className="text-white/90 mt-2 text-sm">{infoHoy.fase.descripcion}</p>
            </div>
          )}

          {/* Estadísticas */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="ciclo-card bg-[#2A1847] border border-white/10 rounded-3xl p-5">
              <p className="text-gray-400 text-xs mb-1">Próximo periodo</p>
              <p className="font-bold text-lg text-[#FB923C]">
                {proximoInicio ? formatearFecha(proximoInicio) : "—"}
              </p>
              {proximoInicio && (
                <p className="text-gray-400 text-xs mt-1">
                  en {diferenciaDias(hoyISO(), proximoInicio)} días
                </p>
              )}
            </div>
            <div className="ciclo-card bg-[#2A1847] border border-white/10 rounded-3xl p-5">
              <p className="text-gray-400 text-xs mb-1">Ciclos registrados</p>
              <p className="font-bold text-lg text-[#D946EF]">{historial.length}</p>
              <p className="text-gray-400 text-xs mt-1">
                {promedioReal ? `promedio ${promedioReal} días` : "aún sin promedio"}
              </p>
            </div>
          </div>

          {/* Calendario */}
          <div className="ciclo-card bg-[#2A1847] border border-white/10 rounded-3xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => cambiarMes(-1)} className="ciclo-btn text-xl px-2">
                ‹
              </button>
              <h2 className="font-bold capitalize">
                {mesVisible.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
              </h2>
              <button onClick={() => cambiarMes(1)} className="ciclo-btn text-xl px-2">
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {DIAS_SEMANA.map((d, i) => (
                <div key={i} className="text-center text-xs text-gray-500 font-semibold py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {diasGrid.map(({ iso, dia, delMes }) => {
                const info = infoParaFecha(iso, historial, duracionCiclo, duracionPeriodo, limiteFuturoCalendario);
                const esHoy = iso === hoyISO();
                const esSeleccionado = iso === diaSeleccionado;
                const tieneRegistro =
                  !!registros[iso] && (registros[iso].sintomas.length > 0 || registros[iso].nota.trim() !== "");

                return (
                  <button
                    key={iso}
                    onClick={() => setDiaSeleccionado(iso)}
                    className={`ciclo-dia relative aspect-square rounded-lg text-xs flex items-center justify-center border ${
                      delMes ? "" : "opacity-30"
                    } ${info ? info.fase.claseCalendario : "bg-transparent border-transparent"} ${
                      esSeleccionado ? "ring-2 ring-white" : ""
                    } ${esHoy ? "font-bold text-[#FACC15]" : "text-white"} ${
                      info?.esPrediccion ? "border-dashed" : ""
                    }`}
                  >
                    {dia}
                    {tieneRegistro && (
                      <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-white" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Leyenda */}
            <div className="flex flex-wrap gap-3 mt-4 text-[11px] text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899]" /> Menstrual
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D946EF]" /> Fértil
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FACC15]" /> Folicular
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#47356B]" /> Lútea
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full border border-dashed border-gray-400" /> Predicho
              </span>
            </div>
          </div>

          {/* Registro del día seleccionado */}
          <div className="ciclo-card bg-[#2A1847] border border-white/10 rounded-3xl p-5 mb-6">
            <h2 className="font-bold text-lg mb-1">Registro diario</h2>
            <p className="text-gray-400 text-sm mb-4">{formatearFecha(diaSeleccionado)}</p>

            <p className="text-gray-400 text-sm mb-2">Síntomas</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {SINTOMAS_DISPONIBLES.map(({ key, icono }) => {
                const activo = registroSeleccionado.sintomas.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleSintoma(key)}
                    className={`ciclo-chip px-3 py-1.5 rounded-full text-sm border ${
                      activo
                        ? "bg-gradient-to-r from-[#EC4899] to-[#FB923C] border-transparent text-white"
                        : "bg-[#1B1033] border-white/10 text-gray-300"
                    }`}
                  >
                    {icono} {key}
                  </button>
                );
              })}
            </div>

            <p className="text-gray-400 text-sm mb-2">Nota</p>
            <textarea
              value={registroSeleccionado.nota}
              onChange={(e) => actualizarNota(e.target.value)}
              placeholder="¿Algo que quieras recordar de este día?"
              rows={3}
              className="w-full bg-[#1B1033] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-gray-500 resize-none"
            />
          </div>

          {/* Historial de ciclos */}
          {duracionesReales.length > 0 && (
            <div className="ciclo-card bg-[#2A1847] border border-white/10 rounded-3xl p-5">
              <h2 className="font-bold text-lg mb-4">Historial de ciclos</h2>
              <div className="space-y-2">
                {[...duracionesReales].reverse().map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-[#1B1033] border border-white/10 rounded-xl px-4 py-2.5 text-sm"
                  >
                    <span className="text-gray-300">
                      {formatearFecha(d.desde)} → {formatearFecha(d.hasta)}
                    </span>
                    <span className="font-semibold text-[#EC4899]">{d.dias} días</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}