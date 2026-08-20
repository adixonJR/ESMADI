import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  Heart,
  PlusCircle,
  Trash2,
  ArrowLeft,
  Send,
  X,
  Loader2,
  MessageCircle,
  ImagePlus,
  ChevronDown,
  ChevronUp,
  CornerDownRight,
} from "lucide-react";
import supabase from "../lib/supabase.js";

interface Carta {
  id: string;
  autor: string;
  titulo: string;
  contenido: string;
  fecha: string;
  imagen_url: string | null;
}

interface Respuesta {
  id: string;
  carta_id: string;
  parent_id: string | null;
  autor: string;
  contenido: string;
  imagen_url: string | null;
  fecha: string;
  hijos?: Respuesta[];
}

interface Reaccion {
  id: string;
  carta_id: string | null;
  respuesta_id: string | null;
  autor: string;
  emoji: string;
}

// Cambia estos dos nombres por los suyos ✏️
const AUTORES = ["Esmeralda", "Adixon"];
const EMOJIS = ["❤️", "😂", "😢", "😮", "👍", "🔥"];
const BUCKET = "cartas-imagenes";

function formatearFecha(iso: string) {
  const f = new Date(iso);
  return f.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatearFechaCorta(iso: string) {
  const f = new Date(iso);
  return f.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}

// Sube una imagen al bucket y devuelve su URL pública
async function subirImagen(file: File): Promise<string | null> {
  const ext = file.name.split(".").pop();
  const nombre = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(nombre, file);
  if (error) {
    console.error(error);
    return null;
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(nombre);
  return data.publicUrl;
}

// Agrupa las reacciones por emoji para un item dado
function agruparReacciones(reacciones: Reaccion[]) {
  const grupos: Record<string, { count: number; autores: string[] }> = {};
  for (const r of reacciones) {
    if (!grupos[r.emoji]) grupos[r.emoji] = { count: 0, autores: [] };
    grupos[r.emoji].count += 1;
    grupos[r.emoji].autores.push(r.autor);
  }
  return grupos;
}

// Convierte una lista plana de respuestas en un árbol por parent_id
function construirArbol(respuestas: Respuesta[]): Respuesta[] {
  const mapa: Record<string, Respuesta> = {};
  respuestas.forEach((r) => (mapa[r.id] = { ...r, hijos: [] }));
  const raiz: Respuesta[] = [];
  respuestas.forEach((r) => {
    if (r.parent_id && mapa[r.parent_id]) {
      mapa[r.parent_id].hijos!.push(mapa[r.id]);
    } else {
      raiz.push(mapa[r.id]);
    }
  });
  return raiz;
}

// ---------- Selector de imagen reutilizable ----------
function SelectorImagen({
  archivo,
  onSeleccionar,
  onQuitar,
}: {
  archivo: File | null;
  onSeleccionar: (f: File) => void;
  onQuitar: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!archivo) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(archivo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSeleccionar(f);
          e.target.value = "";
        }}
      />
      {preview ? (
        <div className="relative inline-block mt-2">
          <img
            src={preview}
            alt="preview"
            className="max-h-40 rounded-xl border border-white/10"
          />
          <button
            onClick={onQuitar}
            className="absolute -top-2 -right-2 bg-black/70 rounded-full p-1 hover:bg-black transition"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1 text-sm text-gray-300 hover:text-pink-400 transition mt-1"
        >
          <ImagePlus size={16} />
          Agregar imagen
        </button>
      )}
    </div>
  );
}

