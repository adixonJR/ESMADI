import { useEffect, useState } from "react";
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
} from "lucide-react";
import supabase from "../lib/supabase.js";

interface Carta {
  id: string;
  autor: string;
  titulo: string;
  contenido: string;
  fecha: string; // ISO string (columna "fecha" en Supabase)
}

// Cambia estos dos nombres por los suyos ✏️
const AUTORES = ["Yo", "Tú"];

function formatearFecha(iso: string) {
  const f = new Date(iso);
  return f.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function Cartas() {
  const [cartas, setCartas] = useState<Carta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [autorSeleccionado, setAutorSeleccionado] = useState(AUTORES[0]);
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [filtro, setFiltro] = useState<string | "Todos">("Todos");

  // Cargar cartas desde Supabase
  const cargarCartas = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from("cartas")
      .select("*")
      .order("fecha", { ascending: false });

    if (error) {
      setError("No se pudieron cargar las cartas.");
      console.error(error);
    } else {
      setCartas(data as Carta[]);
      setError(null);
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarCartas();

    // Suscripción en tiempo real: si tu pareja escribe una carta,
    // aparece automáticamente sin recargar la página.
    const canal = supabase
      .channel("cartas-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cartas" },
        () => {
          cargarCartas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  const enviarCarta = async () => {
    if (!titulo.trim() || !contenido.trim()) return;

    setEnviando(true);
    const { error } = await supabase.from("cartas").insert({
      autor: autorSeleccionado,
      titulo: titulo.trim(),
      contenido: contenido.trim(),
    });

    if (error) {
      setError("No se pudo guardar la carta. Intenta de nuevo.");
      console.error(error);
    } else {
      setTitulo("");
      setContenido("");
      setMostrarForm(false);
      setError(null);
      cargarCartas();
    }
    setEnviando(false);
  };

  const eliminarCarta = async (id: string) => {
    // Optimista: la quitamos de la vista de inmediato
    setCartas((prev) => prev.filter((c) => c.id !== id));

    const { error } = await supabase.from("cartas").delete().eq("id", id);
    if (error) {
      console.error(error);
      cargarCartas(); // revertir si falló
    }
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
        <h1 className="text-4xl font-bold">Cartas 💌</h1>
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

        {/* Formulario */}
        {mostrarForm && (
          <div className="bg-white/10 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Heart size={22} className="text-pink-400 fill-pink-400" />
                Nueva carta
              </h2>
              <button
                onClick={() => setMostrarForm(false)}
                className="text-gray-300 hover:text-white transition"
              >
                <X size={22} />
              </button>
            </div>

            {/* Selector de autor */}
            <div className="flex gap-2">
              {AUTORES.map((nombre) => (
                <button
                  key={nombre}
                  onClick={() => setAutorSeleccionado(nombre)}
                  className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${
                    autorSeleccionado === nombre
                      ? "bg-purple-500 text-white"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  Escribo como {nombre}
                </button>
              ))}
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

        {/* Lista de cartas */}
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
            cartasFiltradas.map((carta) => (
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
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}

export default Cartas;