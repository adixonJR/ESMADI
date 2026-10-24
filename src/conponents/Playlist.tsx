import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Music,
  ArrowLeft,
  Play,
  Pause,
  Trash2,
  Plus,
  Heart,
  Link2,
  X,
  ListMusic,
  Shuffle,
  SkipBack,
  SkipForward,
} from "lucide-react";
import supabase from "../lib/supabase.js";

interface Cancion {
  id: string;
  titulo: string;
  artista: string;
  motivo: string;
  youtube_id: string | null;
  orden: number;
}

const YT_ORIGIN = "https://www.youtube.com";

// Extrae el ID de un video a partir de distintos formatos de URL de YouTube
function extraerYoutubeId(url: string): string | null {
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
function obtenerPortada(youtubeId: string | null): string | null {
  if (!youtubeId) return null;
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

// 75 -> "1:15"
function formatearTiempo(segundos: number): string {
  if (!segundos || segundos < 0 || !isFinite(segundos)) return "0:00";
  const m = Math.floor(segundos / 60);
  const s = Math.floor(segundos % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Hook simple para saber si estamos en viewport mobile (< breakpoint sm de Tailwind, 640px)
function useEsMobile(breakpointPx = 640): boolean {
  const [esMobile, setEsMobile] = useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth < breakpointPx : false
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);
    const actualizar = (e: MediaQueryListEvent | MediaQueryList) =>
      setEsMobile(e.matches);

    actualizar(mediaQuery);
    mediaQuery.addEventListener("change", actualizar);
    return () => mediaQuery.removeEventListener("change", actualizar);
  }, [breakpointPx]);

  return esMobile;
}

function Playlist() {
  const [canciones, setCanciones] = useState<Cancion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [artista, setArtista] = useState("");
  const [motivo, setMotivo] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [reproduciendoId, setReproduciendoId] = useState<string | null>(null);
  const [pausado, setPausado] = useState(false);
  const [aleatorio, setAleatorio] = useState(false);
  const [progreso, setProgreso] = useState({ t: 0, d: 0 });

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const irARef = useRef<(dir: 1 | -1) => void>(() => {});

  const esMobile = useEsMobile();

  const cancionActual = canciones.find((c) => c.id === reproduciendoId) || null;
  const reproducibles = canciones.filter((c) => c.youtube_id);

  // Cargar canciones desde Supabase al montar el componente
  useEffect(() => {
    cargarCanciones();
  }, []);

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

      if (estado === 0) irARef.current(1); // terminó -> siguiente
      else if (estado === 1) setPausado(false);
      else if (estado === 2) setPausado(true);
    };

    window.addEventListener("message", alMensaje);
    return () => window.removeEventListener("message", alMensaje);
  }, []);

  const cargarCanciones = async () => {
    setCargando(true);
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
    }
    setCargando(false);
  };

  const agregarCancion = async () => {
    if (!titulo.trim() || !artista.trim() || guardando) return;
    setGuardando(true);

    const nuevoOrden =
      canciones.length > 0
        ? Math.max(...canciones.map((c) => c.orden)) + 1
        : 1;

    const { data, error } = await supabase
      .from("canciones")
      .insert({
        titulo: titulo.trim(),
        artista: artista.trim(),
        motivo: motivo.trim(),
        youtube_id: extraerYoutubeId(youtubeUrl),
        orden: nuevoOrden,
      })
      .select()
      .single();

    if (error) {
      setError("No se pudo guardar la canción.");
      console.error(error);
    } else {
      setCanciones((prev) => [...prev, data as Cancion]);
      setTitulo("");
      setArtista("");
      setMotivo("");
      setYoutubeUrl("");
      setMostrarForm(false);
    }
    setGuardando(false);
  };

  const eliminarCancion = async (id: string) => {
    if (!window.confirm("¿Eliminar esta canción de la playlist?")) return;

    const anteriores = canciones;
    // Actualización optimista
    setCanciones((prev) => prev.filter((c) => c.id !== id));
    if (reproduciendoId === id) setReproduciendoId(null);

    const { error } = await supabase.from("canciones").delete().eq("id", id);
    if (error) {
      setError("No se pudo eliminar la canción.");
      console.error(error);
      setCanciones(anteriores); // revertir si falla
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
  };

  const reproducir = (id: string) => {
    setReproduciendoId(id);
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

  const buscarEnBarra = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progreso.d <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    enviarComando("seekTo", [ratio * progreso.d, true]);
    setProgreso((p) => ({ ...p, t: ratio * p.d }));
  };

  // Miniaturas para armar la portada tipo mosaico de la playlist
  const portadasDisponibles = canciones
    .map((c) => obtenerPortada(c.youtube_id))
    .filter((p): p is string => Boolean(p));

  const sonandoAhora = Boolean(cancionActual) && !pausado;
  const porcentaje = progreso.d > 0 ? (progreso.t / progreso.d) * 100 : 0;
  const idPreview = extraerYoutubeId(youtubeUrl);

  const iframeReproductor = (clase: string) =>
    cancionActual && cancionActual.youtube_id ? (
      <iframe
        ref={iframeRef}
        key={cancionActual.id}
        className={clase}
        src={`${YT_ORIGIN}/embed/${cancionActual.youtube_id}?autoplay=1&enablejsapi=1&playsinline=1&rel=0`}
        title={cancionActual.titulo}
        onLoad={alCargarIframe}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    ) : null;

  return (
    <section
      className={`px-4 sm:px-6 pt-6 bg-[#120B1F] min-h-screen text-white ${
        cancionActual ? "pb-96 sm:pb-64" : "pb-32"
      }`}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap');
        .fuente-elegante { font-family: 'Playfair Display', Georgia, serif; }

        @keyframes eq-bar {
          0%, 100% { height: 3px; }
          50% { height: 14px; }
        }
        .eq { display: flex; gap: 2px; align-items: flex-end; height: 14px; }
        .eq i {
          display: block; width: 3px; height: 3px; border-radius: 2px;
          background: #FF7EB6; animation: eq-bar 0.9s ease-in-out infinite;
        }
        .eq i:nth-child(2) { animation-delay: 0.25s; }
        .eq i:nth-child(3) { animation-delay: 0.5s; }
        .eq.pausa i { animation-play-state: paused; height: 4px; }

        @keyframes fila-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fila-cancion { animation: fila-in 0.35s ease both; }

        @keyframes player-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .player-flotante { animation: player-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both; }

        @keyframes giro-lento {
          to { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .eq i, .fila-cancion, .player-flotante { animation: none !important; }
        }
      `}</style>

      <div className="max-w-3xl mx-auto">
        {/* Volver */}
        <Link
          to="/nosotros"
          className="inline-flex items-center gap-2 text-[#C7C7D3] hover:text-white transition mb-4 text-sm"
        >
          <ArrowLeft size={18} />
          Volver a Nosotros
        </Link>

        {/* ---------- HERO ---------- */}
        <div className="relative overflow-hidden rounded-3xl mb-6 border border-[#453A67]/60">
          {/* Fondo difuminado con la portada */}
          {portadasDisponibles[0] ? (
            <img
              src={portadasDisponibles[0]}
              alt=""
              className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl opacity-50"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#B388FF]/40 to-[#FF4D8D]/40" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[#120B1F]/10 via-[#120B1F]/50 to-[#120B1F]" />

          <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-6 p-5 sm:p-8 pt-8">
            {/* Portada mosaico */}
            <div className="w-44 h-44 sm:w-52 sm:h-52 shrink-0 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-white/10">
              {portadasDisponibles.length === 0 ? (
                <div className="w-full h-full bg-gradient-to-br from-[#B388FF] to-[#FF4D8D] flex items-center justify-center">
                  <Music size={64} className="text-white/90" strokeWidth={1.5} />
                </div>
              ) : portadasDisponibles.length === 1 ? (
                <img
                  src={portadasDisponibles[0]}
                  alt="Portada de la playlist"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full grid grid-cols-2 grid-rows-2">
                  {Array.from({ length: 4 }).map((_, i) => {
                    const img = portadasDisponibles[i % portadasDisponibles.length];
                    return (
                      <img
                        key={i}
                        src={img}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="text-center sm:text-left min-w-0">
              <p className="text-white/80 text-[11px] sm:text-xs font-semibold tracking-[0.2em] uppercase flex items-center justify-center sm:justify-start gap-2">
                <ListMusic size={14} />
                Playlist
              </p>
              <h1 className="fuente-elegante text-4xl sm:text-6xl font-bold tracking-tight mt-2 leading-tight">
                Nuestra Playlist
              </h1>
              <p className="text-[#C7C7D3] text-sm mt-3">
                Las canciones que cuentan nuestra historia
              </p>
              <p className="text-white/70 text-xs sm:text-sm mt-2 flex items-center justify-center sm:justify-start gap-1.5">
                <Heart size={13} className="text-[#FF7EB6]" fill="#FF7EB6" />
                {canciones.length}{" "}
                {canciones.length === 1 ? "canción" : "canciones"}
              </p>
            </div>
          </div>
        </div>

        {/* ---------- BARRA DE ACCIONES ---------- */}
        <div className="flex items-center gap-4 mb-6 px-1">
          <button
            onClick={botonPrincipal}
            disabled={reproducibles.length === 0}
            className="w-14 h-14 rounded-full bg-[#FF4D8D] hover:bg-[#E63A79] hover:scale-105 active:scale-95 transition flex items-center justify-center shadow-lg shadow-[#FF4D8D]/30 disabled:opacity-40 disabled:hover:scale-100"
            aria-label={sonandoAhora ? "Pausar" : "Reproducir"}
          >
            {sonandoAhora ? (
              <Pause size={26} fill="white" />
            ) : (
              <Play size={26} fill="white" className="ml-0.5" />
            )}
          </button>

          <button
            onClick={() => setAleatorio(!aleatorio)}
            className={`transition p-2 ${
              aleatorio ? "text-[#FF7EB6]" : "text-[#8A83A0] hover:text-white"
            }`}
            aria-label="Modo aleatorio"
            title="Modo aleatorio"
          >
            <Shuffle size={24} />
          </button>

          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            className="ml-auto flex items-center gap-2 text-sm font-semibold border border-[#453A67] hover:border-[#B388FF] hover:text-white text-[#C7C7D3] rounded-full px-4 py-2 transition"
          >
            {mostrarForm ? <X size={16} /> : <Plus size={16} />}
            {mostrarForm ? "Cerrar" : "Agregar canción"}
          </button>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* ---------- FORMULARIO ---------- */}
        {mostrarForm && (
          <div className="bg-[#2B2145] rounded-3xl p-5 sm:p-7 border border-[#453A67] space-y-4 mb-6 fila-cancion">
            <h2 className="fuente-elegante text-xl font-bold">Nueva canción</h2>

            <input
              type="text"
              placeholder="Título de la canción"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full bg-[#1E1534] border border-[#453A67] rounded-xl px-4 py-3 text-white placeholder-[#8A83A0] outline-none focus:border-[#B388FF] transition"
            />
            <input
              type="text"
              placeholder="Artista"
              value={artista}
              onChange={(e) => setArtista(e.target.value)}
              className="w-full bg-[#1E1534] border border-[#453A67] rounded-xl px-4 py-3 text-white placeholder-[#8A83A0] outline-none focus:border-[#B388FF] transition"
            />
            <textarea
              placeholder="¿Por qué es especial? (opcional)"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              className="w-full bg-[#1E1534] border border-[#453A67] rounded-xl px-4 py-3 text-white placeholder-[#8A83A0] outline-none focus:border-[#B388FF] transition resize-none"
            />
            <div>
              <label className="text-[#C7C7D3] text-sm mb-1.5 flex items-center gap-1.5">
                <Link2 size={16} className="text-[#FF7EB6]" />
                Link de YouTube (así se genera la portada)
              </label>
              <input
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="w-full bg-[#1E1534] border border-[#453A67] rounded-xl px-4 py-3 text-white placeholder-[#8A83A0] outline-none focus:border-[#B388FF] transition"
              />
              {youtubeUrl.trim() && (
                <div className="mt-3 flex items-center gap-3">
                  {idPreview ? (
                    <>
                      <img
                        src={obtenerPortada(idPreview) || ""}
                        alt=""
                        className="w-16 h-16 rounded-lg object-cover border border-[#453A67]"
                      />
                      <span className="text-xs text-[#C7C7D3]">
                        Link válido, esta será la portada.
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-red-300">
                      No reconozco ese link de YouTube.
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={agregarCancion}
                disabled={guardando || !titulo.trim() || !artista.trim()}
                className="flex-1 bg-[#FF4D8D] hover:bg-[#E63A79] transition rounded-full py-3 font-semibold tracking-wide text-white disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Guardar canción"}
              </button>
              <button
                onClick={() => setMostrarForm(false)}
                className="px-6 rounded-full py-3 font-semibold tracking-wide text-[#C7C7D3] border border-[#453A67] hover:border-[#B388FF]/50 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* ---------- LISTA DE CANCIONES ---------- */}
        <div className="bg-[#2B2145]/40 rounded-3xl border border-[#453A67]/70 overflow-hidden">
          {/* Cabecera de columnas */}
          {!cargando && canciones.length > 0 && (
            <div className="hidden md:grid grid-cols-[2rem_1fr_1fr_2rem] gap-4 px-6 py-3 text-[11px] uppercase tracking-widest text-[#8A83A0] border-b border-[#453A67]/60">
              <span className="text-center">#</span>
              <span>Título</span>
              <span>Por qué es especial</span>
              <span />
            </div>
          )}

          {cargando && (
            <div className="p-10 text-center text-[#C7C7D3]">
              Cargando canciones...
            </div>
          )}

          {!cargando && canciones.length === 0 && (
            <div className="p-10 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-[#B388FF]/10 flex items-center justify-center mb-4">
                <Music size={28} className="text-[#B388FF]" />
              </div>
              <p className="fuente-elegante text-lg">Aún no hay canciones</p>
              <p className="text-[#C7C7D3] text-sm mt-1">
                Agrega la primera y empecemos esta playlist 💜
              </p>
            </div>
          )}

          {!cargando &&
            canciones.map((cancion, index) => {
              const actual = reproduciendoId === cancion.id;
              const portada = obtenerPortada(cancion.youtube_id);
              const reproducible = Boolean(cancion.youtube_id);

              return (
                <div
                  key={cancion.id}
                  onClick={() => alternarFila(cancion)}
                  style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
                  className={`fila-cancion group grid grid-cols-[2rem_1fr_2rem] md:grid-cols-[2rem_1fr_1fr_2rem] items-center gap-3 md:gap-4 px-3 sm:px-6 py-2.5 border-b border-[#453A67]/40 last:border-b-0 transition ${
                    reproducible ? "cursor-pointer" : "cursor-default"
                  } ${actual ? "bg-[#B388FF]/10" : "hover:bg-white/5"}`}
                >
                  {/* Número / ecualizador / play al pasar el mouse */}
                  <div className="flex items-center justify-center text-sm text-[#8A83A0]">
                    {actual ? (
                      <span className={`eq ${pausado ? "pausa" : ""}`}>
                        <i />
                        <i />
                        <i />
                      </span>
                    ) : (
                      <>
                        <span className={reproducible ? "group-hover:hidden" : ""}>
                          {index + 1}
                        </span>
                        {reproducible && (
                          <Play
                            size={16}
                            fill="white"
                            className="hidden group-hover:block text-white"
                          />
                        )}
                      </>
                    )}
                  </div>

                  {/* Portada + textos */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-[#1E1534]">
                      {portada ? (
                        <img
                          src={portada}
                          alt=""
                          className={`w-full h-full object-cover ${
                            reproducible ? "" : "opacity-50"
                          }`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music size={18} className="text-[#8A83A0]" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3
                        className={`fuente-elegante text-base font-semibold truncate ${
                          actual ? "text-[#FF7EB6]" : "text-white"
                        }`}
                      >
                        {cancion.titulo}
                      </h3>
                      <p className="text-[#B388FF] text-xs sm:text-sm font-medium truncate">
                        {cancion.artista}
                        {!reproducible && (
                          <span className="text-[#8A83A0] font-normal">
                            {" "}
                            · sin video
                          </span>
                        )}
                      </p>
                      {/* Motivo en móvil */}
                      {cancion.motivo && (
                        <p className="md:hidden flex items-center gap-1 text-[#C7C7D3] text-[11px] mt-0.5 truncate">
                          <Heart
                            size={10}
                            className="text-[#FF7EB6] shrink-0"
                            fill="#FF7EB6"
                          />
                          <span className="truncate">{cancion.motivo}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Motivo en pantallas grandes */}
                  <p className="hidden md:flex items-center gap-1.5 text-[#C7C7D3] text-sm min-w-0">
                    {cancion.motivo ? (
                      <>
                        <Heart
                          size={13}
                          className="text-[#FF7EB6] shrink-0"
                          fill="#FF7EB6"
                        />
                        <span className="truncate">{cancion.motivo}</span>
                      </>
                    ) : (
                      <span className="text-[#8A83A0]">—</span>
                    )}
                  </p>

                  {/* Eliminar */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      eliminarCancion(cancion.id);
                    }}
                    className="text-[#8A83A0] hover:text-[#FF7EB6] transition justify-self-end p-1"
                    aria-label="Eliminar canción"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
        </div>
      </div>

      {/* ---------- REPRODUCTOR FLOTANTE ---------- */}
      {cancionActual && cancionActual.youtube_id && (
        <div className="player-flotante fixed bottom-20 sm:bottom-24 left-0 right-0 mx-3 sm:mx-6 z-50">
          <div className="max-w-3xl mx-auto bg-[#1E1534]/95 backdrop-blur-xl border border-[#453A67] rounded-2xl p-3 sm:p-4 shadow-2xl shadow-black/50">
            {/* Fila superior: portada + info + video compacto + cerrar */}
            <div className="flex items-center gap-3 sm:gap-4">
              <img
                src={obtenerPortada(cancionActual.youtube_id) || ""}
                alt=""
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="fuente-elegante text-white font-semibold text-sm sm:text-base truncate">
                  {cancionActual.titulo}
                </p>
                <p className="text-[#B388FF] text-xs truncate">
                  {cancionActual.artista}
                </p>
              </div>

              {/* Video compacto: solo en desktop */}
              {!esMobile && (
                <div className="w-40 aspect-video rounded-lg overflow-hidden shrink-0 border border-[#453A67] bg-black">
                  {iframeReproductor("w-full h-full")}
                </div>
              )}

              <button
                onClick={() => setReproduciendoId(null)}
                className="text-[#8A83A0] hover:text-white transition shrink-0 self-start p-1"
                aria-label="Cerrar reproductor"
              >
                <X size={20} />
              </button>
            </div>

            {/* Controles */}
            <div className="flex items-center justify-center gap-5 mt-3">
              <button
                onClick={() => setAleatorio(!aleatorio)}
                className={`transition ${
                  aleatorio ? "text-[#FF7EB6]" : "text-[#8A83A0] hover:text-white"
                }`}
                aria-label="Modo aleatorio"
              >
                <Shuffle size={18} />
              </button>
              <button
                onClick={() => irA(-1)}
                className="text-white hover:text-[#FF7EB6] transition"
                aria-label="Anterior"
              >
                <SkipBack size={22} fill="currentColor" />
              </button>
              <button
                onClick={alternarPausa}
                className="w-11 h-11 rounded-full bg-white text-[#120B1F] hover:scale-105 active:scale-95 transition flex items-center justify-center"
                aria-label={pausado ? "Reproducir" : "Pausar"}
              >
                {pausado ? (
                  <Play size={20} fill="currentColor" className="ml-0.5" />
                ) : (
                  <Pause size={20} fill="currentColor" />
                )}
              </button>
              <button
                onClick={() => irA(1)}
                className="text-white hover:text-[#FF7EB6] transition"
                aria-label="Siguiente"
              >
                <SkipForward size={22} fill="currentColor" />
              </button>
              <span className="w-[18px]" />
            </div>

            {/* Barra de progreso */}
            <div className="flex items-center gap-2 mt-3 text-[11px] text-[#8A83A0] tabular-nums">
              <span className="w-9 text-right">{formatearTiempo(progreso.t)}</span>
              <div
                onClick={buscarEnBarra}
                className="relative flex-1 h-4 flex items-center cursor-pointer group"
              >
                <div className="w-full h-1 rounded-full bg-white/15 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#B388FF] to-[#FF4D8D] rounded-full"
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
              </div>
              <span className="w-9">{formatearTiempo(progreso.d)}</span>
            </div>

            {/* Video grande: solo en móvil */}
            {esMobile && (
              <div className="mt-3 rounded-xl overflow-hidden border border-[#453A67] aspect-video bg-black">
                {iframeReproductor("w-full h-full")}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default Playlist;