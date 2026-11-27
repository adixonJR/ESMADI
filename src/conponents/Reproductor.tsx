import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Mic,
  Music,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";
import {
  useMusica,
  obtenerPortada,
  formatearTiempo,
} from "../conponents/MusicaContext";

// Ajusta esta ruta a la de tu Playlist
const RUTA_PLAYLIST = "/playlist";

// ---------- Letras (LRCLIB: gratis, sin API key) ----------
interface LineaLetra {
  t: number;
  texto: string;
}

interface Letra {
  sincronizada: LineaLetra[] | null;
  plana: string | null;
}

// Se guarda lo ya buscado para no repetir la petición al volver a la canción
const cacheLetras = new Map<string, Letra | null>();

// "[01:23.45] texto" -> { t: 83.45, texto }
function parsearLRC(lrc: string): LineaLetra[] {
  const lineas: LineaLetra[] = [];
  for (const cruda of lrc.split("\n")) {
    const marcas = [...cruda.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)];
    if (marcas.length === 0) continue;
    const texto = cruda.replace(/\[[^\]]*\]/g, "").trim();
    for (const m of marcas) {
      lineas.push({ t: Number(m[1]) * 60 + Number(m[2]), texto });
    }
  }
  return lineas.sort((a, b) => a.t - b.t);
}

async function buscarLetra(
  titulo: string,
  artista: string,
  signal: AbortSignal
): Promise<Letra | null> {
  const base = "https://lrclib.net/api/search";
  const enc = encodeURIComponent;
  const intentos = [
    `${base}?track_name=${enc(titulo)}&artist_name=${enc(artista)}`,
    `${base}?q=${enc(`${titulo} ${artista}`)}`,
  ];

  for (const url of intentos) {
    const res = await fetch(url, { signal });
    if (!res.ok) continue;
    const lista = await res.json();
    if (!Array.isArray(lista) || lista.length === 0) continue;

    const elegida =
      lista.find((x: any) => x.syncedLyrics) ??
      lista.find((x: any) => x.plainLyrics);
    if (!elegida) continue;

    return {
      sincronizada: elegida.syncedLyrics ? parsearLRC(elegida.syncedLyrics) : null,
      plana: elegida.plainLyrics ?? null,
    };
  }
  return null;
}

type EstadoLetra = "idle" | "cargando" | "ok" | "nada" | "error";

