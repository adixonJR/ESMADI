import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, RotateCcw, Trophy } from "lucide-react";
import AppBar from "../conponents/navbar"; // ajusta el path/nombre real de tu archivo

type Nivel = "suave" | "atrevido" | "intenso";

const NIVELES: { id: Nivel; label: string; emoji: string }[] = [
  { id: "suave", label: "Suave", emoji: "🕊️" },
  { id: "atrevido", label: "Atrevido", emoji: "🔥" },
  { id: "intenso", label: "Intenso", emoji: "⚡" },
];

const CATEGORIAS = [
  { id: "romantico", label: "Romántico", emoji: "💗", border: "border-pink-400", text: "text-pink-300", bg: "bg-pink-400/15" },
  { id: "picante", label: "Picante", emoji: "🌶️", border: "border-red-400", text: "text-red-300", bg: "bg-red-400/15" },
  { id: "complicidad", label: "Complicidad", emoji: "🤝", border: "border-yellow-400", text: "text-yellow-300", bg: "bg-yellow-400/15" },
  { id: "rol", label: "Rol", emoji: "🎭", border: "border-blue-400", text: "text-blue-300", bg: "bg-blue-400/15" },
  { id: "reto", label: "Reto", emoji: "⚡", border: "border-orange-400", text: "text-orange-300", bg: "bg-orange-400/15" },
  { id: "pregunta", label: "Pregunta incómoda", emoji: "❓", border: "border-fuchsia-400", text: "text-fuchsia-300", bg: "bg-fuchsia-400/15" },
  { id: "fotos", label: "Fotos (tus links)", emoji: "📷", border: "border-gray-500", text: "text-gray-300", bg: "bg-gray-400/15" },
  { id: "personalizada", label: "Personalizada", emoji: "✍️", border: "border-gray-500", text: "text-gray-300", bg: "bg-gray-400/15" },
];

const DURACIONES = [
  { segundos: 30, label: "30 seg" },
  { segundos: 60, label: "1 min" },
  { segundos: 120, label: "2 min" },
  { segundos: 180, label: "3 min" },
];

const PROMPTS: Record<string, Record<Nivel, string[]>> = {
  romantico: {
    suave: ["Dile a tu pareja 3 cosas que amas de ella.", "Recuerden juntos su primera cita."],
    atrevido: ["Dale un abrazo de 20 segundos sin soltarla.", "Susúrrale al oído por qué la elegirías otra vez."],
    intenso: ["Escríbele una mini carta de amor ahora mismo.", "Mírense a los ojos 1 minuto sin hablar."],
  },
  picante: {
    suave: ["Describe tu cita ideal con tu pareja.", "¿Cuál fue el momento más romántico que han vivido?"],
    atrevido: ["Dale un beso donde ella decida.", "Susúrrale algo que te gustaría hacer juntos este fin de semana."],
    intenso: ["Cuéntale una fantasía romántica que tengas.", "Bésense por 30 segundos sin parar."],
  },
  complicidad: {
    suave: ["Cuenten juntos un secreto tonto de su relación.", "¿Cuál es su meme o chiste interno favorito?"],
    atrevido: ["Cuéntale algo que nunca le has dicho.", "Hagan un plan secreto para su próxima sorpresa."],
    intenso: ["Confiesen su mayor miedo como pareja.", "Hablen de una meta que quieran lograr juntos este año."],
  },
  rol: {
    suave: ["Actúen cómo se conocieron, pero como si fuera una película.", "Imiten cómo reacciona el otro cuando se enoja."],
    atrevido: ["Interpreten una escena de 'primera cita' de nuevo.", "Uno hace de reportero entrevistando al otro sobre su amor."],
    intenso: ["Improvisen una escena romántica de película.", "Jueguen a ser 'desconocidos' que se conocen en un bar."],
  },
  reto: {
    suave: ["Bailen juntos 15 segundos sin música.", "Hagan 5 sentadillas juntos tomados de la mano."],
    atrevido: ["Denle un masaje de hombros de 1 minuto.", "Cántenle una estrofa de su canción favorita."],
    intenso: ["Denle de comer algo con los ojos vendados.", "Hagan una foto/pose romántica improvisada."],
  },
  pregunta: {
    suave: ["¿Qué es lo que más te costó de mí al principio?", "¿Cuándo supiste que te gustaba de verdad?"],
    atrevido: ["¿Qué es algo que te dio celos alguna vez?", "¿Qué costumbre mía te choca un poco?"],
    intenso: ["¿Hay algo que nunca me has dicho por miedo a mi reacción?", "¿Qué es lo que más te asusta de esta relación?"],
  },
  fotos: {
    suave: ["Muéstrale tu foto favorita de los dos.", "Comparte una foto random de tu galería y explícala."],
    atrevido: ["Muéstrale la última foto que te tomaste.", "Enséñale una foto vieja tuya de la niñez."],
    intenso: ["Muéstrale una foto que te dé un poco de vergüenza.", "Comparte una foto de un recuerdo importante para ti."],
  },
  personalizada: {
    suave: ["Reto personalizado: inventen uno entre los dos.", "Pregunta libre: cualquiera de los dos pregunta algo."],
    atrevido: ["Reto personalizado nivel atrevido — inventen el suyo.", "Pregunta incómoda personalizada."],
    intenso: ["Reto personalizado nivel intenso — inventen el suyo.", "Confesión personalizada, sin filtro."],
  },
};