// ---------- Barra de reacciones reutilizable ----------
function BarraReacciones({
  reacciones,
  usuarioActual,
  onToggle,
}: {
  reacciones: Reaccion[];
  usuarioActual: string;
  onToggle: (emoji: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const grupos = agruparReacciones(reacciones);
  const emojisConReaccion = Object.keys(grupos);

  return (
    <div className="relative flex items-center gap-1 flex-wrap">
      {emojisConReaccion.map((emoji) => {
        const yoReacciones = grupos[emoji].autores.includes(usuarioActual);
        return (
          <button
            key={emoji}
            onClick={() => onToggle(emoji)}
            title={grupos[emoji].autores.join(", ")}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold transition border ${
              yoReacciones
                ? "bg-pink-500/30 border-pink-400 text-pink-200"
                : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
            }`}
          >
            <span>{emoji}</span>
            <span>{grupos[emoji].count}</span>
          </button>
        );
      })}

      <div className="relative">
        <button
          onClick={() => setAbierto((v) => !v)}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition text-sm"
        >
          +
        </button>
        {abierto && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setAbierto(false)}
            />
            <div className="absolute bottom-full left-0 mb-2 bg-[#1c1425] border border-white/10 rounded-2xl p-2 flex gap-1 z-20 shadow-xl">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onToggle(emoji);
                    setAbierto(false);
                  }}
                  className="text-lg hover:scale-125 transition"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------- Nodo de respuesta (recursivo, permite hilos anidados) ----------
function NodoRespuesta({
  respuesta,
  cartaId,
  usuarioActual,
  reaccionesPorItem,
  onToggleReaccion,
  onResponder,
  onEliminar,
  nivel,
}: {
  respuesta: Respuesta;
  cartaId: string;
  usuarioActual: string;
  reaccionesPorItem: Record<string, Reaccion[]>;
  onToggleReaccion: (respuestaId: string, emoji: string) => void;
  onResponder: (parentId: string, autor: string, contenido: string, imagen: File | null) => Promise<void>;
  onEliminar: (id: string) => void;
  nivel: number;
}) {
  const [respondiendo, setRespondiendo] = useState(false);
  const [autor, setAutor] = useState(usuarioActual);
  const [texto, setTexto] = useState("");
  const [imagen, setImagen] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [colapsado, setColapsado] = useState(false);

  const hijos = respuesta.hijos ?? [];

  const enviar = async () => {
    if (!texto.trim()) return;
    setEnviando(true);
    await onResponder(respuesta.id, autor, texto.trim(), imagen);
    setTexto("");
    setImagen(null);
    setRespondiendo(false);
    setEnviando(false);
  };

  return (
    <div className={nivel > 0 ? "pl-4 border-l border-white/10 mt-3" : "mt-3"}>
      <div className="bg-white/5 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-purple-500/20 text-purple-300 text-xs font-semibold px-2 py-0.5 rounded-full">
              {respuesta.autor}
            </span>
            <span className="text-xs text-gray-400">
              {formatearFechaCorta(respuesta.fecha)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {hijos.length > 0 && (
              <button
                onClick={() => setColapsado((v) => !v)}
                className="text-gray-400 hover:text-white transition"
              >
                {colapsado ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
            )}
            <button
              onClick={() => onEliminar(respuesta.id)}
              className="text-gray-500 hover:text-red-400 transition"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <p className="text-gray-200 text-sm mt-2 whitespace-pre-wrap">
          {respuesta.contenido}
        </p>

        {respuesta.imagen_url && (
          <img
            src={respuesta.imagen_url}
            alt="imagen de respuesta"
            className="mt-2 max-h-56 rounded-xl border border-white/10"
          />
        )}

        <div className="flex items-center justify-between mt-3">
          <BarraReacciones
            reacciones={reaccionesPorItem[respuesta.id] ?? []}
            usuarioActual={usuarioActual}
            onToggle={(emoji) => onToggleReaccion(respuesta.id, emoji)}
          />
          <button
            onClick={() => setRespondiendo((v) => !v)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-pink-300 transition"
          >
            <CornerDownRight size={14} />
            Responder
          </button>
        </div>

        {respondiendo && (
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              {AUTORES.map((nombre) => (
                <button
                  key={nombre}
                  onClick={() => setAutor(nombre)}
                  className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition ${
                    autor === nombre
                      ? "bg-purple-500 text-white"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  {nombre}
                </button>
              ))}
            </div>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escribe tu respuesta..."
              rows={2}
              className="w-full bg-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-pink-400 resize-none"
            />
            <div className="flex items-center justify-between">
              <SelectorImagen
                archivo={imagen}
                onSeleccionar={setImagen}
                onQuitar={() => setImagen(null)}
              />
              <button
                onClick={enviar}
                disabled={!texto.trim() || enviando}
                className="flex items-center gap-1 bg-pink-500 hover:bg-pink-600 disabled:opacity-40 transition rounded-full px-4 py-1.5 text-xs font-bold"
              >
                {enviando ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                Enviar
              </button>
            </div>
          </div>
        )}
      </div>

      {!colapsado &&
        hijos.map((hijo) => (
          <NodoRespuesta
            key={hijo.id}
            respuesta={hijo}
            cartaId={cartaId}
            usuarioActual={usuarioActual}
            reaccionesPorItem={reaccionesPorItem}
            onToggleReaccion={onToggleReaccion}
            onResponder={onResponder}
            onEliminar={onEliminar}
            nivel={nivel + 1}
          />
        ))}
    </div>
  );
}

function Cartas() {
  const [cartas, setCartas] = useState<Carta[]>([]);
  const [respuestas, setRespuestas] = useState<Record<string, Respuesta[]>>({});
  const [reacciones, setReacciones] = useState<Record<string, Reaccion[]>>({});
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [usuarioActual] = useState(AUTORES[0]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [imagenNueva, setImagenNueva] = useState<File | null>(null);
  const [filtro, setFiltro] = useState<string | "Todos">("Todos");
  const [expandido, setExpandido] = useState<Record<string, boolean>>({});
  const [respondiendoCarta, setRespondiendoCarta] = useState<string | null>(null);
  const [textoRespuesta, setTextoRespuesta] = useState("");
  const [imagenRespuesta, setImagenRespuesta] = useState<File | null>(null);
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);

  const cargarTodo = async () => {
    setCargando(true);
    const [{ data: cartasData, error: errCartas }, { data: respData }, { data: reacData }] =
      await Promise.all([
        supabase.from("cartas").select("*").order("fecha", { ascending: false }),
        supabase.from("respuestas").select("*").order("fecha", { ascending: true }),
        supabase.from("reacciones").select("*"),
      ]);

    if (errCartas) {
      setError("No se pudieron cargar las cartas.");
      console.error(errCartas);
    } else {
      setCartas((cartasData ?? []) as Carta[]);
      setError(null);
    }

    const respAgrupadas: Record<string, Respuesta[]> = {};
    (respData ?? []).forEach((r: Respuesta) => {
      if (!respAgrupadas[r.carta_id]) respAgrupadas[r.carta_id] = [];
      respAgrupadas[r.carta_id].push(r);
    });
    setRespuestas(respAgrupadas);

    const reacAgrupadas: Record<string, Reaccion[]> = {};
    (reacData ?? []).forEach((r: Reaccion) => {
      const clave = r.carta_id ?? r.respuesta_id!;
      if (!reacAgrupadas[clave]) reacAgrupadas[clave] = [];
      reacAgrupadas[clave].push(r);
    });
    setReacciones(reacAgrupadas);

    setCargando(false);
  };

  useEffect(() => {
    cargarTodo();

    const canal = supabase
      .channel("cartas-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "cartas" }, cargarTodo)
      .on("postgres_changes", { event: "*", schema: "public", table: "respuestas" }, cargarTodo)
      .on("postgres_changes", { event: "*", schema: "public", table: "reacciones" }, cargarTodo)
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  const enviarCarta = async () => {
    if (!titulo.trim() || !contenido.trim()) return;
    setEnviando(true);

    let imagen_url: string | null = null;
    if (imagenNueva) {
      imagen_url = await subirImagen(imagenNueva);
    }

    const { error } = await supabase.from("cartas").insert({
      autor: usuarioActual,
      titulo: titulo.trim(),
      contenido: contenido.trim(),
      imagen_url,
    });

    if (error) {
      setError("No se pudo guardar la carta. Intenta de nuevo.");
      console.error(error);
    } else {
      setTitulo("");
      setContenido("");
      setImagenNueva(null);
      setMostrarForm(false);
      setError(null);
      cargarTodo();
    }
    setEnviando(false);
  };

  const eliminarCarta = async (id: string) => {
    setCartas((prev) => prev.filter((c) => c.id !== id));
    const { error } = await supabase.from("cartas").delete().eq("id", id);
    if (error) {
      console.error(error);
      cargarTodo();
    }
  };

  const enviarRespuestaDeCarta = async (cartaId: string) => {
    if (!textoRespuesta.trim()) return;
    setEnviandoRespuesta(true);

    let imagen_url: string | null = null;
    if (imagenRespuesta) {
      imagen_url = await subirImagen(imagenRespuesta);
    }

    const { error } = await supabase.from("respuestas").insert({
      carta_id: cartaId,
      parent_id: null,
      autor: usuarioActual,
      contenido: textoRespuesta.trim(),
      imagen_url,
    });

    if (error) console.error(error);
    setTextoRespuesta("");
    setImagenRespuesta(null);
    setRespondiendoCarta(null);
    setEnviandoRespuesta(false);
    cargarTodo();
  };

  const responderAHilo = async (
    parentId: string,
    autor: string,
    contenido: string,
    imagen: File | null
  ) => {
    let imagen_url: string | null = null;
    if (imagen) imagen_url = await subirImagen(imagen);

    const cartaId = Object.keys(respuestas).find((cId) =>
      respuestas[cId].some((r) => r.id === parentId)
    );

    const { error } = await supabase.from("respuestas").insert({
      carta_id: cartaId,
      parent_id: parentId,
      autor,
      contenido,
      imagen_url,
    });
    if (error) console.error(error);
    cargarTodo();
  };

  const eliminarRespuesta = async (id: string) => {
    const { error } = await supabase.from("respuestas").delete().eq("id", id);
    if (error) console.error(error);
    cargarTodo();
  };

  const toggleReaccionCarta = async (cartaId: string, emoji: string) => {
    const existentes = reacciones[cartaId] ?? [];
    const mia = existentes.find((r) => r.autor === usuarioActual && r.emoji === emoji);

    if (mia) {
      await supabase.from("reacciones").delete().eq("id", mia.id);
    } else {
      await supabase.from("reacciones").insert({
        carta_id: cartaId,
        autor: usuarioActual,
        emoji,
      });
    }
    cargarTodo();
  };

  const toggleReaccionRespuesta = async (respuestaId: string, emoji: string) => {
    const existentes = reacciones[respuestaId] ?? [];
    const mia = existentes.find((r) => r.autor === usuarioActual && r.emoji === emoji);

    if (mia) {
      await supabase.from("reacciones").delete().eq("id", mia.id);
    } else {
      await supabase.from("reacciones").insert({
        respuesta_id: respuestaId,
        autor: usuarioActual,
        emoji,
      });
    }
    cargarTodo();
  };

  const cartasFiltradas =
    filtro === "Todos" ? cartas : cartas.filter((c) => c.autor === filtro);

  return (
    <section className="px-6 py-10">
      {/* Titulo */}
      <div className="text-center mb-10 relative max-w-5xl mx-auto">
        <Link
          to="/nosotros"
          className="absolute left-0 top-2 flex items-center gap-1 text-gray-300 hover:text-white transition text-sm"
        >
          <ArrowLeft size={18} />
          Volver
        </Link>
        <div className="flex justify-center mb-4">
          <div className="bg-pink-500/20 p-5 rounded-full">
            <Mail size={50} className="text-pink-400" />
          </div>
        </div>
        <h1 className="text-4xl font-bold">Cartas</h1>
        <p className="text-gray-300 mt-3">
          Un espacio para escribirnos lo que sentimos
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {error && (
          <div className="bg-red-500/20 text-red-300 text-sm rounded-2xl px-4 py-3 text-center">
            {error}
          </div>
        )}


        {/* Filtros por autor */}
        <div className="flex justify-center gap-2 flex-wrap">
          {["Todos", ...AUTORES].map((nombre) => (
            <button
              key={nombre}
              onClick={() => setFiltro(nombre as string)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                filtro === nombre
                  ? "bg-pink-500 text-white"
                  : "bg-white/10 text-gray-300 hover:bg-white/20"
              }`}
            >
              {nombre}
            </button>
          ))}
        </div>

        {/* Botón nueva carta */}
        {!mostrarForm && (
          <button
            onClick={() => setMostrarForm(true)}
            className="w-full flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-600 transition rounded-full py-3 font-bold"
          >
            <PlusCircle size={20} />
            Escribir una carta
          </button>
        )}

        {/* Formulario nueva carta */}
        {mostrarForm && (
          <div className="bg-white/10 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Heart size={22} className="text-pink-400 fill-pink-400" />
                Nueva carta — escribes como {usuarioActual}
              </h2>
              <button
                onClick={() => setMostrarForm(false)}
                className="text-gray-300 hover:text-white transition"
              >
                <X size={22} />
              </button>
            </div>

            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título de tu carta..."
              className="w-full bg-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-pink-400"
            />

            <textarea
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              placeholder="Escribe lo que sientes..."
              rows={6}
              className="w-full bg-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-pink-400 resize-none"
            />

            <SelectorImagen
              archivo={imagenNueva}
              onSeleccionar={setImagenNueva}
              onQuitar={() => setImagenNueva(null)}
            />

            <button
              onClick={enviarCarta}
              disabled={!titulo.trim() || !contenido.trim() || enviando}
              className="w-full flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed transition rounded-full py-3 font-bold"
            >
              {enviando ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
              {enviando ? "Guardando..." : "Guardar carta"}
            </button>
          </div>
        )}

        {/* Feed de cartas */}
        <div className="space-y-4">
          {cargando && (
            <div className="flex justify-center py-10 text-gray-400">
              <Loader2 size={28} className="animate-spin" />
            </div>
          )}

          {!cargando && cartasFiltradas.length === 0 && (
            <div className="text-center text-gray-400 py-10">
              Todavía no hay cartas aquí. Escribe la primera ❤️
            </div>
          )}

          {!cargando &&
            cartasFiltradas.map((carta) => {
              const hilos = construirArbol(respuestas[carta.id] ?? []);
              const totalRespuestas = (respuestas[carta.id] ?? []).length;
              const estaExpandido = expandido[carta.id];

              return (
                <div
                  key={carta.id}
                  className="bg-white/10 rounded-3xl p-6 relative group"
                >
                  <button
                    onClick={() => eliminarCarta(carta.id)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                    aria-label="Eliminar carta"
                  >
                    <Trash2 size={18} />
                  </button>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-pink-500/20 text-pink-300 text-xs font-semibold px-3 py-1 rounded-full">
                      {carta.autor}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatearFecha(carta.fecha)}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold mb-2">{carta.titulo}</h3>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {carta.contenido}
                  </p>

                  {carta.imagen_url && (
                    <img
                      src={carta.imagen_url}
                      alt={carta.titulo}
                      className="mt-4 rounded-2xl max-h-96 w-full object-cover border border-white/10"
                    />
                  )}

                  {/* Reacciones + responder + ver hilo */}
                  <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
                    <BarraReacciones
                      reacciones={reacciones[carta.id] ?? []}
                      usuarioActual={usuarioActual}
                      onToggle={(emoji) => toggleReaccionCarta(carta.id, emoji)}
                    />

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          setRespondiendoCarta(
                            respondiendoCarta === carta.id ? null : carta.id
                          )
                        }
                        className="flex items-center gap-1 text-sm text-gray-300 hover:text-pink-300 transition"
                      >
                        <CornerDownRight size={16} />
                        Responder
                      </button>
                      {totalRespuestas > 0 && (
                        <button
                          onClick={() =>
                            setExpandido((prev) => ({
                              ...prev,
                              [carta.id]: !prev[carta.id],
                            }))
                          }
                          className="flex items-center gap-1 text-sm text-gray-300 hover:text-white transition"
                        >
                          <MessageCircle size={16} />
                          {totalRespuestas}{" "}
                          {totalRespuestas === 1 ? "respuesta" : "respuestas"}
                          {estaExpandido ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Formulario de respuesta directa a la carta */}
                  {respondiendoCarta === carta.id && (
                    <div className="mt-4 bg-white/5 rounded-2xl p-4 space-y-2">
                      <textarea
                        value={textoRespuesta}
                        onChange={(e) => setTextoRespuesta(e.target.value)}
                        placeholder={`Responder como ${usuarioActual}...`}
                        rows={3}
                        className="w-full bg-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-pink-400 resize-none"
                      />
                      <div className="flex items-center justify-between">
                        <SelectorImagen
                          archivo={imagenRespuesta}
                          onSeleccionar={setImagenRespuesta}
                          onQuitar={() => setImagenRespuesta(null)}
                        />
                        <button
                          onClick={() => enviarRespuestaDeCarta(carta.id)}
                          disabled={!textoRespuesta.trim() || enviandoRespuesta}
                          className="flex items-center gap-1 bg-pink-500 hover:bg-pink-600 disabled:opacity-40 transition rounded-full px-4 py-1.5 text-xs font-bold"
                        >
                          {enviandoRespuesta ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Send size={14} />
                          )}
                          Enviar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Hilo de respuestas */}
                  {estaExpandido && hilos.length > 0 && (
                    <div className="mt-2">
                      {hilos.map((hilo) => (
                        <NodoRespuesta
                          key={hilo.id}
                          respuesta={hilo}
                          cartaId={carta.id}
                          usuarioActual={usuarioActual}
                          reaccionesPorItem={reacciones}
                          onToggleReaccion={toggleReaccionRespuesta}
                          onResponder={responderAHilo}
                          onEliminar={eliminarRespuesta}
                          nivel={0}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </section>
  );
}

export default Cartas;