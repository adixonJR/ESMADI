import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Utensils,
  Plus,
  Star,
  Trash2,
  MapPin,
  X,
  Loader2,
  Camera,
  Images,
  ImageUp,
  ClipboardPaste,
  Heart,
  CheckCircle2,
  ThumbsUp,
  Map,
  ExternalLink,
  Search,
  Clock,
  Calendar,
  Sparkles,
} from "lucide-react";
import supabase from "../lib/supabase.js";

interface Comida {
  id: string;
  nombre: string;
  lugar: string | null;
  descripcion: string | null;
  calificacion: number;
  foto: string | null;
  created_at: string;
  favorito: boolean;
  visitado: boolean;
  recomendada: boolean;
  enlace_maps: string | null;
  enlace_yelp: string | null;
}

type CampoBooleano = "favorito" | "visitado" | "recomendada";
type Filtro = "todas" | "favoritas" | "visitadas" | "pendientes" | "recomendadas";

// Nombre del bucket de Supabase Storage donde se guardan las fotos de comidas.
// Debe existir y ser público para que las imágenes se vean con getPublicUrl().
const BUCKET_FOTOS = "comidas";

const FILTROS: { id: Filtro; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "favoritas", label: "Favoritas" },
  { id: "visitadas", label: "Visitadas" },
  { id: "pendientes", label: "Por visitar" },
  { id: "recomendadas", label: "Recomendadas" },
];