type PromptSeleccionado = { catId: string; texto: string; imagenUrl?: string };

// ---- Motor de sonido (sintetizado, sin archivos externos) ----
function useSonidos() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      ctxRef.current = new AC();
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const tono = useCallback(
    (freq: number, duracion: number, tipo: OscillatorType = "sine", volumen = 0.18, delay = 0) => {
      try {
        const ctx = getCtx();
        const t0 = ctx.currentTime + delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = tipo;
        osc.frequency.setValueAtTime(freq, t0);
        gain.gain.setValueAtTime(volumen, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + duracion);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + duracion + 0.02);
      } catch {
        // audio no disponible, se ignora silenciosamente
      }
    },
    [getCtx]
  );

  const click = useCallback(() => tono(620, 0.06, "square", 0.12), [tono]);

  const dado = useCallback(() => {
    [180, 260, 220, 320, 280, 240].forEach((f, i) => tono(f, 0.05, "square", 0.1, i * 0.06));
  }, [tono]);

  const acierto = useCallback(() => {
    [523.25, 659.25, 783.99].forEach((f, i) => tono(f, 0.16, "sine", 0.18, i * 0.09));
  }, [tono]);

  // Sonido de "alerta de sistema" (estilo beep de escritorio) para pasar turno / se acaba el tiempo.
  // Nota: es un tono sintetizado propio, no un archivo de audio con copyright.
  const error = useCallback(() => {
    tono(1046.5, 0.09, "sine", 0.16, 0);
    tono(830.6, 0.09, "sine", 0.16, 0.09);
    tono(1046.5, 0.14, "sine", 0.16, 0.18);
  }, [tono]);

  const tick = useCallback(() => tono(900, 0.035, "sine", 0.07), [tono]);

  return { click, dado, acierto, error, tick };
}

