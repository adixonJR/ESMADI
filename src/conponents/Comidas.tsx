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

// Nombre del bucket de Supabase Storage donde se guardan las fotos de comidas.
// Debe existir y ser público para que las imágenes se vean con getPublicUrl().
const BUCKET_FOTOS = "comidas";

function Comidas() {
  const [comidas, setComidas] = useState<Comida[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  // Id de la comida actualmente expandida en el grid (null = ninguna)
  const [comidaExpandidaId, setComidaExpandidaId] = useState<string | null>(
    null
  );

  const [nombre, setNombre] = useState("");
  const [lugar, setLugar] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [calificacion, setCalificacion] = useState(5);

  // Estados booleanos nuevos
  const [favorito, setFavorito] = useState(false);
  const [visitado, setVisitado] = useState(false);
  const [recomendada, setRecomendada] = useState(false);

  // Enlaces externos nuevos
  const [enlaceMaps, setEnlaceMaps] = useState("");
  const [enlaceYelp, setEnlaceYelp] = useState("");

  // Foto: puede venir de una URL pegada a mano, de un archivo subido desde el
  // celular (cámara o galería), o de una imagen pegada desde el portapapeles
  const [foto, setFoto] = useState("");
  const [archivoFoto, setArchivoFoto] = useState<File | null>(null);
  const [previewFoto, setPreviewFoto] = useState<string>("");
  const [pegadoDetectado, setPegadoDetectado] = useState(false);

  // Input para elegir de la galería (sin "capture", así el sistema muestra la galería)
  const inputGaleriaRef = useRef<HTMLInputElement>(null);
  // Input para tomar foto directamente con la cámara
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
    const { data, error } = await supabase
      .from("comidas")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error al cargar comidas:", error.message);
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

  // Función central: recibe un File (venga de galería, cámara o portapapeles)
  // y arma el preview + guarda el archivo para subirlo al confirmar
  const establecerArchivoFoto = (archivo: File, vienePegado = false) => {
    setArchivoFoto(archivo);
    setFoto(""); // si hay un archivo, la URL manual queda de lado
    if (previewFoto) URL.revokeObjectURL(previewFoto);
    setPreviewFoto(URL.createObjectURL(archivo));
    setPegadoDetectado(vienePegado);
  };

  const manejarSeleccionArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    establecerArchivoFoto(archivo);
  };

  // Detecta imágenes pegadas desde el portapapeles (Ctrl+V en desktop,
  // o pegar desde el menú de selección de texto en celular)
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

    let urlFoto = foto.trim() || null;

    if (archivoFoto) {
      const urlSubida = await subirFotoAStorage(archivoFoto);
      if (!urlSubida) {
        // Si falla la subida, se detiene el guardado para no perder la foto silenciosamente
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
    } else if (data) {
      setComidas((prev) => [data as Comida, ...prev]);
      limpiarFormulario();
      setModalAbierto(false);
    }
    setGuardando(false);
  };

  const eliminarComida = async (id: string) => {
    const anterior = comidas;
    setComidas((prev) => prev.filter((c) => c.id !== id));

    const { error } = await supabase.from("comidas").delete().eq("id", id);
    if (error) {
      console.error("Error al eliminar comida:", error.message);
      setComidas(anterior); // revertir si falla
    }
  };

  // Alterna la expansión de una tarjeta: si ya estaba expandida, la colapsa
  const alternarExpansion = (id: string) => {
    setComidaExpandidaId((actual) => (actual === id ? null : id));
  };

  // Chip reutilizable para los toggles de favorito/visitado/recomendada
  const Chip = ({
    activo,
    onClick,
    icon,
    label,
  }: {
    activo: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-xs font-medium border transition ${
        activo
          ? "bg-[#FF4D8D] border-[#FF4D8D] text-white"
          : "bg-[#1B1033] border-[#453A67]/40 text-white/60 hover:border-[#453A67]"
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <section className="px-6 py-10 min-h-screen">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap');
        .fuente-elegante { font-family: 'Playfair Display', Georgia, serif; }
      `}</style>

      {/* Volver */}
      <Link
        to="/nosotros"
        className="inline-flex items-center gap-2 text-sm opacity-70 hover:opacity-100 transition mb-6"
      >
        <ArrowLeft size={18} />
        Volver a Nosotros
      </Link>

      {/* Título */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-5">
          <div className="border border-[#FF7EB6]/40 p-5 rounded-full">
            <Utensils size={40} className="text-[#FF7EB6]" strokeWidth={1.5} />
          </div>
        </div>
        <h1 className="fuente-elegante text-4xl sm:text-5xl font-bold tracking-tight">
          Comidas
        </h1>
        <div className="w-14 h-px bg-[#B388FF]/60 mx-auto mt-4 mb-4" />
        <p className="text-sm sm:text-base tracking-wide opacity-70">
          Nuestros restaurantes y platos favoritos
        </p>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Botón agregar */}
        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center justify-center gap-2 w-full mb-8 bg-[#FF4D8D] hover:bg-[#E63A79] transition rounded-full py-3 font-semibold tracking-wide text-white"
        >
          <Plus size={20} />
          Agregar comida
        </button>

        {/* Cargando */}
        {cargando && (
          <div className="flex justify-center py-16 opacity-70">
            <Loader2 size={28} className="animate-spin" />
          </div>
        )}

        {/* Lista vacía */}
        {!cargando && comidas.length === 0 && (
          <div className="text-center rounded-3xl p-10 border border-[#453A67]/40 opacity-70">
            Todavía no agregaron ninguna comida. ¡Empiecen a guardar sus
            favoritas!
          </div>
        )}

        {/* Grid de comidas: siempre 2 columnas. Al tocar una tarjeta, se
            expande ocupando las 2 columnas (y muestra todo el detalle),
            mientras que las demás quedan en su versión compacta. */}
        {!cargando && (
          <div className="grid grid-cols-2 gap-4">
            {comidas.map((comida) => {
              const expandida = comidaExpandidaId === comida.id;

              return (
                <div
                  key={comida.id}
                  onClick={() => alternarExpansion(comida.id)}
                  className={`rounded-3xl p-5 border cursor-pointer transition-all duration-300 relative ${
                    expandida
                      ? "col-span-2 border-[#FF7EB6]/60"
                      : "border-[#453A67]/40 hover:border-[#FF7EB6]/50"
                  }`}
                >
                  {comida.foto && (
                    <div className="relative mb-4">
                      <img
                        src={comida.foto}
                        alt={comida.nombre}
                        className={`w-full object-cover rounded-2xl transition-all duration-300 ${
                          expandida ? "h-56" : "h-28"
                        }`}
                      />
                      {comida.favorito && (
                        <span className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5">
                          <Heart
                            size={16}
                            className="text-[#FF4D8D] fill-[#FF4D8D]"
                          />
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className={`fuente-elegante font-semibold flex items-center gap-1.5 ${
                        expandida ? "text-2xl" : "text-base"
                      }`}
                    >
                      {comida.nombre}
                      {!comida.foto && comida.favorito && (
                        <Heart
                          size={16}
                          className="text-[#FF4D8D] fill-[#FF4D8D] shrink-0"
                        />
                      )}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        eliminarComida(comida.id);
                      }}
                      className="text-[#B8B5C9] hover:text-[#FF4D8D] transition shrink-0"
                      aria-label="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {comida.lugar && (
                    <div className="flex items-center gap-1.5 mt-1 text-xs sm:text-sm text-[#B388FF]">
                      <MapPin size={14} />
                      {comida.lugar}
                    </div>
                  )}

                  <div className="flex gap-1 mt-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={
                          i < comida.calificacion
                            ? "text-[#FACC15] fill-[#FACC15]"
                            : "text-[#453A67]"
                        }
                      />
                    ))}
                  </div>

                  {/* El resto del detalle solo se muestra cuando la tarjeta
                      está expandida, para mantener el grid compacto en 2x2 */}
                  {expandida && (
                    <>
                      {(comida.visitado || comida.recomendada) && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {comida.visitado && (
                            <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-[#3B2A5E] text-[#B8B5C9]">
                              <CheckCircle2 size={12} />
                              Visitado
                            </span>
                          )}
                          {comida.recomendada && (
                            <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-[#3B2A5E] text-[#B8B5C9]">
                              <ThumbsUp size={12} />
                              Recomendada
                            </span>
                          )}
                        </div>
                      )}

                      {comida.descripcion && (
                        <p className="mt-3 text-sm leading-relaxed opacity-80">
                          {comida.descripcion}
                        </p>
                      )}

                      {(comida.enlace_maps || comida.enlace_yelp) && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {comida.enlace_maps && (
                            <a
                              href={comida.enlace_maps}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-[#453A67]/50 text-[#B388FF] hover:border-[#B388FF] transition"
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
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-[#453A67]/50 text-[#B388FF] hover:border-[#B388FF] transition"
                            >
                              <ExternalLink size={13} />
                              Yelp
                            </a>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal agregar comida */}
      {modalAbierto && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center px-6 z-[100]"
          onClick={() => setModalAbierto(false)}
        >
          <div
            className="bg-[#241539] rounded-3xl p-7 w-full max-w-md border border-[#453A67]/40 max-h-[90vh] overflow-y-auto"
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
                    También podés pegar una imagen copiada (Ctrl+V)
                  </p>
                )}

                {/* Input de cámara: capture fuerza la app de cámara en celulares */}
                <input
                  ref={inputCamaraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={manejarSeleccionArchivo}
                  className="hidden"
                />
                {/* Input de galería: sin capture, así el sistema muestra la galería/fototeca */}
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

              {/* Toggles: favorito / visitado / recomendada */}
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

              {/* Enlaces externos */}
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