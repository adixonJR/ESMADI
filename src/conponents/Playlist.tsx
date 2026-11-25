import { useState, useEffect } from "react";
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
} from "lucide-react";
import {
  useMusica,
  extraerYoutubeId,
  obtenerPortada,
} from "../conponents/MusicaContext";

function Playlist() {
  // El reproductor y la lista viven en el contexto global (MusicaProvider),
  // por eso la música sigue sonando aunque cambies de página.
  const {
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
    alternarFila,
    botonPrincipal,
  } = useMusica();

  const [mostrarForm, setMostrarForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [artista, setArtista] = useState("");
  const [motivo, setMotivo] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Cargar canciones al entrar a la página
  useEffect(() => {
    cargarCanciones();
  }, [cargarCanciones]);

  const manejarGuardar = async () => {
    if (!titulo.trim() || !artista.trim() || guardando) return;
    setGuardando(true);
    const ok = await agregarCancion({ titulo, artista, motivo, youtubeUrl });
    if (ok) {
      setTitulo("");
      setArtista("");
      setMotivo("");
      setYoutubeUrl("");
      setMostrarForm(false);
    }
    setGuardando(false);
  };

  // Miniaturas para armar la portada tipo mosaico de la playlist
  const portadasDisponibles = canciones
    .map((c) => obtenerPortada(c.youtube_id))
    .filter((p): p is string => Boolean(p));

  const sonandoAhora = Boolean(cancionActual) && !pausado;
  const idPreview = extraerYoutubeId(youtubeUrl);

  return (
    <section
      className={`px-4 sm:px-6 pt-6 bg-[#120B1F] min-h-screen text-white ${
        cancionActual ? "pb-80" : "pb-32"
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

        @media (prefers-reduced-motion: reduce) {
          .eq i, .fila-cancion { animation: none !important; }
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
                onClick={manejarGuardar}
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
    </section>
  );
}

export default Playlist;