function formatearFecha(valor: string): string {
  const fecha = new Date(valor);
  if (isNaN(fecha.getTime())) return "";
  return fecha.toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Botón de estado reutilizable (favorito / visitado / recomendada)
function Chip({
  activo,
  onClick,
  icon,
  label,
}: {
  activo: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-xs font-medium border transition active:scale-95 ${
        activo
          ? "bg-[#FF4D8D] border-[#FF4D8D] text-white"
          : "bg-[#1B1033] border-[#453A67]/40 text-white/60 hover:border-[#453A67]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Comidas() {
  const [comidas, setComidas] = useState<Comida[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros y búsqueda
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [busqueda, setBusqueda] = useState("");

  // Id de la comida actualmente expandida en el grid (null = ninguna)
  const [comidaExpandidaId, setComidaExpandidaId] = useState<string | null>(
    null
  );

  const [nombre, setNombre] = useState("");
  const [lugar, setLugar] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [calificacion, setCalificacion] = useState(5);

  const [favorito, setFavorito] = useState(false);
  const [visitado, setVisitado] = useState(false);
  const [recomendada, setRecomendada] = useState(false);

  const [enlaceMaps, setEnlaceMaps] = useState("");
  const [enlaceYelp, setEnlaceYelp] = useState("");

  // Foto: puede venir de una URL pegada a mano, de un archivo subido desde el
  // celular (cámara o galería), o de una imagen pegada desde el portapapeles
  const [foto, setFoto] = useState("");
  const [archivoFoto, setArchivoFoto] = useState<File | null>(null);
  const [previewFoto, setPreviewFoto] = useState<string>("");
  const [pegadoDetectado, setPegadoDetectado] = useState(false);

  const inputGaleriaRef = useRef<HTMLInputElement>(null);
  const inputCamaraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    cargarComidas();
  }, []);

  // Limpia la URL temporal del preview cuando cambia o se desmonta el componente
  useEffect(() => {
    return () => {
      if (previewFoto) URL.revokeObjectURL(previewFoto);
    };
  }, [previewFoto]);

  const cargarComidas = async () => {
    setCargando(true);
    setError(null);
    const { data, error } = await supabase
      .from("comidas")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error al cargar comidas:", error.message);
      setError("No se pudieron cargar las comidas.");
    } else {
      setComidas(data as Comida[]);
    }
    setCargando(false);
  };

  const limpiarFormulario = () => {
    setNombre("");
    setLugar("");
    setDescripcion("");
    setCalificacion(5);
    setFavorito(false);
    setVisitado(false);
    setRecomendada(false);
    setEnlaceMaps("");
    setEnlaceYelp("");
    setFoto("");
    setArchivoFoto(null);
    if (previewFoto) URL.revokeObjectURL(previewFoto);
    setPreviewFoto("");
    setPegadoDetectado(false);
    if (inputGaleriaRef.current) inputGaleriaRef.current.value = "";
    if (inputCamaraRef.current) inputCamaraRef.current.value = "";
  };

  // Recibe un File (galería, cámara o portapapeles) y arma el preview
  const establecerArchivoFoto = (archivo: File, vienePegado = false) => {
    setArchivoFoto(archivo);
    setFoto("");
    if (previewFoto) URL.revokeObjectURL(previewFoto);
    setPreviewFoto(URL.createObjectURL(archivo));
    setPegadoDetectado(vienePegado);
  };

  const manejarSeleccionArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    establecerArchivoFoto(archivo);
  };

  // Detecta imágenes pegadas desde el portapapeles
  const manejarPegado = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const archivo = item.getAsFile();
        if (archivo) {
          e.preventDefault();
          establecerArchivoFoto(archivo, true);
        }
        break;
      }
    }
  };

  const quitarFotoSeleccionada = () => {
    setArchivoFoto(null);
    if (previewFoto) URL.revokeObjectURL(previewFoto);
    setPreviewFoto("");
    setPegadoDetectado(false);
    if (inputGaleriaRef.current) inputGaleriaRef.current.value = "";
    if (inputCamaraRef.current) inputCamaraRef.current.value = "";
  };

  // Sube el archivo elegido a Supabase Storage y devuelve la URL pública
  const subirFotoAStorage = async (archivo: File): Promise<string | null> => {
    const extension = archivo.name.split(".").pop() || "jpg";
    const rutaArchivo = `${crypto.randomUUID()}.${extension}`;

    const { error: errorSubida } = await supabase.storage
      .from(BUCKET_FOTOS)
      .upload(rutaArchivo, archivo, {
        cacheControl: "3600",
        upsert: false,
      });

    if (errorSubida) {
      console.error("Error al subir la foto:", errorSubida.message);
      return null;
    }

    const { data } = supabase.storage
      .from(BUCKET_FOTOS)
      .getPublicUrl(rutaArchivo);

    return data.publicUrl;
  };

  const agregarComida = async () => {
    if (!nombre.trim()) return;
    setGuardando(true);
    setError(null);

    let urlFoto = foto.trim() || null;

    if (archivoFoto) {
      const urlSubida = await subirFotoAStorage(archivoFoto);
      if (!urlSubida) {
        setError("No se pudo subir la foto. Intenta de nuevo.");
        setGuardando(false);
        return;
      }
      urlFoto = urlSubida;
    }

    const { data, error } = await supabase
      .from("comidas")
      .insert({
        nombre: nombre.trim(),
        lugar: lugar.trim() || null,
        descripcion: descripcion.trim() || null,
        calificacion,
        foto: urlFoto,
        favorito,
        visitado,
        recomendada,
        enlace_maps: enlaceMaps.trim() || null,
        enlace_yelp: enlaceYelp.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error al agregar comida:", error.message);
      setError("No se pudo guardar la comida.");
    } else if (data) {
      setComidas((prev) => [data as Comida, ...prev]);
      limpiarFormulario();
      setModalAbierto(false);
    }
    setGuardando(false);
  };

  const eliminarComida = async (id: string) => {
    if (!window.confirm("¿Eliminar esta comida de la lista?")) return;

    const anterior = comidas;
    setComidas((prev) => prev.filter((c) => c.id !== id));
    if (comidaExpandidaId === id) setComidaExpandidaId(null);

    const { error } = await supabase.from("comidas").delete().eq("id", id);
    if (error) {
      console.error("Error al eliminar comida:", error.message);
      setError("No se pudo eliminar la comida.");
      setComidas(anterior); // revertir si falla
    }
  };

  // Cambia favorito / visitado / recomendada directamente desde la tarjeta
  const alternarCampo = async (id: string, campo: CampoBooleano) => {
    const actual = comidas.find((c) => c.id === id);
    if (!actual) return;

    const nuevoValor = !actual[campo];
    setComidas((prev) =>
      prev.map((c) => (c.id === id ? ({ ...c, [campo]: nuevoValor } as Comida) : c))
    );

    const { error } = await supabase
      .from("comidas")
      .update({ [campo]: nuevoValor })
      .eq("id", id);

    if (error) {
      console.error("Error al actualizar:", error.message);
      setError("No se pudo actualizar la comida.");
      setComidas((prev) =>
        prev.map((c) =>
          c.id === id ? ({ ...c, [campo]: !nuevoValor } as Comida) : c
        )
      );
    }
  };

  const alternarExpansion = (id: string) => {
    setComidaExpandidaId((actual) => (actual === id ? null : id));
  };

  // ---------- Datos derivados ----------
  const totalFavoritas = comidas.filter((c) => c.favorito).length;
  const promedio =
    comidas.length > 0
      ? comidas.reduce((suma, c) => suma + c.calificacion, 0) / comidas.length
      : 0;

  const contarFiltro = (id: Filtro): number => {
    switch (id) {
      case "favoritas":
        return comidas.filter((c) => c.favorito).length;
      case "visitadas":
        return comidas.filter((c) => c.visitado).length;
      case "pendientes":
        return comidas.filter((c) => !c.visitado).length;
      case "recomendadas":
        return comidas.filter((c) => c.recomendada).length;
      default:
        return comidas.length;
    }
  };

  const comidasVisibles = comidas.filter((c) => {
    const q = busqueda.trim().toLowerCase();
    const coincide =
      !q ||
      c.nombre.toLowerCase().includes(q) ||
      (c.lugar ?? "").toLowerCase().includes(q);
    if (!coincide) return false;

    switch (filtro) {
      case "favoritas":
        return c.favorito;
      case "visitadas":
        return c.visitado;
      case "pendientes":
        return !c.visitado;
      case "recomendadas":
        return c.recomendada;
      default:
        return true;
    }
  });

  return (
    <section className="px-5 sm:px-6 py-8 min-h-screen">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap');
        .fuente-elegante { font-family: 'Playfair Display', Georgia, serif; }
        .sin-scrollbar::-webkit-scrollbar { display: none; }
        .sin-scrollbar { scrollbar-width: none; }

        @keyframes tarjeta-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tarjeta-comida { animation: tarjeta-in 0.4s ease both; }

        @keyframes modal-in {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .modal-comida { animation: modal-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }

        @media (prefers-reduced-motion: reduce) {
          .tarjeta-comida, .modal-comida { animation: none !important; }
        }
      `}</style>

      {/* Volver */}
      <Link
        to="/nosotros"
        className="inline-flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition mb-5"
      >
        <ArrowLeft size={18} />
        Volver a Nosotros
      </Link>

      {/* Encabezado */}
      <div className="relative overflow-hidden rounded-3xl border border-[#453A67]/50 mb-6 px-5 py-7 text-center bg-gradient-to-br from-[#FF4D8D]/20 via-[#B388FF]/10 to-[#FB923C]/15">
        <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#FF7EB6]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-10 w-40 h-40 rounded-full bg-[#B388FF]/20 blur-3xl" />

        <div className="relative">
          <div className="flex justify-center mb-3">
            <div className="border border-[#FF7EB6]/40 bg-[#1B1033]/50 p-4 rounded-full">
              <Utensils size={30} className="text-[#FF7EB6]" strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="fuente-elegante text-4xl font-bold tracking-tight">
            Comidas
          </h1>
          <p className="text-sm tracking-wide opacity-70 mt-1.5">
            Lo que hemos comido juntos
          </p>

          {/* Estadísticas */}
          <div className="grid grid-cols-3 gap-2.5 mt-6">
            <div className="rounded-2xl bg-[#1B1033]/60 border border-white/10 py-3">
              <p className="fuente-elegante text-2xl font-bold">{comidas.length}</p>
              <p className="text-[11px] uppercase tracking-wider opacity-60">
                Lugares
              </p>
            </div>
            <div className="rounded-2xl bg-[#1B1033]/60 border border-white/10 py-3">
              <p className="fuente-elegante text-2xl font-bold flex items-center justify-center gap-1">
                {totalFavoritas}
                <Heart size={15} className="text-[#FF4D8D] fill-[#FF4D8D]" />
              </p>
              <p className="text-[11px] uppercase tracking-wider opacity-60">
                Favoritas
              </p>
            </div>
            <div className="rounded-2xl bg-[#1B1033]/60 border border-white/10 py-3">
              <p className="fuente-elegante text-2xl font-bold flex items-center justify-center gap-1">
                {comidas.length > 0 ? promedio.toFixed(1) : "–"}
                <Star size={15} className="text-[#FACC15] fill-[#FACC15]" />
              </p>
              <p className="text-[11px] uppercase tracking-wider opacity-60">
                Promedio
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Botón agregar */}
        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center justify-center gap-2 w-full mb-5 bg-[#FF4D8D] hover:bg-[#E63A79] active:scale-[0.98] transition rounded-full py-3 font-semibold tracking-wide text-white shadow-lg shadow-[#FF4D8D]/20"
        >
          <Plus size={20} />
          Agregar comida
        </button>

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-start justify-between gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              aria-label="Cerrar aviso"
              className="shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Búsqueda y filtros */}
        {!cargando && comidas.length > 0 && (
          <div className="mb-5 space-y-3">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50"
              />
              <input
                type="text"
                placeholder="Buscar por nombre o lugar"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full rounded-full pl-10 pr-10 py-2.5 bg-[#1B1033] border border-[#453A67]/40 outline-none focus:border-[#FF7EB6]/60 transition text-sm"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
                  aria-label="Limpiar búsqueda"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="sin-scrollbar flex gap-2 overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0 pb-1">
              {FILTROS.map((f) => {
                const activo = filtro === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFiltro(f.id)}
                    className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium border transition ${
                      activo
                        ? "bg-[#FF4D8D] border-[#FF4D8D] text-white"
                        : "bg-[#1B1033] border-[#453A67]/40 text-white/70 hover:border-[#453A67]"
                    }`}
                  >
                    {f.label}
                    <span
                      className={`text-[10px] rounded-full px-1.5 ${
                        activo ? "bg-white/25" : "bg-white/10"
                      }`}
                    >
                      {contarFiltro(f.id)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Cargando */}
        {cargando && (
          <div className="flex justify-center py-16 opacity-70">
            <Loader2 size={28} className="animate-spin" />
          </div>
        )}

        {/* Lista vacía */}
        {!cargando && comidas.length === 0 && (
          <div className="text-center rounded-3xl p-10 border border-dashed border-[#453A67]/60">
            <div className="mx-auto w-16 h-16 rounded-full bg-[#FF7EB6]/10 flex items-center justify-center mb-4">
              <Sparkles size={28} className="text-[#FF7EB6]" />
            </div>
            <p className="fuente-elegante text-lg">Aún no hay comidas</p>
            <p className="text-sm opacity-70 mt-1">
              Guarda la primera y empecemos esta lista juntos 🍽️
            </p>
          </div>
        )}

        {/* Sin resultados con el filtro actual */}
        {!cargando && comidas.length > 0 && comidasVisibles.length === 0 && (
          <div className="text-center rounded-3xl p-10 border border-[#453A67]/40 opacity-70 text-sm">
            No encontramos nada con ese filtro.
          </div>
        )}

        {/* Grid de comidas */}
        {!cargando && comidasVisibles.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {comidasVisibles.map((comida, index) => {
              const expandida = comidaExpandidaId === comida.id;

              return (
                <div
                  key={comida.id}
                  onClick={() => alternarExpansion(comida.id)}
                  style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
                  className={`tarjeta-comida relative overflow-hidden rounded-3xl border cursor-pointer transition-all duration-300 bg-[#241539]/60 ${
                    expandida
                      ? "col-span-2 border-[#FF7EB6]/60"
                      : "border-[#453A67]/40 hover:border-[#FF7EB6]/50 active:scale-[0.98]"
                  }`}
                >
                  {/* Foto o placeholder */}
                  <div
                    className={`relative w-full transition-all duration-300 ${
                      expandida ? "h-56" : "h-32"
                    }`}
                  >
                    {comida.foto ? (
                      <img
                        src={comida.foto}
                        alt={comida.nombre}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#FF4D8D]/30 via-[#B388FF]/20 to-[#FB923C]/30 flex items-center justify-center">
                        <Utensils
                          size={expandida ? 44 : 32}
                          className="text-white/50"
                          strokeWidth={1.5}
                        />
                      </div>
                    )}

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                    {/* Favorito (se cambia con un toque) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        alternarCampo(comida.id, "favorito");
                      }}
                      className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-full p-2 active:scale-90 transition"
                      aria-label={
                        comida.favorito ? "Quitar de favoritas" : "Marcar como favorita"
                      }
                    >
                      <Heart
                        size={16}
                        className={
                          comida.favorito
                            ? "text-[#FF4D8D] fill-[#FF4D8D]"
                            : "text-white"
                        }
                      />
                    </button>

                    {/* Calificación */}
                    <span className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-semibold">
                      <Star size={12} className="text-[#FACC15] fill-[#FACC15]" />
                      {comida.calificacion}
                    </span>

                    {/* Estado visitado */}
                    <span
                      className={`absolute bottom-2 right-2 flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium backdrop-blur-sm ${
                        comida.visitado
                          ? "bg-emerald-500/30 text-emerald-200"
                          : "bg-black/60 text-white/70"
                      }`}
                    >
                      {comida.visitado ? (
                        <CheckCircle2 size={11} />
                      ) : (
                        <Clock size={11} />
                      )}
                      {comida.visitado ? "Visitado" : "Por visitar"}
                    </span>
                  </div>

                  {/* Contenido */}
                  <div className="p-4">
                    <h3
                      className={`fuente-elegante font-semibold leading-snug ${
                        expandida ? "text-2xl" : "text-base line-clamp-2"
                      }`}
                    >
                      {comida.nombre}
                    </h3>

                    {comida.lugar && (
                      <div
                        className={`flex items-center gap-1.5 mt-1 text-xs sm:text-sm text-[#B388FF] ${
                          expandida ? "" : "truncate"
                        }`}
                      >
                        <MapPin size={13} className="shrink-0" />
                        <span className={expandida ? "" : "truncate"}>
                          {comida.lugar}
                        </span>
                      </div>
                    )}

                    {/* Detalle: solo cuando la tarjeta está expandida */}
                    {expandida && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1 mt-3">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={18}
                              className={
                                i < comida.calificacion
                                  ? "text-[#FACC15] fill-[#FACC15]"
                                  : "text-[#453A67]"
                              }
                            />
                          ))}
                        </div>

                        {comida.descripcion && (
                          <p className="mt-4 text-sm leading-relaxed opacity-85">
                            {comida.descripcion}
                          </p>
                        )}

                        {formatearFecha(comida.created_at) && (
                          <p className="flex items-center gap-1.5 mt-4 text-xs opacity-55">
                            <Calendar size={13} />
                            Guardada el {formatearFecha(comida.created_at)}
                          </p>
                        )}

                        {/* Estados editables al instante */}
                        <div className="flex gap-2 mt-4">
                          <Chip
                            activo={comida.favorito}
                            onClick={() => alternarCampo(comida.id, "favorito")}
                            icon={
                              <Heart
                                size={14}
                                className={comida.favorito ? "fill-white" : ""}
                              />
                            }
                            label="Favorito"
                          />
                          <Chip
                            activo={comida.visitado}
                            onClick={() => alternarCampo(comida.id, "visitado")}
                            icon={<CheckCircle2 size={14} />}
                            label="Visitado"
                          />
                          <Chip
                            activo={comida.recomendada}
                            onClick={() => alternarCampo(comida.id, "recomendada")}
                            icon={<ThumbsUp size={14} />}
                            label="Recomendada"
                          />
                        </div>

                        {/* Enlaces y eliminar */}
                        <div className="flex flex-wrap items-center gap-2 mt-4">
                          {comida.enlace_maps && (
                            <a
                              href={comida.enlace_maps}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full border border-[#453A67]/50 text-[#B388FF] hover:border-[#B388FF] transition"
                            >
                              <Map size={13} />
                              Maps
                            </a>
                          )}
                          {comida.enlace_yelp && (
                            <a
                              href={comida.enlace_yelp}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full border border-[#453A67]/50 text-[#B388FF] hover:border-[#B388FF] transition"
                            >
                              <ExternalLink size={13} />
                              Yelp
                            </a>
                          )}
                          <button
                            onClick={() => eliminarComida(comida.id)}
                            className="ml-auto flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full text-[#B8B5C9] hover:text-[#FF4D8D] transition"
                            aria-label="Eliminar"
                          >
                            <Trash2 size={14} />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal agregar comida (hoja inferior en celular) */}
      {modalAbierto && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:px-6 z-[100]"
          onClick={() => setModalAbierto(false)}
        >
          <div
            className="modal-comida bg-[#241539] rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 w-full max-w-md border border-[#453A67]/40 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            onPaste={manejarPegado}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="fuente-elegante text-xl font-semibold">
                Nueva comida
              </h2>
              <button
                onClick={() => setModalAbierto(false)}
                className="opacity-70 hover:opacity-100 transition"
                aria-label="Cerrar"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nombre del plato o restaurante"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 bg-[#1B1033] border border-[#453A67]/40 outline-none focus:border-[#FF7EB6]/60 transition text-sm"
              />
              <input
                type="text"
                placeholder="Lugar (opcional)"
                value={lugar}
                onChange={(e) => setLugar(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 bg-[#1B1033] border border-[#453A67]/40 outline-none focus:border-[#FF7EB6]/60 transition text-sm"
              />

              {/* Foto: cámara, galería, pegar del portapapeles, o URL manual */}
              <div className="space-y-2">
                {previewFoto ? (
                  <div className="relative">
                    <img
                      src={previewFoto}
                      alt="Vista previa"
                      className="w-full h-40 object-cover rounded-xl"
                    />
                    {pegadoDetectado && (
                      <span className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 rounded-full px-2 py-1 text-[11px] text-white">
                        <ClipboardPaste size={12} />
                        Pegada
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={quitarFotoSeleccionada}
                      className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5 text-white hover:bg-black/80 transition"
                      aria-label="Quitar foto"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => inputCamaraRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-1.5 rounded-xl px-3 py-4 bg-[#1B1033] border border-dashed border-[#453A67]/60 hover:border-[#FF7EB6]/60 transition text-xs opacity-80"
                    >
                      <Camera size={20} />
                      Tomar foto
                    </button>
                    <button
                      type="button"
                      onClick={() => inputGaleriaRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-1.5 rounded-xl px-3 py-4 bg-[#1B1033] border border-dashed border-[#453A67]/60 hover:border-[#FF7EB6]/60 transition text-xs opacity-80"
                    >
                      <Images size={20} />
                      Elegir de galería
                    </button>
                  </div>
                )}

                {!previewFoto && (
                  <p className="text-center text-[11px] opacity-40">
                    También puedes pegar una imagen copiada (Ctrl+V)
                  </p>
                )}

                <input
                  ref={inputCamaraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={manejarSeleccionArchivo}
                  className="hidden"
                />
                <input
                  ref={inputGaleriaRef}
                  type="file"
                  accept="image/*"
                  onChange={manejarSeleccionArchivo}
                  className="hidden"
                />

                {!archivoFoto && (
                  <div className="flex items-center gap-2">
                    <ImageUp size={16} className="opacity-50 shrink-0" />
                    <input
                      type="text"
                      placeholder="...o pega una URL de foto"
                      value={foto}
                      onChange={(e) => setFoto(e.target.value)}
                      className="w-full rounded-xl px-4 py-2 bg-[#1B1033] border border-[#453A67]/40 outline-none focus:border-[#FF7EB6]/60 transition text-sm"
                    />
                  </div>
                )}
              </div>

              <textarea
                placeholder="Descripción (opcional)"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                className="w-full rounded-xl px-4 py-2.5 bg-[#1B1033] border border-[#453A67]/40 outline-none focus:border-[#FF7EB6]/60 transition text-sm resize-none"
              />

              <div className="flex items-center gap-2">
                <span className="text-sm opacity-70">Calificación:</span>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCalificacion(i + 1)}
                      aria-label={`${i + 1} estrellas`}
                    >
                      <Star
                        size={22}
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

              <div className="flex gap-2 pt-1">
                <Chip
                  activo={favorito}
                  onClick={() => setFavorito(!favorito)}
                  icon={<Heart size={14} className={favorito ? "fill-white" : ""} />}
                  label="Favorito"
                />
                <Chip
                  activo={visitado}
                  onClick={() => setVisitado(!visitado)}
                  icon={<CheckCircle2 size={14} />}
                  label="Visitado"
                />
                <Chip
                  activo={recomendada}
                  onClick={() => setRecomendada(!recomendada)}
                  icon={<ThumbsUp size={14} />}
                  label="Recomendada"
                />
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <Map size={16} className="opacity-50 shrink-0" />
                  <input
                    type="text"
                    placeholder="Enlace de Google Maps (opcional)"
                    value={enlaceMaps}
                    onChange={(e) => setEnlaceMaps(e.target.value)}
                    className="w-full rounded-xl px-4 py-2 bg-[#1B1033] border border-[#453A67]/40 outline-none focus:border-[#FF7EB6]/60 transition text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <ExternalLink size={16} className="opacity-50 shrink-0" />
                  <input
                    type="text"
                    placeholder="Enlace de Yelp (opcional)"
                    value={enlaceYelp}
                    onChange={(e) => setEnlaceYelp(e.target.value)}
                    className="w-full rounded-xl px-4 py-2 bg-[#1B1033] border border-[#453A67]/40 outline-none focus:border-[#FF7EB6]/60 transition text-sm"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={agregarComida}
              disabled={!nombre.trim() || guardando}
              className="w-full mt-6 bg-[#FF4D8D] hover:bg-[#E63A79] disabled:opacity-40 disabled:cursor-not-allowed transition rounded-full py-3 font-semibold tracking-wide text-white flex items-center justify-center gap-2"
            >
              {guardando && <Loader2 size={18} className="animate-spin" />}
              Guardar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export default Comidas;