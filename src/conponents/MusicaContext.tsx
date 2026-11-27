import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  X,
  ChevronDown,
  ChevronUp,
  GripHorizontal,
  Music,
  Minus,
} from "lucide-react";
import supabase from "../lib/supabase.js";
import { aplicarAIframe, useSilenciado } from "../lib/Sonido.js";

// ---------- Tipos y utilidades (se reutilizan en Playlist.tsx y Reproductor.tsx) ----------
export interface Cancion {
  id: string;
  titulo: string;
  artista: string;
  motivo: string;
  youtube_id: string | null;
  orden: number;
}

export const YT_ORIGIN = "https://www.youtube.com";

// Ancho (y casi alto) de la ventana flotante: forma de cuadrado
const ANCHO_REPRODUCTOR = 240;

// Tamaño de la ventana cuando se achica a una notita musical
const TAM_NOTA = 52;

// Extrae el ID de un video a partir de distintos formatos de URL de YouTube
export function extraerYoutubeId(url: string): string | null {
  if (!url.trim()) return null;
  const patrones = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  ];
  for (const patron of patrones) {
    const match = url.match(patron);
    if (match) return match[1];
  }
  return null;
}

// Portada (thumbnail) automática a partir del video de YouTube
export function obtenerPortada(youtubeId: string | null): string | null {
  if (!youtubeId) return null;
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

// 75 -> "1:15"
export function formatearTiempo(segundos: number): string {
  if (!segundos || segundos < 0 || !isFinite(segundos)) return "0:00";
  const m = Math.floor(segundos / 60);
  const s = Math.floor(segundos % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ---------- Contexto ----------
interface NuevaCancion {
  titulo: string;
  artista: string;
  motivo: string;
  youtubeUrl: string;
}

interface MusicaCtx {
  canciones: Cancion[];
  cargando: boolean;
  error: string | null;
  cargarCanciones: () => Promise<void>;
  agregarCancion: (datos: NuevaCancion) => Promise<boolean>;
  eliminarCancion: (id: string) => Promise<void>;

  reproduciendoId: string | null;
  cancionActual: Cancion | null;
  reproducibles: Cancion[];
  pausado: boolean;
  aleatorio: boolean;
  setAleatorio: (v: boolean) => void;
  repetir: boolean;
  setRepetir: (v: boolean) => void;
  progreso: { t: number; d: number };

  alternarFila: (c: Cancion) => void;
  botonPrincipal: () => void;
  alternarPausa: () => void;
  siguiente: () => void;
  anterior: () => void;
  buscarSegundo: (segundos: number) => void;
  detener: () => void;

  // La pantalla de reproducción avisa cuando se abre / se cierra:
  // mientras está abierta la ventana flotante se esconde, y al salir queda como notita.
  entrarPantalla: () => void;
  salirPantalla: () => void;
}

const Ctx = createContext<MusicaCtx | null>(null);

export function useMusica() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMusica debe usarse dentro de <MusicaProvider>");
  return ctx;
}

export function MusicaProvider({ children }: { children: ReactNode }) {
  const [canciones, setCanciones] = useState<Cancion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reproduciendoId, setReproduciendoId] = useState<string | null>(null);
  const [pausado, setPausado] = useState(false);
  const [aleatorio, setAleatorio] = useState(false);
  const [repetir, setRepetir] = useState(false);
  const [compacto, setCompacto] = useState(false);
  const [enPantalla, setEnPantalla] = useState(false);
  const [progreso, setProgreso] = useState({ t: 0, d: 0 });

  // Posición de la ventana flotante (se recuerda entre visitas)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(() => {
    try {
      const guardada = localStorage.getItem("musica_pos");
      return guardada ? JSON.parse(guardada) : null;
    } catch {
      return null;
    }
  });
  const cajaRef = useRef<HTMLDivElement>(null);
  const arrastre = useRef<{ dx: number; dy: number } | null>(null);

  // Notita: la ventana achicada al mínimo (se recuerda entre visitas)
  const [minimizado, setMinimizado] = useState<boolean>(() => {
    try {
      return localStorage.getItem("musica_min") === "1";
    } catch {
      return false;
    }
  });
  const pinch = useRef<number | null>(null);
  const inicioToque = useRef<{ x: number; y: number } | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const irARef = useRef<(dir: 1 | -1) => void>(() => {});
  const salirRef = useRef<() => void>(() => {});
  const repetirRef = useRef(false);
  const cargadoRef = useRef(false);
  repetirRef.current = repetir;

  const silenciado = useSilenciado();

  const cancionActual = canciones.find((c) => c.id === reproduciendoId) || null;
  const reproducibles = canciones.filter((c) => c.youtube_id);

  // La URL se calcula una sola vez por canción, así al silenciar no se recarga el video
  const urlIframe = useMemo(
    () =>
      cancionActual?.youtube_id
        ? `${YT_ORIGIN}/embed/${cancionActual.youtube_id}?autoplay=1&enablejsapi=1&playsinline=1&rel=0&mute=${
            silenciado ? 1 : 0
          }`
        : "",
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cancionActual?.youtube_id]
  );

  // ---------- Datos (Supabase) ----------
  const cargarCanciones = useCallback(async () => {
    if (!cargadoRef.current) setCargando(true);
    setError(null);
    const { data, error } = await supabase
      .from("canciones")
      .select("*")
      .order("orden", { ascending: true });

    if (error) {
      setError("No se pudieron cargar las canciones.");
      console.error(error);
    } else {
      setCanciones(data as Cancion[]);
      cargadoRef.current = true;
    }
    setCargando(false);
  }, []);

  const agregarCancion = async (datos: NuevaCancion): Promise<boolean> => {
    const nuevoOrden =
      canciones.length > 0
        ? Math.max(...canciones.map((c) => c.orden)) + 1
        : 1;

    const { data, error } = await supabase
      .from("canciones")
      .insert({
        titulo: datos.titulo.trim(),
        artista: datos.artista.trim(),
        motivo: datos.motivo.trim(),
        youtube_id: extraerYoutubeId(datos.youtubeUrl),
        orden: nuevoOrden,
      })
      .select()
      .single();

    if (error) {
      setError("No se pudo guardar la canción.");
      console.error(error);
      return false;
    }
    setCanciones((prev) => [...prev, data as Cancion]);
    return true;
  };

  const eliminarCancion = async (id: string) => {
    if (!window.confirm("¿Eliminar esta canción de la playlist?")) return;

    const anteriores = canciones;
    setCanciones((prev) => prev.filter((c) => c.id !== id)); // optimista
    if (reproduciendoId === id) setReproduciendoId(null);

    const { error } = await supabase.from("canciones").delete().eq("id", id);
    if (error) {
      setError("No se pudo eliminar la canción.");
      console.error(error);
      setCanciones(anteriores);
    }
  };

  // ---------- Control del reproductor (postMessage a YouTube) ----------
  const enviarComando = (func: string, args: unknown[] = []) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args }),
      YT_ORIGIN
    );
  };

  const alCargarIframe = () => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(
      JSON.stringify({ event: "listening", id: 1, channel: "widget" }),
      YT_ORIGIN
    );
    enviarComando("addEventListener", ["onStateChange"]);

    // Respeta el silencio global (se repite porque el reproductor tarda en estar listo)
    aplicarAIframe(iframeRef.current);
    setTimeout(() => aplicarAIframe(iframeRef.current), 600);
    setTimeout(() => aplicarAIframe(iframeRef.current), 1800);
  };

  const reproducir = (id: string) => {
    setReproduciendoId(id);
    setPausado(false);
  };

  const detener = () => {
    setReproduciendoId(null);
    setPausado(false);
  };

  const alternarPausa = () => {
    if (!cancionActual) return;
    enviarComando(pausado ? "playVideo" : "pauseVideo");
    setPausado(!pausado);
  };

  const irA = (dir: 1 | -1) => {
    if (reproducibles.length === 0) return;

    // "Anterior" con más de 3s reproducidos reinicia la canción
    if (dir === -1 && progreso.t > 3) {
      enviarComando("seekTo", [0, true]);
      return;
    }

    const idx = reproducibles.findIndex((c) => c.id === reproduciendoId);
    let sig = reproducibles[0];

    if (aleatorio && reproducibles.length > 1) {
      do {
        sig = reproducibles[Math.floor(Math.random() * reproducibles.length)];
      } while (sig.id === reproduciendoId);
    } else {
      const base = idx === -1 ? 0 : idx + dir;
      sig = reproducibles[(base + reproducibles.length) % reproducibles.length];
    }

    if (sig.id === reproduciendoId) {
      enviarComando("seekTo", [0, true]);
      enviarComando("playVideo");
      setPausado(false);
      return;
    }
    reproducir(sig.id);
  };
  irARef.current = irA;

  const alternarFila = (c: Cancion) => {
    if (!c.youtube_id) return;
    if (reproduciendoId === c.id) alternarPausa();
    else reproducir(c.id);
  };

  const botonPrincipal = () => {
    if (cancionActual) {
      alternarPausa();
      return;
    }
    if (reproducibles.length === 0) return;
    const primera = aleatorio
      ? reproducibles[Math.floor(Math.random() * reproducibles.length)]
      : reproducibles[0];
    reproducir(primera.id);
  };

  // Salta a un segundo concreto (barra de progreso de la pantalla y líneas de la letra)
  const buscarSegundo = (segundos: number) => {
    if (progreso.d <= 0) return;
    const t = Math.min(Math.max(segundos, 0), progreso.d);
    enviarComando("seekTo", [t, true]);
    setProgreso((p) => ({ ...p, t }));
  };

  const buscarEnBarra = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progreso.d <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    buscarSegundo(ratio * progreso.d);
  };

  // Reinicia la barra de progreso al cambiar de canción
  useEffect(() => {
    setProgreso({ t: 0, d: 0 });
  }, [reproduciendoId]);

  // Escucha los eventos del reproductor de YouTube (estado y progreso)
  useEffect(() => {
    const alMensaje = (e: MessageEvent) => {
      if (e.origin !== YT_ORIGIN) return;
      if (e.source !== iframeRef.current?.contentWindow) return;

      let data: any = e.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      if (!data) return;

      let estado: number | undefined;
      if (data.event === "onStateChange" && typeof data.info === "number") {
        estado = data.info;
      } else if (data.event === "infoDelivery" && data.info) {
        if (typeof data.info.playerState === "number") {
          estado = data.info.playerState;
        }
        const { currentTime, duration } = data.info;
        if (typeof currentTime === "number" || typeof duration === "number") {
          setProgreso((p) => ({
            t: typeof currentTime === "number" ? currentTime : p.t,
            d: typeof duration === "number" ? duration : p.d,
          }));
        }
      }

      if (estado === 0) {
        // terminó -> repetir la misma o pasar a la siguiente
        if (repetirRef.current) {
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func: "seekTo", args: [0, true] }),
            YT_ORIGIN
          );
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func: "playVideo", args: [] }),
            YT_ORIGIN
          );
        } else {
          irARef.current(1);
        }
      } else if (estado === 1) setPausado(false);
      else if (estado === 2) setPausado(true);
    };

    window.addEventListener("message", alMensaje);
    return () => window.removeEventListener("message", alMensaje);
  }, []);

  const porcentaje = progreso.d > 0 ? (progreso.t / progreso.d) * 100 : 0;

  // ---------- Arrastrar y achicar la ventana ----------
  const limitar = (
    x: number,
    y: number,
    w: number = cajaRef.current?.offsetWidth ?? ANCHO_REPRODUCTOR,
    h: number = cajaRef.current?.offsetHeight ?? ANCHO_REPRODUCTOR
  ) => ({
    x: Math.min(Math.max(8, x), Math.max(8, window.innerWidth - w - 8)),
    y: Math.min(Math.max(8, y), Math.max(8, window.innerHeight - h - 8)),
  });

  // Si nunca la moviste, aparece abajo a la derecha
  const anchoActual = minimizado ? TAM_NOTA : ANCHO_REPRODUCTOR;
  const posActual =
    pos ??
    limitar(
      window.innerWidth - anchoActual - 12,
      window.innerHeight - (minimizado ? TAM_NOTA : ANCHO_REPRODUCTOR) - 110,
      anchoActual,
      minimizado ? TAM_NOTA : ANCHO_REPRODUCTOR
    );

  // Achicar a la notita (la esquina superior derecha se queda en su sitio)
  const minimizar = () => {
    setMinimizado(true);
    setPos(
      limitar(
        posActual.x + (ANCHO_REPRODUCTOR - TAM_NOTA),
        posActual.y,
        TAM_NOTA,
        TAM_NOTA
      )
    );
  };

  // Volver al tamaño normal
  const expandir = () => {
    setMinimizado(false);
    setPos(
      limitar(
        posActual.x - (ANCHO_REPRODUCTOR - TAM_NOTA),
        posActual.y,
        ANCHO_REPRODUCTOR,
        290
      )
    );
  };

  // ---------- Pantalla de reproducción ----------
  // Al salir de la pantalla, la ventana vuelve como notita (si hay música sonando).
  // Se usa una ref para que el cierre de la pantalla siempre llame a la versión más reciente.
  salirRef.current = () => {
    setEnPantalla(false);
    if (cancionActual && !minimizado) minimizar();
  };
  const entrarPantalla = useCallback(() => setEnPantalla(true), []);
  const salirPantalla = useCallback(() => salirRef.current(), []);

  // Guarda posición y estado (no mientras se arrastra)
  useEffect(() => {
    if (arrastre.current) return;
    try {
      localStorage.setItem("musica_min", minimizado ? "1" : "0");
      if (pos) localStorage.setItem("musica_pos", JSON.stringify(pos));
    } catch {
      /* sin almacenamiento: no pasa nada */
    }
  }, [pos, minimizado]);

  // Mantiene la ventana dentro de la pantalla al girar o redimensionar
  useEffect(() => {
    const alRedimensionar = () =>
      setPos((prev) => (prev ? limitar(prev.x, prev.y) : prev));
    window.addEventListener("resize", alRedimensionar);
    return () => window.removeEventListener("resize", alRedimensionar);
  }, []);

  // Al minimizar/expandir los controles, la ventana cambia de alto
  useEffect(() => {
    setPos((prev) => (prev ? limitar(prev.x, prev.y) : prev));
  }, [compacto]);

  const iniciarArrastre = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    arrastre.current = {
      dx: e.clientX - posActual.x,
      dy: e.clientY - posActual.y,
    };
    inicioToque.current = { x: e.clientX, y: e.clientY };
  };

  const moverArrastre = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!arrastre.current) return;
    setPos(limitar(e.clientX - arrastre.current.dx, e.clientY - arrastre.current.dy));
  };

  const terminarArrastre = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!arrastre.current) return;
    arrastre.current = null;

    // Un toque corto sobre la notita la vuelve a abrir
    const ini = inicioToque.current;
    inicioToque.current = null;
    const fueToque = ini && Math.hypot(e.clientX - ini.x, e.clientY - ini.y) < 6;
    if (minimizado && fueToque && e.type === "pointerup") {
      expandir();
      return;
    }

    try {
      localStorage.setItem("musica_pos", JSON.stringify(pos ?? posActual));
    } catch {
      /* sin almacenamiento: no pasa nada */
    }
  };

  // ---------- Pellizco con 2 dedos ----------
  const distancia = (t: React.TouchList) =>
    Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

  const alTocar = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      arrastre.current = null; // con 2 dedos no se arrastra
      pinch.current = distancia(e.touches);
    }
  };

  const alMoverDedos = (e: React.TouchEvent) => {
    if (e.touches.length !== 2 || pinch.current === null) return;
    const razon = distancia(e.touches) / pinch.current;
    if (!minimizado && razon < 0.7) {
      minimizar();
      pinch.current = null;
    } else if (minimizado && razon > 1.4) {
      expandir();
      pinch.current = null;
    }
  };

  const alSoltarDedos = (e: React.TouchEvent) => {
    if (e.touches.length < 2) pinch.current = null;
  };

  return (
    <Ctx.Provider
      value={{
        canciones,
        cargando,
        error,
        cargarCanciones,
        agregarCancion,
        eliminarCancion,
        reproduciendoId,
        cancionActual,
        reproducibles,
        pausado,
        aleatorio,
        setAleatorio,
        repetir,
        setRepetir,
        progreso,
        alternarFila,
        botonPrincipal,
        alternarPausa,
        siguiente: () => irA(1),
        anterior: () => irA(-1),
        buscarSegundo,
        detener,
        entrarPantalla,
        salirPantalla,
      }}
    >
      {children}

      {/* ---------- VENTANA FLOTANTE (cuadrada, movible, se achica a una notita) ----------
          En la pantalla de reproducción se manda fuera de la vista (sin desmontar el iframe,
          así la música no se corta) y al salir aparece como notita. */}
      {cancionActual && cancionActual.youtube_id && (
        <div
          ref={cajaRef}
          aria-hidden={enPantalla}
          className={`player-flotante fixed z-50 overflow-hidden text-white shadow-2xl ${
            minimizado
              ? "rounded-full bg-gradient-to-br from-[#B388FF] to-[#FF4D8D] shadow-[#FF4D8D]/40"
              : "rounded-2xl bg-[#1E1534]/95 backdrop-blur-xl border border-[#453A67] shadow-black/60"
          }`}
          style={{
            left: enPantalla ? -10000 : posActual.x,
            top: posActual.y,
            width: minimizado ? TAM_NOTA : ANCHO_REPRODUCTOR,
            height: minimizado ? TAM_NOTA : undefined,
            touchAction: "none",
            pointerEvents: enPantalla ? "none" : undefined,
            transition: "width 250ms ease, height 250ms ease, border-radius 250ms ease",
          }}
          onTouchStart={alTocar}
          onTouchMove={alMoverDedos}
          onTouchEnd={alSoltarDedos}
          onTouchCancel={alSoltarDedos}
        >
          <style>{`
            @keyframes player-in {
              from { opacity: 0; transform: scale(.92); }
              to { opacity: 1; transform: scale(1); }
            }
            .player-flotante { animation: player-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
            @keyframes nota-rebota {
              0%, 100% { transform: translateY(0) rotate(-6deg); }
              50% { transform: translateY(-3px) rotate(6deg); }
            }
            .nota-rebota { animation: nota-rebota 1s ease-in-out infinite; }
            @media (prefers-reduced-motion: reduce) {
              .player-flotante, .nota-rebota { animation: none !important; }
            }
          `}</style>

          {/* Barra para arrastrar */}
          {!minimizado && (
            <div
              onPointerDown={iniciarArrastre}
              onPointerMove={moverArrastre}
              onPointerUp={terminarArrastre}
              onPointerCancel={terminarArrastre}
              className="relative flex items-center justify-between px-2 py-1.5 cursor-grab active:cursor-grabbing select-none"
              style={{ touchAction: "none" }}
              title="Arrastra para mover"
            >
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => setCompacto(!compacto)}
                className="text-[#8A83A0] hover:text-white transition p-0.5"
                aria-label={compacto ? "Expandir controles" : "Ocultar controles"}
              >
                {compacto ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              <GripHorizontal size={18} className="text-[#8A83A0] pointer-events-none" />

              <div className="flex items-center gap-0.5">
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={minimizar}
                  className="text-[#8A83A0] hover:text-white transition p-0.5"
                  aria-label="Achicar a notita"
                  title="Achicar a notita"
                >
                  <Minus size={18} />
                </button>
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={detener}
                  className="text-[#8A83A0] hover:text-white transition p-0.5"
                  aria-label="Cerrar reproductor"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Video: el iframe vive aquí y nunca se desmonta (la música sigue sonando
              aunque la ventana sea solo una notita o cambies de página) */}
          <div
            className={
              minimizado
                ? "absolute top-0 left-0 opacity-0 pointer-events-none"
                : "aspect-video bg-black"
            }
            style={
              minimizado
                ? { width: ANCHO_REPRODUCTOR, height: (ANCHO_REPRODUCTOR * 9) / 16 }
                : undefined
            }
          >
            <iframe
              ref={iframeRef}
              key={cancionActual.id}
              className="w-full h-full"
              src={urlIframe}
              title={cancionActual.titulo}
              onLoad={alCargarIframe}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Título y artista */}
          {!minimizado && (
            <div className="px-3 pt-2 pb-1">
              <p className="text-white font-semibold text-sm truncate">
                {cancionActual.titulo}
              </p>
              <p className="text-[#B388FF] text-xs truncate">{cancionActual.artista}</p>
            </div>
          )}

          {!minimizado && !compacto && (
            <div className="px-3 pb-3">
              {/* Controles */}
              <div className="flex items-center justify-between mt-1.5">
                <button
                  onClick={() => setAleatorio(!aleatorio)}
                  className={`transition ${
                    aleatorio ? "text-[#FF7EB6]" : "text-[#8A83A0] hover:text-white"
                  }`}
                  aria-label="Modo aleatorio"
                >
                  <Shuffle size={16} />
                </button>
                <button
                  onClick={() => irA(-1)}
                  className="text-white hover:text-[#FF7EB6] transition"
                  aria-label="Anterior"
                >
                  <SkipBack size={20} fill="currentColor" />
                </button>
                <button
                  onClick={alternarPausa}
                  className="w-10 h-10 rounded-full bg-white text-[#120B1F] hover:scale-105 active:scale-95 transition flex items-center justify-center"
                  aria-label={pausado ? "Reproducir" : "Pausar"}
                >
                  {pausado ? (
                    <Play size={18} fill="currentColor" className="ml-0.5" />
                  ) : (
                    <Pause size={18} fill="currentColor" />
                  )}
                </button>
                <button
                  onClick={() => irA(1)}
                  className="text-white hover:text-[#FF7EB6] transition"
                  aria-label="Siguiente"
                >
                  <SkipForward size={20} fill="currentColor" />
                </button>
                <span className="w-4" />
              </div>

              {/* Barra de progreso */}
              <div className="flex items-center gap-1.5 mt-2 text-[10px] text-[#8A83A0] tabular-nums">
                <span className="w-8 text-right">{formatearTiempo(progreso.t)}</span>
                <div
                  onClick={buscarEnBarra}
                  className="relative flex-1 h-4 flex items-center cursor-pointer"
                >
                  <div className="w-full h-1 rounded-full bg-white/15 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#B388FF] to-[#FF4D8D] rounded-full"
                      style={{ width: `${porcentaje}%` }}
                    />
                  </div>
                </div>
                <span className="w-8">{formatearTiempo(progreso.d)}</span>
              </div>
            </div>
          )}

          {/* La notita: se mueve arrastrándola y un toque la abre */}
          {minimizado && (
            <div
              onPointerDown={iniciarArrastre}
              onPointerMove={moverArrastre}
              onPointerUp={terminarArrastre}
              onPointerCancel={terminarArrastre}
              className="absolute inset-0 flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
              style={{ touchAction: "none" }}
              role="button"
              aria-label="Abrir reproductor"
              title={`${cancionActual.titulo} · toca para abrir`}
            >
              <Music
                size={24}
                className={`text-white drop-shadow ${
                  pausado ? "opacity-70" : "nota-rebota"
                }`}
              />
            </div>
          )}
        </div>
      )}
    </Ctx.Provider>
  );
}