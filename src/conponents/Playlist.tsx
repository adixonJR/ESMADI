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

  const esMobile = useEsMobile();

  const cancionActual = canciones.find((c) => c.id === reproduciendoId) || null;

  // Cargar canciones desde Supabase al montar el componente
  useEffect(() => {
    cargarCanciones();
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

  const alternarReproduccion = (id: string) => {
    setReproduciendoId((prev) => (prev === id ? null : id));
  };

  // Miniaturas para armar la portada tipo mosaico de la playlist
  const portadasDisponibles = canciones
    .map((c) => obtenerPortada(c.youtube_id))
    .filter((p): p is string => Boolean(p));

  return (
    <section className="px-6 py-10 bg-[#120B1F] min-h-screen pb-32">
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

        {/* Encabezado tipo playlist con portada */}
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 mb-10">
          {/* Portada mosaico */}
          <div className="w-40 h-40 sm:w-48 sm:h-48 shrink-0 rounded-2xl overflow-hidden shadow-2xl shadow-black/40 border border-[#453A67]">
            {portadasDisponibles.length === 0 ? (
              <div className="w-full h-full bg-gradient-to-br from-[#B388FF] to-[#FF4D8D] flex items-center justify-center">
                <Music size={56} className="text-white/90" strokeWidth={1.5} />
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
          <div className="text-center sm:text-left">
            <p className="text-[#B388FF] text-xs sm:text-sm font-semibold tracking-widest uppercase flex items-center justify-center sm:justify-start gap-2">
              <ListMusic size={16} />
              Playlist de nosotros
            </p>
            <h1 className="fuente-elegante text-3xl sm:text-5xl font-bold tracking-tight text-white mt-2">
              Nuestra Playlist
            </h1>
            <p className="text-[#C7C7D3] text-sm sm:text-base mt-3">
              {canciones.length} {canciones.length === 1 ? "canción" : "canciones"} · Las
              que cuentan nuestra historia
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Lista de canciones estilo reproductor */}
        <div className="bg-[#2B2145]/60 rounded-3xl border border-[#453A67] overflow-hidden mb-8">
          {cargando && (
            <div className="p-8 text-center text-[#C7C7D3]">Cargando canciones...</div>
          )}

          {!cargando && canciones.length === 0 && (
            <div className="p-8 text-center text-[#C7C7D3]">
              Todavía no hay canciones. Agrega la primera 💜
            </div>
          )}

          {!cargando &&
            canciones.map((cancion, index) => {
              const sonando = reproduciendoId === cancion.id;
              const portada = obtenerPortada(cancion.youtube_id);

              return (
                <div
                  key={cancion.id}
                  className={`flex items-center gap-4 px-4 sm:px-6 py-3 border-b border-[#453A67]/60 last:border-b-0 group transition ${
                    sonando ? "bg-[#B388FF]/10" : "hover:bg-white/5"
                  }`}
                >
                  {/* Número / indicador de reproducción */}
                  <div className="w-5 shrink-0 text-center text-sm text-[#8A83A0]">
                    {sonando ? (
                      <span className="flex justify-center">
                        <span className="flex gap-[2px] items-end h-3">
                          <span className="w-[3px] bg-[#FF7EB6] animate-pulse h-2" />
                          <span className="w-[3px] bg-[#FF7EB6] animate-pulse h-3" />
                          <span className="w-[3px] bg-[#FF7EB6] animate-pulse h-1.5" />
                        </span>
                      </span>
                    ) : (
                      index + 1
                    )}
                  </div>

                  {/* Portada + play overlay */}
                  <button
                    onClick={() => cancion.youtube_id && alternarReproduccion(cancion.id)}
                    disabled={!cancion.youtube_id}
                    className={`relative w-12 h-12 rounded-lg overflow-hidden shrink-0 ${
                      cancion.youtube_id ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                    }`}
                    aria-label="Reproducir"
                  >
                    {portada ? (
                      <img src={portada} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#1E1534] flex items-center justify-center">
                        <Music size={18} className="text-[#8A83A0]" />
                      </div>
                    )}
                    {cancion.youtube_id && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                        {sonando ? (
                          <Pause size={18} className="text-white" fill="white" />
                        ) : (
                          <Play size={18} className="text-white" fill="white" />
                        )}
                      </div>
                    )}
                  </button>

                  {/* Título / artista / motivo */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`fuente-elegante text-base sm:text-lg font-semibold truncate ${
                        sonando ? "text-[#FF7EB6]" : "text-white"
                      }`}
                    >
                      {cancion.titulo}
                    </h3>
                    <p className="text-[#B388FF] text-xs sm:text-sm font-medium truncate">
                      {cancion.artista}
                    </p>
                  </div>

                  {/* Motivo, solo en pantallas grandes */}
                  {cancion.motivo && (
                    <p className="hidden md:flex items-center gap-1.5 text-[#C7C7D3] text-xs max-w-[220px] truncate">
                      <Heart size={12} className="text-[#FF7EB6] shrink-0" />
                      {cancion.motivo}
                    </p>
                  )}

                  {/* Eliminar */}
                  <button
                    onClick={() => eliminarCancion(cancion.id)}
                    className="text-[#8A83A0] hover:text-[#FF7EB6] transition shrink-0"
                    aria-label="Eliminar canción"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
        </div>

        {/* Formulario para agregar */}
        {mostrarForm ? (
          <div className="bg-[#2B2145] rounded-3xl p-7 border border-[#453A67] space-y-4">
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
            </div>
            <div className="flex gap-3">
              <button
                onClick={agregarCancion}
                disabled={guardando}
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
        ) : (
          <button
            onClick={() => setMostrarForm(true)}
            className="w-full flex items-center justify-center gap-2 bg-[#FF4D8D] hover:bg-[#E63A79] transition rounded-full py-3 font-semibold tracking-wide text-white"
          >
            <Plus size={20} />
            Agregar canción
          </button>
        )}
      </div>

      {/* Reproductor flotante estilo Spotify — un solo iframe, tamaño según viewport */}
      {cancionActual && cancionActual.youtube_id && (
        <div className="fixed bottom-20 sm:bottom-24 left-0 right-0 bg-[#1E1534] border border-[#453A67] rounded-2xl mx-4 sm:mx-6 px-4 sm:px-6 py-3 z-50 shadow-2xl shadow-black/40">
          <div className="max-w-3xl mx-auto flex items-center gap-4">
            <img
              src={obtenerPortada(cancionActual.youtube_id) || ""}
              alt=""
              className="w-14 h-14 rounded-lg object-cover shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-white font-semibold text-sm truncate">
                {cancionActual.titulo}
              </p>
              <p className="text-[#B388FF] text-xs truncate">{cancionActual.artista}</p>
            </div>

            {/* Reproductor compacto: visible solo en desktop, al costado */}
            {!esMobile && (
              <div className="w-40 h-[70px] rounded-lg overflow-hidden shrink-0 border border-[#453A67]">
                <iframe
                  key={cancionActual.id}
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${cancionActual.youtube_id}?autoplay=1`}
                  title={cancionActual.titulo}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            <button
              onClick={() => setReproduciendoId(null)}
              className="text-[#8A83A0] hover:text-white transition shrink-0"
              aria-label="Cerrar reproductor"
            >
              <X size={20} />
            </button>
          </div>

          {/* Reproductor grande: visible solo en móvil, debajo de la barra */}
          {esMobile && (
            <div className="mt-3 max-w-3xl mx-auto rounded-xl overflow-hidden border border-[#453A67] aspect-video">
              <iframe
                key={cancionActual.id}
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${cancionActual.youtube_id}?autoplay=1`}
                title={cancionActual.titulo}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default Playlist;