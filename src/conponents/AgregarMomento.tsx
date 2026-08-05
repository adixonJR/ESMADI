import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ImagePlus, Loader2 } from "lucide-react";
import supabase from "../lib/supabase.js";

const EMOJIS_SUGERIDOS = ["📅", "💬", "☕", "❤️", "🎉", "📸", "💍", "✈️", "🎂", "🌙"];

function AgregarMomento() {
  const navigate = useNavigate();

  const [icono, setIcono] = useState("📅");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [fechaOrden, setFechaOrden] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [previsualizacion, setPrevisualizacion] = useState<string | null>(null);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const manejarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setArchivo(file);
    setPrevisualizacion(file ? URL.createObjectURL(file) : null);
  };

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!titulo.trim() || !descripcion.trim() || !fecha.trim()) {
      setError("Completa al menos el título, la descripción y la fecha.");
      return;
    }

    setGuardando(true);
    try {
      let imagenUrl: string | null = null;

      // 1. Si hay foto, se sube primero al bucket "momentos"
      if (archivo) {
        const extension = archivo.name.split(".").pop();
        const nombreArchivo = `${crypto.randomUUID()}.${extension}`;

        const { error: errorSubida } = await supabase.storage
          .from("momentos")
          .upload(nombreArchivo, archivo);

        if (errorSubida) throw errorSubida;

        const { data: urlPublica } = supabase.storage
          .from("momentos")
          .getPublicUrl(nombreArchivo);

        imagenUrl = urlPublica.publicUrl;
      }

      // 2. Se guarda el momento en la tabla
      const { error: errorInsert } = await supabase.from("momentos").insert({
        icono,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        fecha: fecha.trim(),
        fecha_orden: fechaOrden || null,
        imagen_url: imagenUrl,
      });

      if (errorInsert) throw errorInsert;

      navigate("/nosotros/timeline");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error al guardar.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1B1033] text-white pb-16">
      <div className="sticky top-0 z-20 bg-[#1B1033]/90 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <Link
          to="/nosotros/timeline"
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-lg font-bold leading-tight">Nuevo momento</h1>
          <p className="text-xs text-gray-400">Agrégalo a la línea del tiempo</p>
        </div>
      </div>

      <form
        onSubmit={manejarEnvio}
        className="max-w-lg mx-auto px-4 sm:px-6 mt-8 space-y-6"
      >
        {/* Icono */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-300">
            Icono
          </label>
          <div className="flex flex-wrap gap-2">
            {EMOJIS_SUGERIDOS.map((emoji) => (
              <button
                type="button"
                key={emoji}
                onClick={() => setIcono(emoji)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border transition ${
                  icono === emoji
                    ? "bg-pink-500 border-pink-500"
                    : "bg-white/10 border-white/10 hover:bg-white/20"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Título */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-300">
            Título
          </label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Primera cita"
            className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-pink-400"
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-300">
            Descripción
          </label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Cuenta cómo fue ese momento..."
            rows={4}
            className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-pink-400 resize-none"
          />
        </div>

        {/* Fecha mostrada */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-300">
            Fecha (como se mostrará)
          </label>
          <input
            type="text"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            placeholder="Ej: 10 Enero 2024"
            className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-pink-400"
          />
        </div>

        {/* Fecha real para ordenar */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-300">
            Fecha real (para ordenar los momentos)
          </label>
          <input
            type="date"
            value={fechaOrden}
            onChange={(e) => setFechaOrden(e.target.value)}
            className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-400 [color-scheme:dark]"
          />
        </div>

        {/* Foto */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-300">
            Foto (opcional)
          </label>
          <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-white/20 rounded-xl h-40 cursor-pointer hover:bg-white/5 transition overflow-hidden">
            {previsualizacion ? (
              <img
                src={previsualizacion}
                alt="Previsualización"
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                <ImagePlus className="text-gray-400" size={28} />
                <span className="text-sm text-gray-400">Toca para elegir una foto</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={manejarArchivo}
              className="hidden"
            />
          </label>
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={guardando}
          className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-60 transition rounded-full px-8 py-3 font-bold flex items-center justify-center gap-2"
        >
          {guardando && <Loader2 className="animate-spin" size={18} />}
          {guardando ? "Guardando..." : "Guardar momento"}
        </button>
      </form>
    </div>
  );
}

export default AgregarMomento;