function Reproductor() {
  const {
    cancionActual,
    pausado,
    aleatorio,
    setAleatorio,
    repetir,
    setRepetir,
    progreso,
    alternarPausa,
    siguiente,
    anterior,
    buscarSegundo,
    entrarPantalla,
    salirPantalla,
  } = useMusica();

  // Mientras esta pantalla está abierta la ventana flotante se esconde (sigue sonando);
  // al salir vuelve como notita. useLayoutEffect evita que se vea un parpadeo.
  useLayoutEffect(() => {
    entrarPantalla();
    return () => salirPantalla();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Letra ----------
  const [mostrarLetra, setMostrarLetra] = useState<boolean>(() => {
    try {
      return localStorage.getItem("musica_letra") === "1";
    } catch {
      return false;
    }
  });
  const [letra, setLetra] = useState<Letra | null>(null);
  const [estadoLetra, setEstadoLetra] = useState<EstadoLetra>("idle");
  const contLetraRef = useRef<HTMLDivElement>(null);
  const lineasRef = useRef<(HTMLParagraphElement | null)[]>([]);

  const alternarLetra = () => {
    const nuevo = !mostrarLetra;
    setMostrarLetra(nuevo);
    try {
      localStorage.setItem("musica_letra", nuevo ? "1" : "0");
    } catch {
      /* sin almacenamiento: no pasa nada */
    }
  };

  // Busca la letra al activarla o al cambiar de canción
  useEffect(() => {
    if (!mostrarLetra || !cancionActual) return;

    const clave = cancionActual.id;
    if (cacheLetras.has(clave)) {
      const guardada = cacheLetras.get(clave) ?? null;
      setLetra(guardada);
      setEstadoLetra(guardada ? "ok" : "nada");
      return;
    }

    const ctrl = new AbortController();
    setLetra(null);
    setEstadoLetra("cargando");

    buscarLetra(cancionActual.titulo, cancionActual.artista, ctrl.signal)
      .then((resultado) => {
        cacheLetras.set(clave, resultado);
        setLetra(resultado);
        setEstadoLetra(resultado ? "ok" : "nada");
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setEstadoLetra("error");
      });

    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarLetra, cancionActual?.id]);

  // Línea que está sonando ahora (letra sincronizada)
  const indiceActivo = useMemo(() => {
    const lineas = letra?.sincronizada;
    if (!lineas || lineas.length === 0) return -1;
    const t = progreso.t + 0.25;
    let activo = -1;
    for (let i = 0; i < lineas.length; i++) {
      if (lineas[i].t <= t) activo = i;
      else break;
    }
    return activo;
  }, [letra, progreso.t]);

  // Mantiene la línea activa centrada dentro del panel (sin mover la página)
  useEffect(() => {
    const cont = contLetraRef.current;
    const el = lineasRef.current[indiceActivo];
    if (!cont || !el) return;
    cont.scrollTo({
      top: el.offsetTop - cont.clientHeight / 2 + el.clientHeight / 2,
      behavior: "smooth",
    });
  }, [indiceActivo, mostrarLetra]);

  // ---------- Barra de progreso (se puede arrastrar) ----------
  const barraRef = useRef<HTMLDivElement>(null);
  const [arrastrando, setArrastrando] = useState<number | null>(null);

  const ratioDesde = (clientX: number) => {
    const rect = barraRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
  };

  const alBajarBarra = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (progreso.d <= 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setArrastrando(ratioDesde(e.clientX));
  };
  const alMoverBarra = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (arrastrando === null) return;
    setArrastrando(ratioDesde(e.clientX));
  };
  const alSoltarBarra = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (arrastrando === null) return;
    buscarSegundo(ratioDesde(e.clientX) * progreso.d);
    setArrastrando(null);
  };

  const ratioBarra =
    arrastrando !== null
      ? arrastrando
      : progreso.d > 0
      ? Math.min(progreso.t / progreso.d, 1)
      : 0;
  const tiempoMostrado = arrastrando !== null ? arrastrando * progreso.d : progreso.t;

  const portada = obtenerPortada(cancionActual?.youtube_id ?? null);

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#120B1F] text-white px-5 sm:px-6 pt-6 pb-32">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap');
        .fuente-elegante { font-family: 'Playfair Display', Georgia, serif; }

        @keyframes repro-in {
          from { opacity: 0; transform: translateY(10px) scale(.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .repro-in { animation: repro-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }

        .letra-panel::-webkit-scrollbar { display: none; }
        .letra-panel { scrollbar-width: none; }

        @media (prefers-reduced-motion: reduce) {
          .repro-in { animation: none !important; }
        }
      `}</style>

      {/* Fondo difuminado con la portada */}
      {portada ? (
        <img
          src={portada}
          alt=""
          className="absolute inset-0 w-full h-full object-cover scale-150 blur-3xl opacity-40 pointer-events-none"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#B388FF]/30 to-[#FF4D8D]/30 pointer-events-none" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-[#120B1F]/30 via-[#120B1F]/70 to-[#120B1F] pointer-events-none" />

      <div className="relative max-w-md mx-auto">
        <Link
          to={RUTA_PLAYLIST}
          className="inline-flex items-center gap-2 text-[#C7C7D3] hover:text-white transition mb-6 text-sm"
        >
          <ArrowLeft size={18} />
          Volver a Playlist
        </Link>

        {!cancionActual ? (
          /* ---------- Nada sonando ---------- */
          <div className="repro-in mt-16 text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-[#B388FF]/10 flex items-center justify-center mb-5">
              <Music size={34} className="text-[#B388FF]" />
            </div>
            <p className="fuente-elegante text-xl">No hay nada sonando</p>
            <p className="text-[#C7C7D3] text-sm mt-2">
              Elige una canción de la playlist para empezar.
            </p>
            <Link
              to={RUTA_PLAYLIST}
              className="inline-block mt-6 bg-[#FF4D8D] hover:bg-[#E63A79] transition rounded-full px-6 py-3 font-semibold text-white"
            >
              Ir a la playlist
            </Link>
          </div>
        ) : (
          <div className="repro-in">
            {/* ---------- Portada o letra ---------- */}
            {!mostrarLetra ? (
              <div className="w-full max-w-[19rem] aspect-square mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-black/60 border border-white/10 bg-[#1E1534]">
                {portada ? (
                  // scale recorta las barras negras que trae la miniatura de YouTube
                  <img
                    src={portada}
                    alt={`Portada de ${cancionActual.titulo}`}
                    className="w-full h-full object-cover scale-[1.4]"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#B388FF] to-[#FF4D8D] flex items-center justify-center">
                    <Music size={72} className="text-white/90" strokeWidth={1.5} />
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full max-w-[19rem] h-[19rem] mx-auto rounded-3xl bg-black/30 backdrop-blur-sm border border-white/10 overflow-hidden">
                {estadoLetra === "cargando" && (
                  <p className="h-full flex items-center justify-center text-[#C7C7D3] text-sm">
                    Buscando la letra...
                  </p>
                )}
                {estadoLetra === "nada" && (
                  <p className="h-full flex items-center justify-center text-center px-8 text-[#C7C7D3] text-sm">
                    No encontré la letra de esta canción.
                  </p>
                )}
                {estadoLetra === "error" && (
                  <p className="h-full flex items-center justify-center text-center px-8 text-red-300 text-sm">
                    No se pudo cargar la letra. Revisa tu conexión.
                  </p>
                )}

                {estadoLetra === "ok" && letra?.sincronizada && (
                  <div
                    ref={contLetraRef}
                    className="letra-panel relative h-full overflow-y-auto px-5 text-center"
                    style={{
                      maskImage:
                        "linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)",
                      WebkitMaskImage:
                        "linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)",
                    }}
                  >
                    <div className="h-28" aria-hidden />
                    {letra.sincronizada.map((linea, i) => (
                      <p
                        key={`${linea.t}-${i}`}
                        ref={(el) => {
                          lineasRef.current[i] = el;
                        }}
                        onClick={() => buscarSegundo(linea.t)}
                        className={`fuente-elegante cursor-pointer py-1.5 leading-snug transition-all duration-300 ${
                          i === indiceActivo
                            ? "text-white text-xl font-bold"
                            : "text-white/35 text-lg hover:text-white/60"
                        }`}
                      >
                        {linea.texto || "♪"}
                      </p>
                    ))}
                    <div className="h-28" aria-hidden />
                  </div>
                )}

                {estadoLetra === "ok" && !letra?.sincronizada && letra?.plana && (
                  <div className="letra-panel h-full overflow-y-auto px-6 py-6 text-center">
                    <p className="whitespace-pre-line text-white/85 text-base leading-relaxed">
                      {letra.plana}
                    </p>
                  </div>
                )}
              </div>
            )}

            {mostrarLetra && estadoLetra === "ok" && (
              <p className="text-center text-[10px] text-[#8A83A0] mt-2">
                Letra de LRCLIB
              </p>
            )}

            {/* ---------- Título, artista y botón de letra ---------- */}
            <div className="flex items-end justify-between gap-3 mt-7">
              <div className="min-w-0">
                <h1 className="fuente-elegante text-4xl font-bold tracking-tight leading-tight truncate">
                  {cancionActual.titulo}
                </h1>
                <p className="text-[#B388FF] text-xl font-medium truncate">
                  {cancionActual.artista}
                </p>
              </div>

              <button
                onClick={alternarLetra}
                aria-pressed={mostrarLetra}
                aria-label={mostrarLetra ? "Ocultar letra" : "Mostrar letra"}
                className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold border transition ${
                  mostrarLetra
                    ? "bg-[#FF4D8D] border-[#FF4D8D] text-white shadow-lg shadow-[#FF4D8D]/30"
                    : "border-[#453A67] text-[#C7C7D3] hover:border-[#B388FF] hover:text-white"
                }`}
              >
                <Mic size={16} />
                Letra
              </button>
            </div>

            {cancionActual.motivo && (
              <p className="flex items-center gap-2 text-[#C7C7D3] text-sm mt-2">
                <Heart size={14} className="text-[#FF7EB6] shrink-0" fill="#FF7EB6" />
                <span className="truncate">{cancionActual.motivo}</span>
              </p>
            )}

            {/* ---------- Progreso ---------- */}
            <div className="mt-7">
              <div
                ref={barraRef}
                onPointerDown={alBajarBarra}
                onPointerMove={alMoverBarra}
                onPointerUp={alSoltarBarra}
                onPointerCancel={() => setArrastrando(null)}
                className="relative h-6 flex items-center cursor-pointer select-none"
                style={{ touchAction: "none" }}
                role="slider"
                aria-label="Progreso de la canción"
                aria-valuemin={0}
                aria-valuemax={Math.round(progreso.d)}
                aria-valuenow={Math.round(tiempoMostrado)}
              >
                <div className="w-full h-1.5 rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-[#FF4D8D]"
                    style={{ width: `${ratioBarra * 100}%` }}
                  />
                </div>
                <div
                  className="absolute w-4 h-4 rounded-full bg-[#FF4D8D] shadow-md shadow-black/50 -translate-x-1/2"
                  style={{ left: `${ratioBarra * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-[#C7C7D3] tabular-nums mt-1">
                <span>{formatearTiempo(tiempoMostrado)}</span>
                <span>{formatearTiempo(progreso.d)}</span>
              </div>
            </div>

            {/* ---------- Controles ---------- */}
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setAleatorio(!aleatorio)}
                className={`p-2 transition ${
                  aleatorio ? "text-[#FF7EB6]" : "text-[#8A83A0] hover:text-white"
                }`}
                aria-label="Modo aleatorio"
                aria-pressed={aleatorio}
              >
                <Shuffle size={24} />
              </button>

              <button
                onClick={anterior}
                className="p-2 text-white hover:text-[#FF7EB6] active:scale-90 transition"
                aria-label="Anterior"
              >
                <SkipBack size={30} fill="currentColor" />
              </button>

              <button
                onClick={alternarPausa}
                className="w-[4.5rem] h-[4.5rem] rounded-full bg-[#FF4D8D] hover:bg-[#E63A79] hover:scale-105 active:scale-95 transition flex items-center justify-center shadow-xl shadow-[#FF4D8D]/40"
                aria-label={pausado ? "Reproducir" : "Pausar"}
              >
                {pausado ? (
                  <Play size={32} fill="white" className="ml-1" />
                ) : (
                  <Pause size={32} fill="white" />
                )}
              </button>

              <button
                onClick={siguiente}
                className="p-2 text-white hover:text-[#FF7EB6] active:scale-90 transition"
                aria-label="Siguiente"
              >
                <SkipForward size={30} fill="currentColor" />
              </button>

              <button
                onClick={() => setRepetir(!repetir)}
                className={`p-2 transition ${
                  repetir ? "text-[#FF7EB6]" : "text-[#8A83A0] hover:text-white"
                }`}
                aria-label={repetir ? "Repetir esta canción: activado" : "Repetir esta canción"}
                aria-pressed={repetir}
              >
                {repetir ? <Repeat1 size={24} /> : <Repeat size={24} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default Reproductor;