function Chispa() {
  const navigate = useNavigate();
  const onSalir = () => navigate("/juegos");
  const sonido = useSonidos();

  const [pantalla, setPantalla] = useState<"config" | "juego">("config");

  const [jugador1, setJugador1] = useState("");
  const [jugador2, setJugador2] = useState("");
  const [quienEmpieza, setQuienEmpieza] = useState<number | null>(null);
  const [nivel, setNivel] = useState<Nivel>("atrevido");
  const [categorias, setCategorias] = useState<string[]>([
    "romantico",
    "complicidad",
    "rol",
    "reto",
    "pregunta",
  ]);
  const [duracion, setDuracion] = useState(60);

  const [turno, setTurno] = useState(0);
  const [ronda, setRonda] = useState(0);
  const [scoreJ1, setScoreJ1] = useState(0);
  const [scoreJ2, setScoreJ2] = useState(0);
  const [racha, setRacha] = useState(0);
  const [cartaRevelada, setCartaRevelada] = useState(false);
  const [girando, setGirando] = useState(false);
  const [promptActual, setPromptActual] = useState<PromptSeleccionado | null>(null);
  const [tiempoRestante, setTiempoRestante] = useState(duracion);
  const [corriendo, setCorriendo] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const nombreJ1 = jugador1.trim() || "Jugador 1";
  const nombreJ2 = jugador2.trim() || "Jugador 2";
  const jugadorActual = turno === 0 ? nombreJ1 : nombreJ2;

  const puedeEmpezar =
    jugador1.trim() !== "" && jugador2.trim() !== "" && categorias.length > 0;

  const toggleCategoria = (id: string) => {
    sonido.click();
    setCategorias((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const elegirQuienEmpieza = () => {
    sonido.click();
    setQuienEmpieza(Math.random() < 0.5 ? 0 : 1);
  };

  const elegirNivel = (n: Nivel) => {
    sonido.click();
    setNivel(n);
  };

  const elegirDuracion = (d: number) => {
    sonido.click();
    setDuracion(d);
  };

  const obtenerPromptAleatorio = (): PromptSeleccionado => {
    const pool: PromptSeleccionado[] = [];
    categorias.forEach((catId) => {
      const arr = PROMPTS[catId]?.[nivel];
      if (arr) arr.forEach((texto) => pool.push({ catId, texto }));
    });
    if (pool.length === 0) {
      return { catId: "personalizada", texto: "Agrega alguna categoría para ver retos aquí." };
    }
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const iniciarPartida = () => {
    if (!puedeEmpezar) return;
    sonido.acierto();
    setTurno(quienEmpieza ?? 0);
    setRonda(1);
    setScoreJ1(0);
    setScoreJ2(0);
    setRacha(0);
    setCartaRevelada(false);
    setPromptActual(null);
    setTiempoRestante(duracion);
    setCorriendo(false);
    setPantalla("juego");
  };

  const tirarDado = () => {
    if (cartaRevelada || girando) return;
    sonido.dado();
    setGirando(true);
    setTimeout(() => {
      setPromptActual(obtenerPromptAleatorio());
      setCartaRevelada(true);
      setGirando(false);
    }, 650);
  };

  const siguienteTurno = (sumaPunto: boolean) => {
    if (sumaPunto) {
      sonido.acierto();
      if (turno === 0) setScoreJ1((s) => s + 1);
      else setScoreJ2((s) => s + 1);
      setRacha((r) => r + 1);
    } else {
      sonido.error();
      setRacha(0);
    }

    const siguienteTurnoIndex = turno === 0 ? 1 : 0;
    if (siguienteTurnoIndex === (quienEmpieza ?? 0)) {
      setRonda((r) => r + 1);
    }
    setTurno(siguienteTurnoIndex);
    setCartaRevelada(false);
    setGirando(false);
    setPromptActual(null);
    setTiempoRestante(duracion);
    setCorriendo(false);
  };

  useEffect(() => {
    if (corriendo && tiempoRestante > 0) {
      intervalRef.current = setInterval(() => {
        setTiempoRestante((t) => {
          if (t <= 1) {
            setCorriendo(false);
            sonido.error();
            return 0;
          }
          if (t <= 4) sonido.tick();
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corriendo]);

  const reiniciarTimer = () => {
    sonido.click();
    setCorriendo(false);
    setTiempoRestante(duracion);
  };

  const alternarTimer = () => {
    sonido.click();
    setCorriendo((c) => !c);
  };

  const progreso = tiempoRestante / duracion;
  const radio = 44;
  const circunferencia = 2 * Math.PI * radio;

  const categoriaActual = promptActual
    ? CATEGORIAS.find((c) => c.id === promptActual.catId)
    : null;

  return (
    <div className="min-h-screen bg-[#1B1033] text-white pb-24">
      {/* AppBar global del juego: vuelve a /juegos, sea cual sea la pantalla interna */}
      <AppBar titulo="Chispa 🔥" volverA="/juegos" />

      <div className="max-w-md sm:max-w-lg mx-auto px-3 sm:px-5 pt-16">
        {pantalla === "config" ? (
          <>
            <div className="text-center">
              <p className="text-yellow-300 text-xs sm:text-sm tracking-wide font-semibold">
                JUEGOS PARA ENCENDER LA NOCHE
              </p>
            </div>

            <div className="bg-[#241539] border border-white/10 rounded-3xl p-3 sm:p-4 mt-4 space-y-4">
              <div>
                <h3 className="text-yellow-300 font-bold text-sm sm:text-base mb-2">
                  1. ¿Quiénes juegan?
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={jugador1}
                    onChange={(e) => setJugador1(e.target.value)}
                    placeholder="Jugador 1"
                    className="bg-[#2A1847] border border-white/10 rounded-xl px-3 py-2 text-sm placeholder-gray-500 outline-none focus:border-pink-400"
                  />
                  <input
                    value={jugador2}
                    onChange={(e) => setJugador2(e.target.value)}
                    placeholder="Jugador 2"
                    className="bg-[#2A1847] border border-white/10 rounded-xl px-3 py-2 text-sm placeholder-gray-500 outline-none focus:border-pink-400"
                  />
                </div>
                <button
                  onClick={elegirQuienEmpieza}
                  className="mt-2 w-full bg-[#2A1847] border border-white/10 rounded-xl py-2 text-sm font-semibold text-blue-300 hover:bg-[#33205A] transition"
                >
                  🎲 Elegir quién empieza
                </button>
                {quienEmpieza !== null && (
                  <p className="text-center text-xs text-gray-400 mt-1.5">
                    Empieza{" "}
                    <span className="text-pink-400 font-semibold">
                      {quienEmpieza === 0 ? nombreJ1 : nombreJ2}
                    </span>
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-yellow-300 font-bold text-sm sm:text-base mb-2">
                  2. Nivel de picante
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {NIVELES.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => elegirNivel(n.id)}
                      className={`rounded-xl py-2 text-xs sm:text-sm font-semibold transition ${
                        nivel === n.id
                          ? "bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white"
                          : "bg-[#2A1847] border border-white/10 text-gray-300"
                      }`}
                    >
                      {n.emoji} {n.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-yellow-300 font-bold text-sm sm:text-base mb-2">
                  3. Categorías
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIAS.map((cat) => {
                    const activa = categorias.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => toggleCategoria(cat.id)}
                        className={`rounded-xl py-2 px-2 text-xs sm:text-sm font-medium border transition ${
                          activa
                            ? `${cat.border} ${cat.text} bg-white/5`
                            : "border-white/10 text-gray-500"
                        }`}
                      >
                        {cat.emoji} {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-yellow-300 font-bold text-sm sm:text-base mb-2">
                  4. Duración de cada reto
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {DURACIONES.map((d) => (
                    <button
                      key={d.segundos}
                      onClick={() => elegirDuracion(d.segundos)}
                      className={`rounded-xl py-2 text-xs sm:text-sm font-semibold transition ${
                        duracion === d.segundos
                          ? "bg-fuchsia-500 text-white"
                          : "bg-[#2A1847] border border-white/10 text-gray-300"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={iniciarPartida}
                disabled={!puedeEmpezar}
                className="w-full bg-gradient-to-r from-pink-500 to-orange-400 rounded-2xl py-3 font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Empezar a jugar ▶
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-center mb-3 text-[1.2rem] font-bold text-lime-400">
              Turno de{" "}
              <span className="text-pink-500 font-bold">{jugadorActual}</span>
            </p>

            <div className="flex justify-center mt-2">
              <button
                onClick={tirarDado}
                disabled={cartaRevelada || girando}
                title="Toca para tirar el dado"
                className={`w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-lg text-3xl transition disabled:opacity-60 ${
                  girando ? "animate-spin" : ""
                }`}
              >
                🎲
              </button>
            </div>

            <div className="mt-4" style={{ perspective: "1200px" }}>
              <div
                className="relative w-full min-h-[220px] transition-transform duration-500"
                style={{
                  transformStyle: "preserve-3d",
                  transform: cartaRevelada ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                {/* Cara frontal */}
                <div
                  className="absolute inset-0 rounded-3xl flex items-center justify-center p-6"
                  style={{
                    backfaceVisibility: "hidden",
                    backgroundImage:
                      "repeating-linear-gradient(45deg, #6D28D9, #6D28D9 12px, #7C3AED 12px, #7C3AED 24px)",
                  }}
                >
                  <span className="text-5xl">🎲</span>
                </div>

                {/* Cara trasera */}
                <div
                  className="absolute inset-0 rounded-3xl flex flex-col items-center justify-center gap-3 p-6 text-center overflow-hidden"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    backgroundImage: "linear-gradient(135deg, #7C3AED, #DB2777)",
                  }}
                >
                  {categoriaActual && (
                    <span
                      className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${categoriaActual.bg} ${categoriaActual.text}`}
                    >
                      {categoriaActual.emoji} {categoriaActual.label}
                    </span>
                  )}
                  {promptActual?.imagenUrl && (
                    <img
                      src={promptActual.imagenUrl}
                      alt=""
                      className="max-h-32 rounded-xl object-cover"
                    />
                  )}
                  <p className="text-base sm:text-lg font-semibold leading-relaxed">
                    {promptActual?.texto ?? "Toca el dado para empezar..."}
                  </p>
                </div>
              </div>
            </div>
            {!cartaRevelada && (
              <p className="text-center text-xs text-gray-500 mt-1.5">
                Toca el dado para revelar el reto
              </p>
            )}

            <div className="flex flex-col items-center mt-4">
              <div className="relative w-28 h-28">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r={radio} fill="none" stroke="#3D2B61" strokeWidth="6" />
                  <circle
                    cx="50"
                    cy="50"
                    r={radio}
                    fill="none"
                    stroke="#FB923C"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circunferencia}
                    strokeDashoffset={circunferencia * (1 - progreso)}
                    style={{ transition: "stroke-dashoffset 1s linear" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
                  {tiempoRestante}
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={alternarTimer}
                  disabled={tiempoRestante === 0}
                  className="flex items-center gap-1.5 bg-[#2A1847] border border-white/10 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-40"
                >
                  <Clock size={16} /> {corriendo ? "Pausar" : "Iniciar"}
                </button>
                <button
                  onClick={reiniciarTimer}
                  className="flex items-center gap-1.5 bg-[#2A1847] border border-white/10 rounded-xl px-4 py-2 text-sm font-semibold"
                >
                  <RotateCcw size={16} /> Reiniciar
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-5 text-xs sm:text-sm text-gray-300">
              <span>Ronda {ronda}</span>
              <span className="flex items-center gap-1">
                <Trophy size={14} className="text-yellow-400" /> {nombreJ1} {scoreJ1} - {scoreJ2} {nombreJ2}
              </span>
              <span>🔥 Racha {racha}</span>
            </div>

            <p className="text-center text-[11px] text-gray-500 mt-4 italic">
              Juega con respeto, comunicación y consentimiento mutuo 🤎
            </p>
          </>
        )}
      </div>

      {/* Barra inferior propia del juego (no es el Footer global) */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1B1033]/95 backdrop-blur border-t border-white/10 px-3 py-2.5">
        <div className="max-w-md sm:max-w-lg mx-auto flex gap-2.5">
          {pantalla === "config" ? (
            <>
              <button
                onClick={onSalir}
                className="flex-1 bg-[#2A1847] border border-white/10 rounded-xl py-2 text-sm font-semibold text-gray-300"
              >
                Pasar 🙈
              </button>
              <button
                onClick={iniciarPartida}
                disabled={!puedeEmpezar}
                className="flex-1 bg-lime-400 text-[#1B1033] rounded-xl py-2 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Listo, siguiente →
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => siguienteTurno(false)}
                className="flex-1 bg-[#2A1847] border border-white/10 rounded-xl py-2 text-sm font-semibold text-gray-300"
              >
                Pasar 🙈
              </button>
              <button
                onClick={() => siguienteTurno(true)}
                className="flex-1 bg-lime-400 text-[#1B1033] rounded-xl py-2 text-sm font-bold"
              >
                Listo, siguiente →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chispa;