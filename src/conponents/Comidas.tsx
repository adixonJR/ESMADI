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
  ImageUp,
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
}

// Nombre del bucket de Supabase Storage donde se guardan las fotos de comidas.
// Debe existir y ser público para que las imágenes se vean con getPublicUrl().
const BUCKET_FOTOS = "comidas";

function Comidas() {
  const [comidas, setComidas] = useState<Comida[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  const [nombre, setNombre] = useState("");
  const [lugar, setLugar] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [calificacion, setCalificacion] = useState(5);

  // Foto: puede venir de una URL pegada a mano o de un archivo subido desde el celular
  const [foto, setFoto] = useState("");
  const [archivoFoto, setArchivoFoto] = useState<File | null>(null);
  const [previewFoto, setPreviewFoto] = useState<string>("");

  const inputArchivoRef = useRef<HTMLInputElement>(null);

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
    setFoto("");
    setArchivoFoto(null);
    if (previewFoto) URL.revokeObjectURL(previewFoto);
    setPreviewFoto("");
    if (inputArchivoRef.current) inputArchivoRef.current.value = "";
  };

  const manejarSeleccionArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    setArchivoFoto(archivo);
    setFoto(""); // si eligen un archivo, la URL manual queda de lado
    if (previewFoto) URL.revokeObjectURL(previewFoto);
    setPreviewFoto(URL.createObjectURL(archivo));
  };

  const quitarFotoSeleccionada = () => {
    setArchivoFoto(null);
    if (previewFoto) URL.revokeObjectURL(previewFoto);
    setPreviewFoto("");
    if (inputArchivoRef.current) inputArchivoRef.current.value = "";
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

        {/* Grid de comidas */}
        {!cargando && (
          <div className="grid sm:grid-cols-2 gap-6">
            {comidas.map((comida) => (
              <div
                key={comida.id}
                className="rounded-3xl p-6 border border-[#453A67]/40 hover:border-[#FF7EB6]/50 transition"
              >
                {comida.foto && (
                  <img
                    src={comida.foto}
                    alt={comida.nombre}
                    className="w-full h-40 object-cover rounded-2xl mb-4"
                  />
                )}

                <div className="flex items-start justify-between gap-2">
                  <h3 className="fuente-elegante text-xl font-semibold">
                    {comida.nombre}
                  </h3>
                  <button
                    onClick={() => eliminarComida(comida.id)}
                    className="text-[#B8B5C9] hover:text-[#FF4D8D] transition shrink-0"
                    aria-label="Eliminar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {comida.lugar && (
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-[#B388FF]">
                    <MapPin size={14} />
                    {comida.lugar}
                  </div>
                )}

                <div className="flex gap-1 mt-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={
                        i < comida.calificacion
                          ? "text-[#FACC15] fill-[#FACC15]"
                          : "text-[#453A67]"
                      }
                    />
                  ))}
                </div>

                {comida.descripcion && (
                  <p className="mt-3 text-sm leading-relaxed opacity-80">
                    {comida.descripcion}
                  </p>
                )}
              </div>
            ))}
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
            className="bg-[#241539] rounded-3xl p-7 w-full max-w-md border border-[#453A67]/40"
            onClick={(e) => e.stopPropagation()}
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

              {/* Foto: subir desde el celular o pegar una URL */}
              <div className="space-y-2">
                {previewFoto ? (
                  <div className="relative">
                    <img
                      src={previewFoto}
                      alt="Vista previa"
                      className="w-full h-40 object-cover rounded-xl"
                    />
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
                  <button
                    type="button"
                    onClick={() => inputArchivoRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 bg-[#1B1033] border border-dashed border-[#453A67]/60 hover:border-[#FF7EB6]/60 transition text-sm opacity-80"
                  >
                    <Camera size={18} />
                    Tomar foto o elegir de la galería
                  </button>
                )}

                <input
                  ref={inputArchivoRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
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