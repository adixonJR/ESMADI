import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Clapperboard,
  Plus,
  Star,
  Trash2,
  Pencil,
  X,
  Film,
  Tv,
  CheckCircle2,
  Clock3,
  Loader2,
  Ticket,
  Play,
  Video as VideoIcon,
} from "lucide-react";
import supabase from "../lib/supabase.js";

type Tipo = "Película" | "Serie";
type Estado = "Vista" | "Pendiente";
type Filtro = "Todas" | Estado;

interface Titulo {
  id: string;
  nombre: string;
  tipo: Tipo;
  estado: Estado;
  calificacion: number | null;
  notas: string | null;
  poster: string | null;
  video_path: string | null;
  created_at: string;
}

const BUCKET_VIDEOS = "videos";
const MAX_VIDEO_MB = 40;

const urlVideo = (path: string) =>
  supabase.storage.from(BUCKET_VIDEOS).getPublicUrl(path).data.publicUrl;

function PeliculasSeries() {
  const [titulos, setTitulos] = useState<Titulo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>("Todas");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tituloEditando, setTituloEditando] = useState<Titulo | null>(null);
  const [videoAbierto, setVideoAbierto] = useState<Titulo | null>(null);

  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<Tipo>("Película");
  const [estado, setEstado] = useState<Estado>("Pendiente");
  const [calificacion, setCalificacion] = useState(5);
  const [notas, setNotas] = useState("");
  const [poster, setPoster] = useState("");
  const [videoArchivo, setVideoArchivo] = useState<File | null>(null);
  const [videoActual, setVideoActual] = useState<string | null>(null);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  useEffect(() => {
    cargarTitulos();
  }, []);

  useEffect(() => {
    if (!videoAbierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVideoAbierto(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [videoAbierto]);

  const cargarTitulos = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from("peliculas_series")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error al cargar títulos:", error.message);
    } else {
      setTitulos(data as Titulo[]);
    }
    setCargando(false);
  };

  const limpiarFormulario = () => {
    setNombre("");
    setTipo("Película");
    setEstado("Pendiente");
    setCalificacion(5);
    setNotas("");
    setPoster("");
    setVideoArchivo(null);
    setVideoActual(null);
    setErrorForm(null);
  };

  const abrirModalNuevo = () => {
    setTituloEditando(null);
    limpiarFormulario();
    setModalAbierto(true);
  };

  const abrirModalEdicion = (t: Titulo) => {
    setTituloEditando(t);
    setNombre(t.nombre);
    setTipo(t.tipo);
    setEstado(t.estado);
    setCalificacion(t.calificacion ?? 5);
    setNotas(t.notas ?? "");
    setPoster(t.poster ?? "");
    setVideoArchivo(null);
    setVideoActual(t.video_path ?? null);
    setErrorForm(null);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setTituloEditando(null);
    limpiarFormulario();
  };

  const elegirVideo = (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;

    if (!archivo.type.startsWith("video/")) {
      setErrorForm("El archivo debe ser un video.");
      return;
    }
    if (archivo.size > MAX_VIDEO_MB * 1024 * 1024) {
      setErrorForm(`El video pesa demasiado. Máximo ${MAX_VIDEO_MB} MB.`);
      return;
    }
    setErrorForm(null);
    setVideoArchivo(archivo);
  };

  const quitarVideo = () => {
    if (videoArchivo) {
      setVideoArchivo(null);
    } else {
      setVideoActual(null);
    }
  };

  const guardarTitulo = async () => {
    if (!nombre.trim()) return;
    setGuardando(true);
    setErrorForm(null);

    const anteriorPath = tituloEditando?.video_path ?? null;
    let videoPath: string | null = videoActual;

    // 1) Subir el video nuevo (si se eligió uno)
    if (videoArchivo) {
      const ext = (videoArchivo.name.split(".").pop() || "mp4").toLowerCase();
      const nuevoPath = `${crypto.randomUUID()}.${ext}`;
      const { error: errSubida } = await supabase.storage
        .from(BUCKET_VIDEOS)
        .upload(nuevoPath, videoArchivo, {
          contentType: videoArchivo.type,
          cacheControl: "3600",
          upsert: false,
        });

      if (errSubida) {
        console.error("Error al subir video:", errSubida.message);
        setErrorForm("No se pudo subir el video. Intenta de nuevo.");
        setGuardando(false);
        return;
      }
      videoPath = nuevoPath;
    }

    const payload = {
      nombre: nombre.trim(),
      tipo,
      estado,
      calificacion: estado === "Vista" ? calificacion : null,
      notas: notas.trim() || null,
      poster: poster.trim() || null,
      video_path: videoPath,
    };

    // 2) Guardar en la tabla
    let guardado: Titulo | null = null;

    if (tituloEditando) {
      const { data, error } = await supabase
        .from("peliculas_series")
        .update(payload)
        .eq("id", tituloEditando.id)
        .select()
        .single();

      if (error) {
        console.error("Error al editar título:", error.message);
      } else if (data) {
        guardado = data as Titulo;
      }
    } else {
      const { data, error } = await supabase
        .from("peliculas_series")
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error("Error al agregar título:", error.message);
      } else if (data) {
        guardado = data as Titulo;
      }
    }

    // Si falló el guardado, borra el video recién subido para no dejar basura
    if (!guardado) {
      if (videoArchivo && videoPath) {
        await supabase.storage.from(BUCKET_VIDEOS).remove([videoPath]);
      }
      setErrorForm("No se pudo guardar. Intenta de nuevo.");
      setGuardando(false);
      return;
    }

    const nuevo: Titulo = guardado;
    if (tituloEditando) {
      setTitulos((prev) => prev.map((t) => (t.id === nuevo.id ? nuevo : t)));
    } else {
      setTitulos((prev) => [nuevo, ...prev]);
    }

    // 3) Si se reemplazó o quitó el video anterior, bórralo del bucket
    if (anteriorPath && anteriorPath !== videoPath) {
      await supabase.storage.from(BUCKET_VIDEOS).remove([anteriorPath]);
    }

    setGuardando(false);
    cerrarModal();
  };

  const eliminarTitulo = async (t: Titulo) => {
    const anterior = titulos;
    setTitulos((prev) => prev.filter((item) => item.id !== t.id));

    const { error } = await supabase
      .from("peliculas_series")
      .delete()
      .eq("id", t.id);

    if (error) {
      console.error("Error al eliminar título:", error.message);
      setTitulos(anterior);
      return;
    }

    if (t.video_path) {
      await supabase.storage.from(BUCKET_VIDEOS).remove([t.video_path]);
    }
  };

  const alternarEstado = async (t: Titulo) => {
    const nuevoEstado: Estado = t.estado === "Vista" ? "Pendiente" : "Vista";
    const anterior = titulos;

    setTitulos((prev) =>
      prev.map((item) =>
        item.id === t.id ? { ...item, estado: nuevoEstado } : item
      )
    );

    const { error } = await supabase
      .from("peliculas_series")
      .update({ estado: nuevoEstado })
      .eq("id", t.id);

    if (error) {
      console.error("Error al actualizar estado:", error.message);
      setTitulos(anterior);
    }
  };

  const titulosFiltrados =
    filtro === "Todas" ? titulos : titulos.filter((t) => t.estado === filtro);

  return (
    <section className="px-4 sm:px-6 py-8 sm:py-10 min-h-screen">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap');
        .fuente-elegante { font-family: 'Playfair Display', Georgia, serif; }
        .luces-marquesina {
          background-image: radial-gradient(circle, #FACC15 1.5px, transparent 1.5px);
          background-size: 14px 14px;
        }
      `}</style>

      {/* Volver */}
      <Link
        to="/nosotros"
        className="inline-flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition mb-6"
      >
        <ArrowLeft size={18} />
        Volver a Nosotros
      </Link>

      {/* Título estilo marquesina de cine */}
      <div className="text-center mb-10">
        <div className="flex justify-center mb-5">
          <div className="border border-[#B388FF]/40 p-4 sm:p-5 rounded-full">
            <Clapperboard
              size={36}
              className="text-[#B388FF] sm:w-10 sm:h-10"
              strokeWidth={1.5}
            />
          </div>
        </div>
        <h1 className="fuente-elegante text-3xl sm:text-5xl font-bold tracking-tight">
          Cartelera
        </h1>
        <p className="text-sm sm:text-base tracking-widest uppercase opacity-60 mt-1">
          Películas y series
        </p>
        <div className="luces-marquesina h-2 w-40 sm:w-56 mx-auto mt-4 mb-1 opacity-70 rounded-full" />
        <p className="text-xs sm:text-sm tracking-wide opacity-60 mt-3">
          Lo que vimos juntos y lo que sigue en la lista
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Botón agregar */}
        <button
          onClick={abrirModalNuevo}
          className="flex items-center justify-center gap-2 w-full mb-6 bg-[#FF4D8D] hover:bg-[#E63A79] transition rounded-full py-3 font-semibold tracking-wide text-white"
        >
          <Plus size={20} />
          Agregar título
        </button>

        {/* Filtros */}
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {(["Todas", "Pendiente", "Vista"] as Filtro[]).map((opcion) => (
            <button
              key={opcion}
              onClick={() => setFiltro(opcion)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium tracking-wide transition border ${
                filtro === opcion
                  ? "bg-[#FF7EB6]/20 border-[#FF7EB6]/60 text-[#FF7EB6]"
                  : "border-[#453A67]/40 opacity-70 hover:opacity-100"
              }`}
            >
              {opcion === "Pendiente"
                ? "Pendientes"
                : opcion === "Vista"
                ? "Vistas"
                : "Todas"}
            </button>
          ))}
        </div>

        {/* Cargando */}
        {cargando && (
          <div className="flex justify-center py-16 opacity-70">
            <Loader2 size={28} className="animate-spin" />
          </div>
        )}

        {/* Lista vacía */}
        {!cargando && titulosFiltrados.length === 0 && (
          <div className="text-center rounded-3xl p-10 border border-[#453A67]/40 opacity-70">
            <Ticket size={32} className="mx-auto mb-3 opacity-50" />
            No hay nada en cartelera todavía.
          </div>
        )}

        {/* Cartelera: grid de pósters */}
        {!cargando && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
            {titulosFiltrados.map((t) => (
              <div
                key={t.id}
                className="group relative aspect-[2/3] rounded-xl sm:rounded-2xl overflow-hidden border border-[#453A67]/40 hover:border-[#B388FF]/60 transition shadow-lg shadow-black/40"
              >
                {/* Póster o placeholder */}
                {t.poster ? (
                  <img
                    src={t.poster}
                    alt={t.nombre}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#2A1847] to-[#1B1033] flex flex-col items-center justify-center gap-2 px-3">
                    {t.tipo === "Película" ? (
                      <Film size={30} className="text-[#453A67]" />
                    ) : (
                      <Tv size={30} className="text-[#453A67]" />
                    )}
                    <span className="text-xs text-center opacity-50 fuente-elegante leading-snug">
                      {t.nombre}
                    </span>
                  </div>
                )}

                {/* Degradado inferior para texto */}
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none" />

                {/* Botón de reproducir el edit (solo si tiene video) */}
                {t.video_path && (
                  <button
                    onClick={() => setVideoAbierto(t)}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-black/45 backdrop-blur-md border border-white/30 text-white shadow-lg transition active:scale-95 hover:bg-black/60"
                    aria-label={`Ver el edit de ${t.nombre}`}
                  >
                    <Play size={22} className="ml-0.5 fill-white" />
                  </button>
                )}

                {/* Badge de estado, arriba a la izquierda */}
                <button
                  onClick={() => alternarEstado(t)}
                  className={`absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-full backdrop-blur-sm transition ${
                    t.estado === "Vista"
                      ? "bg-[#22C55E]/25 text-[#4ADE80]"
                      : "bg-[#FACC15]/25 text-[#FACC15]"
                  }`}
                >
                  {t.estado === "Vista" ? (
                    <CheckCircle2 size={12} />
                  ) : (
                    <Clock3 size={12} />
                  )}
                  <span className="hidden sm:inline">{t.estado}</span>
                </button>

                {/* Editar / eliminar, arriba a la derecha */}
                <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                  <button
                    onClick={() => abrirModalEdicion(t)}
                    className="bg-black/50 backdrop-blur-sm rounded-full p-1.5 text-white/90 hover:text-[#B388FF] transition"
                    aria-label="Editar"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => eliminarTitulo(t)}
                    className="bg-black/50 backdrop-blur-sm rounded-full p-1.5 text-white/90 hover:text-[#FF4D8D] transition"
                    aria-label="Eliminar"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Texto inferior: título, tipo, calificación */}
                <div className="absolute inset-x-0 bottom-0 p-2 sm:p-3">
                  <div className="flex items-center gap-1 mb-0.5">
                    {t.tipo === "Película" ? (
                      <Film size={11} className="text-[#B388FF] shrink-0" />
                    ) : (
                      <Tv size={11} className="text-[#B388FF] shrink-0" />
                    )}
                    <span className="text-[10px] sm:text-xs text-[#B388FF] tracking-wide">
                      {t.tipo}
                    </span>
                  </div>
                  <h3 className="fuente-elegante text-xs sm:text-base font-semibold leading-tight line-clamp-2">
                    {t.nombre}
                  </h3>

                  {t.estado === "Vista" && t.calificacion && (
                    <div className="flex gap-0.5 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={10}
                          className={
                            i < (t.calificacion ?? 0)
                              ? "text-[#FACC15] fill-[#FACC15]"
                              : "text-white/20"
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visor del video (edit) */}
      {videoAbierto?.video_path && (
        <div
          className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center px-4"
          onClick={() => setVideoAbierto(null)}
        >
          <button
            onClick={() => setVideoAbierto(null)}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition"
            aria-label="Cerrar video"
          >
            <X size={22} />
          </button>

          <div
            className="w-full max-w-sm sm:max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              key={videoAbierto.video_path}
              src={urlVideo(videoAbierto.video_path)}
              controls
              autoPlay
              loop
              playsInline
              className="w-full max-h-[80vh] rounded-2xl bg-black shadow-2xl"
            />
            <p className="fuente-elegante mt-3 text-center text-base font-semibold">
              {videoAbierto.nombre}
            </p>
          </div>
        </div>
      )}

      {/* Modal agregar / editar título */}
      {modalAbierto && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 sm:px-6 z-[100]"
          onClick={guardando ? undefined : cerrarModal}
        >
          <div
            className="bg-[#241539] rounded-3xl p-5 sm:p-7 w-full max-w-md max-h-[90vh] overflow-y-auto border border-[#453A67]/40"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="fuente-elegante text-xl font-semibold">
                {tituloEditando ? "Editar título" : "Nuevo título"}
              </h2>
              <button
                onClick={cerrarModal}
                disabled={guardando}
                className="opacity-70 hover:opacity-100 transition disabled:opacity-30"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nombre de la película o serie"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 bg-[#1B1033] border border-[#453A67]/40 outline-none focus:border-[#B388FF]/60 transition text-sm"
              />

              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as Tipo)}
                  className="flex-1 rounded-xl px-4 py-2.5 bg-[#1B1033] border border-[#453A67]/40 outline-none focus:border-[#B388FF]/60 transition text-sm"
                >
                  <option value="Película">Película</option>
                  <option value="Serie">Serie</option>
                </select>

                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as Estado)}
                  className="flex-1 rounded-xl px-4 py-2.5 bg-[#1B1033] border border-[#453A67]/40 outline-none focus:border-[#B388FF]/60 transition text-sm"
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Vista">Vista</option>
                </select>
              </div>

              <input
                type="text"
                placeholder="URL de póster (opcional)"
                value={poster}
                onChange={(e) => setPoster(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 bg-[#1B1033] border border-[#453A67]/40 outline-none focus:border-[#B388FF]/60 transition text-sm"
              />

              {/* Video corto (edit) */}
              <div>
                <input
                  id="input-video-edit"
                  type="file"
                  accept="video/*"
                  onChange={elegirVideo}
                  className="hidden"
                />
                <label
                  htmlFor="input-video-edit"
                  className="flex items-center gap-2 w-full rounded-xl px-4 py-2.5 bg-[#1B1033] border border-dashed border-[#453A67]/70 hover:border-[#B388FF]/60 transition text-sm cursor-pointer"
                >
                  <VideoIcon size={18} className="text-[#B388FF] shrink-0" />
                  <span className="truncate opacity-80">
                    {videoArchivo
                      ? videoArchivo.name
                      : videoActual
                      ? "Video guardado (toca para cambiarlo)"
                      : "Agregar video corto (opcional)"}
                  </span>
                </label>

                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <p className="text-[11px] opacity-50">
                    Un edit de pocos segundos, máx. {MAX_VIDEO_MB} MB.
                  </p>
                  {(videoArchivo || videoActual) && (
                    <button
                      type="button"
                      onClick={quitarVideo}
                      className="shrink-0 text-xs text-[#FF4D8D] hover:underline"
                    >
                      {videoArchivo ? "Quitar selección" : "Quitar video"}
                    </button>
                  )}
                </div>
              </div>

              <textarea
                placeholder="Notas (opcional)"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={3}
                className="w-full rounded-xl px-4 py-2.5 bg-[#1B1033] border border-[#453A67]/40 outline-none focus:border-[#B388FF]/60 transition text-sm resize-none"
              />

              {estado === "Vista" && (
                <div className="flex items-center gap-2">
                  <span className="text-sm opacity-70">Calificación:</span>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCalificacion(i + 1)}
                      >
                        <Star
                          size={20}
                          className={
                            i < calificacion
                              ? "text-[#FACC15] fill-[#FACC15]"
                              : "text-[#453A67]"
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {errorForm && (
              <p className="mt-4 text-sm text-[#FF7EB6]">{errorForm}</p>
            )}

            <button
              onClick={guardarTitulo}
              disabled={!nombre.trim() || guardando}
              className="w-full mt-6 bg-[#FF4D8D] hover:bg-[#E63A79] disabled:opacity-40 disabled:cursor-not-allowed transition rounded-full py-3 font-semibold tracking-wide text-white flex items-center justify-center gap-2"
            >
              {guardando && <Loader2 size={18} className="animate-spin" />}
              {guardando && videoArchivo
                ? "Subiendo video..."
                : tituloEditando
                ? "Guardar cambios"
                : "Guardar"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default PeliculasSeries;