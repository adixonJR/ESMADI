import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from "react";
import { Link } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import {
  Search,
  X,
  Home,
  Plus,
  Heart,
  User,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";

// ---------- Cliente Supabase ----------
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface Foto {
  id: string;
  image_path: string | null;
  imagen_url?: string; // url publica calculada en el cliente
  descripcion: string;
  tags: string[];
  alto: "s" | "m" | "l";
  favorito: boolean;
  created_at: string;
}

const alturaClase: Record<Foto["alto"], string> = {
  s: "row-span-2",
  m: "row-span-3",
  l: "row-span-4",
};

const alturasCiclo: Foto["alto"][] = ["s", "m", "l", "m"];

// Etiquetas sugeridas que aparecen siempre en la lupa
const ETIQUETAS_SUGERIDAS = [
  "#comida",
  "#playa",
  "#cine",
  "#viajes",
  "#paseo",
  "#cumpleaños",
  "#familia",
  "#atardecer",
  "#fiesta",
  "#mascotas",
  "#musica",
  "#aniversario",
];

function extraerTags(texto: string): string[] {
  const encontrados = texto.match(/#[\p{L}0-9_]+/gu) || [];
  return Array.from(new Set(encontrados.map((t) => t.toLowerCase())));
}

function urlFoto(path: string | null) {
  if (!path) return undefined;
  return supabase.storage.from("fotos").getPublicUrl(path).data.publicUrl;
}

// ---------- Animacion del libro: constantes ----------
type Fase = "cerrado" | "abriendo" | "zoom" | "fin";

const EASE_LIBRO = "cubic-bezier(0.45, 0.05, 0.25, 1)";
const DURACION_TAPA = 1300;
const DURACION_HOJA = 950;

const PAPEL =
  "linear-gradient(90deg, #cfc4aa 0%, #efe6cf 7%, #faf5e6 40%, #f6efdb 100%)";
const LINEAS =
  "repeating-linear-gradient(180deg, transparent 0px, transparent 23px, rgba(120,100,70,0.10) 23px, rgba(120,100,70,0.10) 24px)";
const CUERO =
  "linear-gradient(135deg, #4a2d7a 0%, #2d1a52 55%, #1B1033 100%)";

const cara: CSSProperties = {
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  backfaceVisibility: "hidden",
  WebkitBackfaceVisibility: "hidden",
};

// Hoja de papel que se voltea (anverso + reverso con sombreado segun el giro)
function Hoja({
  abierto,
  retraso,
  angulo,
  zCerrado,
  zAbierto,
}: {
  abierto: boolean;
  retraso: number;
  angulo: number;
  zCerrado: number;
  zAbierto: number;
}) {
  const t = `${DURACION_HOJA}ms ${EASE_LIBRO} ${retraso}ms`;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transformOrigin: "left center",
        transformStyle: "preserve-3d",
        transform: abierto
          ? `translateZ(${zAbierto}px) rotateY(${angulo}deg)`
          : `translateZ(${zCerrado}px) rotateY(0deg)`,
        transition: `transform ${t}`,
      }}
    >
      {/* Anverso */}
      <div style={{ ...cara, background: PAPEL, borderRadius: "0 6px 6px 0" }}>
        <div
          style={{
            position: "absolute",
            inset: "18px 14px 18px 22px",
            background: LINEAS,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(20,10,35,0.55)",
            opacity: abierto ? 1 : 0,
            transition: `opacity ${t}`,
          }}
        />
      </div>

      {/* Reverso */}
      <div
        style={{
          ...cara,
          background: PAPEL,
          borderRadius: "0 6px 6px 0",
          transform: "rotateY(180deg)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "18px 14px 18px 22px",
            background: LINEAS,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(20,10,35,0.55)",
            opacity: abierto ? 0 : 1,
            transition: `opacity ${t}`,
          }}
        />
      </div>
    </div>
  );
}

function Album() {
  // Fase de la animacion: cerrado -> abriendo -> zoom -> fin
  const [fase, setFase] = useState<Fase>("cerrado");

  useEffect(() => {
    const t1 = setTimeout(
      () => setFase((p) => (p === "cerrado" ? "abriendo" : p)),
      450
    );
    const t2 = setTimeout(
      () => setFase((p) => (p === "abriendo" ? "zoom" : p)),
      2400
    );
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    if (fase !== "zoom") return;
    const t = setTimeout(() => setFase("fin"), 1300);
    return () => clearTimeout(t);
  }, [fase]);

  const abierto = fase !== "cerrado";
  const zoom = fase === "zoom" || fase === "fin";
  const listo = zoom;

  const transformLibro = zoom
    ? "translateX(50%) rotateX(0deg) rotateZ(0deg) translateZ(1050px)"
    : abierto
    ? "translateX(50%) rotateX(16deg) rotateZ(0deg) translateZ(0px)"
    : "translateX(0%) rotateX(26deg) rotateZ(-3deg) translateZ(0px)";

  const transicionLibro = zoom
    ? "transform 1000ms cubic-bezier(0.55, 0.05, 0.75, 0.45)"
    : `transform 1700ms ${EASE_LIBRO}`;

  // ---------- Fotos (compartidas en Supabase) ----------
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      const { data, error } = await supabase
        .from("album")
        .select("*")
        .order("created_at", { ascending: false });

      if (cancelado) return;

      if (!error && data) {
        setFotos(
          data.map((f) => ({
            ...f,
            tags: f.tags ?? [],
            imagen_url: urlFoto(f.image_path),
          }))
        );
      }
      setCargando(false);
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, []);

  // ---------- Busqueda ----------
  const [busqueda, setBusqueda] = useState("");
  const [busquedaAbierta, setBusquedaAbierta] = useState(false);
  const [soloFavoritos, setSoloFavoritos] = useState(false);

  const fotosFiltradas = useMemo(() => {
    let base = fotos;

    if (soloFavoritos) {
      base = base.filter((f) => f.favorito);
    }

    const q = busqueda.trim().toLowerCase();
    if (!q) return base;
    const qConNumeral = q.startsWith("#") ? q : `#${q}`;
    return base.filter(
      (f) =>
        f.tags.some((t) => t.includes(qConNumeral) || t.includes(q)) ||
        f.descripcion.toLowerCase().includes(q)
    );
  }, [fotos, busqueda, soloFavoritos]);

  // Etiquetas que ya existen en el album (con cantidad de fotos)
  const etiquetasAlbum = useMemo(() => {
    const conteo = new Map<string, number>();
    fotos.forEach((f) =>
      f.tags.forEach((t) => conteo.set(t, (conteo.get(t) ?? 0) + 1))
    );
    return Array.from(conteo.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
  }, [fotos]);

  // Sugeridas que todavia no estan en el album
  const etiquetasSugeridas = useMemo(() => {
    const usadas = new Set(etiquetasAlbum.map(([t]) => t));
    return ETIQUETAS_SUGERIDAS.filter((t) => !usadas.has(t));
  }, [etiquetasAlbum]);

  function elegirEtiqueta(t: string) {
    setBusqueda(t);
    setBusquedaAbierta(false);
  }

  const chipClase = (activa: boolean) =>
    `text-sm px-3 py-1.5 rounded-full border transition ${
      activa
        ? "bg-pink-500 border-pink-400 text-white"
        : "bg-white/10 border-white/10 text-pink-300 hover:bg-pink-500/25"
    }`;

  const busquedaNormalizada = busqueda.trim().toLowerCase();

  // ---------- Modal para agregar foto ----------
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nuevoArchivo, setNuevoArchivo] = useState<File | null>(null);
  const [nuevaPreview, setNuevaPreview] = useState<string | null>(null);
  const [nuevaDescripcion, setNuevaDescripcion] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [errorSubida, setErrorSubida] = useState<string | null>(null);

  const tagsDetectados = useMemo(
    () => extraerTags(nuevaDescripcion),
    [nuevaDescripcion]
  );

  function manejarImagen(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setNuevoArchivo(archivo);
    setNuevaPreview(URL.createObjectURL(archivo));
  }

  async function guardarFoto() {
    if (!nuevoArchivo && !nuevaDescripcion.trim()) return;
    setSubiendo(true);
    setErrorSubida(null);

    try {
      let image_path: string | null = null;

      if (nuevoArchivo) {
        const ext = nuevoArchivo.name.split(".").pop();
        const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
        const { error: subeError } = await supabase.storage
          .from("fotos")
          .upload(path, nuevoArchivo);
        if (subeError) throw subeError;
        image_path = path;
      }

      const { data, error: insertError } = await supabase
        .from("album")
        .insert({
          image_path,
          descripcion: nuevaDescripcion.replace(/#[\p{L}0-9_]+/gu, "").trim(),
          tags: tagsDetectados,
          alto: alturasCiclo[fotos.length % alturasCiclo.length],
          favorito: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setFotos((prev) => [
        { ...data, tags: data.tags ?? [], imagen_url: urlFoto(image_path) },
        ...prev,
      ]);
      cerrarModal();
    } catch (err) {
      setErrorSubida(
        err instanceof Error ? err.message : "No se pudo guardar la foto"
      );
    } finally {
      setSubiendo(false);
    }
  }

  function cerrarModal() {
    setModalAbierto(false);
    setNuevoArchivo(null);
    setNuevaPreview(null);
    setNuevaDescripcion("");
    setErrorSubida(null);
  }

  async function alternarFavorito(id: string) {
    const foto = fotos.find((f) => f.id === id);
    if (!foto) return;
    const nuevoValor = !foto.favorito;

    setFotos((prev) =>
      prev.map((f) => (f.id === id ? { ...f, favorito: nuevoValor } : f))
    );

    const { error } = await supabase
      .from("album")
      .update({ favorito: nuevoValor })
      .eq("id", id);

    if (error) {
      setFotos((prev) =>
        prev.map((f) => (f.id === id ? { ...f, favorito: !nuevoValor } : f))
      );
    }
  }

  // ---------- Foto ampliada (lightbox) ----------
  const [fotoAmpliadaId, setFotoAmpliadaId] = useState<string | null>(null);
  const fotoAmpliada = useMemo(
    () => fotos.find((f) => f.id === fotoAmpliadaId) || null,
    [fotos, fotoAmpliadaId]
  );

  async function eliminarFoto(id: string) {
    const foto = fotos.find((f) => f.id === id);
    setFotos((prev) => prev.filter((f) => f.id !== id));
    setFotoAmpliadaId(null);

    await supabase.from("album").delete().eq("id", id);
    if (foto?.image_path) {
      await supabase.storage.from("fotos").remove([foto.image_path]);
    }
  }

  // El fondo se desenfoca cuando hay busqueda abierta o una foto ampliada
  const desenfocado = busquedaAbierta || fotoAmpliada !== null;

  return (
    <section className="relative min-h-screen bg-[#241539] overflow-hidden">
      {/* ---------- Contenido del album ---------- */}
      <div className="px-4 sm:px-6 pt-6 pb-28 max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-5xl mx-auto">
        {/* Barra de busqueda fija de arriba */}
        <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-3 mb-2">
          <Search size={18} className="text-gray-300" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por #playa, #cine..."
            className="bg-transparent outline-none text-sm text-gray-200 placeholder-gray-400 flex-1"
          />
          {busqueda && (
            <button onClick={() => setBusqueda("")} className="text-gray-300 hover:text-white">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Chips de resultado de busqueda */}
        {busqueda && (
          <p className="text-xs text-gray-400 mb-3 px-1">
            {fotosFiltradas.length} resultado{fotosFiltradas.length !== 1 ? "s" : ""} para{" "}
            <span className="text-pink-400">{busqueda}</span>
          </p>
        )}

        {/* Chip de filtro de favoritos */}
        {soloFavoritos && (
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-xs text-pink-400 flex items-center gap-1">
              <Heart size={12} className="fill-pink-400" /> Mostrando solo favoritos
            </p>
            <button
              onClick={() => setSoloFavoritos(false)}
              className="text-[11px] text-gray-400 hover:text-white underline"
            >
              Ver todos
            </button>
          </div>
        )}

        {/* Grilla de fotos estilo mosaico */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 auto-rows-[26px]"
          style={{
            opacity: listo ? 1 : 0,
            transform: listo ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 500ms ease-out, transform 500ms ease-out, filter 300ms ease-out",
            transitionDelay: listo ? "400ms" : "0ms",
            filter: desenfocado ? "blur(6px)" : "blur(0px)",
          }}
        >
          {cargando ? (
            <div className="col-span-2 text-center text-gray-400 text-sm py-10">
              Cargando recuerdos...
            </div>
          ) : fotosFiltradas.length === 0 ? (
            <div className="col-span-2 text-center text-gray-400 text-sm py-10">
              No hay recuerdos con esa etiqueta todavia
            </div>
          ) : (
            fotosFiltradas.map((foto) => (
              <div
                key={foto.id}
                onClick={() => setFotoAmpliadaId(foto.id)}
                className={`relative rounded-2xl overflow-hidden bg-white/10 cursor-pointer ${alturaClase[foto.alto]}`}
              >
                {foto.imagen_url ? (
                  <img
                    src={foto.imagen_url}
                    alt={foto.descripcion}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={26} className="text-white/20" />
                  </div>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    alternarFavorito(foto.id);
                  }}
                  className="absolute top-2 right-2 bg-black/30 rounded-full p-1"
                >
                  <Heart
                    size={16}
                    className={foto.favorito ? "text-pink-400 fill-pink-400" : "text-white/80"}
                  />
                </button>

                {(foto.descripcion || foto.tags.length > 0) && (
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/75 to-transparent px-2 pt-6 pb-2">
                    {foto.descripcion && (
                      <p className="text-[11px] text-white/90 line-clamp-1">{foto.descripcion}</p>
                    )}
                    {foto.tags.length > 0 && (
                      <div className="flex flex-wrap gap-x-1.5 mt-0.5">
                        {foto.tags.map((t) => (
                          <button
                            key={t}
                            onClick={(e) => {
                              e.stopPropagation();
                              setBusqueda(t);
                            }}
                            className="text-[10px] text-pink-300 hover:text-pink-200"
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ---------- Overlay de busqueda: barra + etiquetas sugeridas ---------- */}
      {busquedaAbierta && (
        <div
          className="fixed inset-0 z-40 flex items-start justify-center pt-24 px-4 overflow-y-auto"
          style={{ backdropFilter: "blur(10px)", backgroundColor: "rgba(20, 10, 35, 0.45)" }}
          onClick={() => setBusquedaAbierta(false)}
        >
          <div className="w-full max-w-md sm:max-w-lg pb-10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-3 shadow-xl">
              <Search size={18} className="text-gray-300" />
              <input
                autoFocus
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setBusquedaAbierta(false);
                }}
                placeholder="Buscar por #playa, #cine..."
                className="bg-transparent outline-none text-sm text-gray-200 placeholder-gray-400 flex-1"
              />
              {busqueda && (
                <button onClick={() => setBusqueda("")} className="text-gray-300 hover:text-white">
                  <X size={16} />
                </button>
              )}
              <button
                onClick={() => setBusquedaAbierta(false)}
                className="text-gray-300 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Etiquetas que ya usan en el album */}
            {etiquetasAlbum.length > 0 && (
              <div className="mt-6">
                <p className="text-xs uppercase tracking-wider text-gray-400 mb-3 px-1">
                  En tu álbum
                </p>
                <div className="flex flex-wrap gap-2">
                  {etiquetasAlbum.map(([t, n]) => (
                    <button
                      key={t}
                      onClick={() => elegirEtiqueta(t)}
                      className={chipClase(busquedaNormalizada === t)}
                    >
                      {t} <span className="text-xs opacity-60">{n}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Etiquetas sugeridas ya puestas */}
            <div className="mt-6">
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-3 px-1">
                Sugeridas
              </p>
              <div className="flex flex-wrap gap-2">
                {etiquetasSugeridas.map((t) => (
                  <button
                    key={t}
                    onClick={() => elegirEtiqueta(t)}
                    className={chipClase(busquedaNormalizada === t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Lightbox: foto ampliada en el centro ---------- */}
      {fotoAmpliada && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: "blur(14px)", backgroundColor: "rgba(20, 10, 35, 0.6)" }}
          onClick={() => setFotoAmpliadaId(null)}
        >
          <div
            className="relative w-full max-w-md sm:max-w-lg rounded-3xl overflow-hidden bg-[#2a1b45] shadow-2xl animate-[fadeIn_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setFotoAmpliadaId(null)}
              className="absolute top-3 right-3 z-10 bg-black/40 hover:bg-black/60 transition rounded-full p-1.5 text-white"
            >
              <X size={18} />
            </button>

            <div className="w-full max-h-[65vh] bg-black/20 flex items-center justify-center">
              {fotoAmpliada.imagen_url ? (
                <img
                  src={fotoAmpliada.imagen_url}
                  alt={fotoAmpliada.descripcion}
                  className="w-full max-h-[65vh] object-contain"
                />
              ) : (
                <div className="w-full h-64 flex items-center justify-center">
                  <ImageIcon size={40} className="text-white/20" />
                </div>
              )}
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                {fotoAmpliada.descripcion && (
                  <p className="text-sm text-white/90 flex-1">{fotoAmpliada.descripcion}</p>
                )}
                <button
                  onClick={() => alternarFavorito(fotoAmpliada.id)}
                  className="shrink-0"
                >
                  <Heart
                    size={20}
                    className={
                      fotoAmpliada.favorito
                        ? "text-pink-400 fill-pink-400"
                        : "text-white/60 hover:text-white"
                    }
                  />
                </button>
              </div>

              {fotoAmpliada.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {fotoAmpliada.tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs bg-pink-500/20 text-pink-300 px-2 py-1 rounded-full"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <button
                onClick={() => eliminarFoto(fotoAmpliada.id)}
                className="w-full flex items-center justify-center gap-2 bg-red-500/15 hover:bg-red-500/25 transition text-red-300 rounded-full py-2.5 text-sm font-medium"
              >
                <Trash2 size={16} />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Barra de navegacion inferior ---------- */}
      <div
        className="fixed bottom-5 left-1/2 w-max max-w-[92vw] z-50"
        style={{
          opacity: listo ? 1 : 0,
          transform: listo ? "translate(-50%, 0)" : "translate(-50%, 16px)",
          transition: "opacity 500ms ease-out, transform 500ms ease-out",
          transitionDelay: listo ? "600ms" : "0ms",
        }}
      >
        <div className="flex items-center justify-center gap-7 sm:gap-9 md:gap-11 bg-white/10 backdrop-blur rounded-full px-7 sm:px-9 py-4 border border-white/10">
          <Link to="/nosotros" className="text-gray-300 hover:text-white transition">
            <Home size={24} />
          </Link>
          <button
            onClick={() => setBusquedaAbierta(true)}
            className="text-gray-300 hover:text-white transition"
          >
            <Search size={24} />
          </button>
          <button
            onClick={() => setModalAbierto(true)}
            className="text-white bg-pink-500 hover:bg-pink-600 transition rounded-full p-2.5 -mt-7 shadow-lg shadow-pink-500/40"
          >
            <Plus size={24} />
          </button>
          <button
            onClick={() => setSoloFavoritos((prev) => !prev)}
            className={`transition ${soloFavoritos ? "text-pink-400" : "text-gray-300 hover:text-white"}`}
          >
            <Heart size={24} className={soloFavoritos ? "fill-pink-400" : ""} />
          </button>
          <Link to="/perfil" className="text-gray-300 hover:text-white transition">
            <User size={24} />
          </Link>
        </div>
      </div>

      {/* ---------- Modal: agregar recuerdo ---------- */}
      {modalAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
          onClick={cerrarModal}
        >
          <div
            className="w-full max-w-md sm:max-w-lg bg-[#2a1b45] rounded-t-3xl p-6 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Agregar recuerdo</h3>
              <button onClick={cerrarModal} className="text-gray-300 hover:text-white">
                <X size={22} />
              </button>
            </div>

            <label className="block mb-4 cursor-pointer">
              <div className="w-full h-40 rounded-2xl bg-white/10 border border-dashed border-white/20 flex items-center justify-center overflow-hidden">
                {nuevaPreview ? (
                  <img src={nuevaPreview} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-gray-400 text-sm flex flex-col items-center gap-2">
                    <ImageIcon size={26} />
                    Toca para subir una foto
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={manejarImagen} />
            </label>

            <textarea
              value={nuevaDescripcion}
              onChange={(e) => setNuevaDescripcion(e.target.value)}
              placeholder="Escribe algo lindo... #playa #cine"
              rows={3}
              className="w-full bg-white/10 rounded-2xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 outline-none resize-none mb-2"
            />

            {tagsDetectados.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {tagsDetectados.map((t) => (
                  <span
                    key={t}
                    className="text-xs bg-pink-500/20 text-pink-300 px-2 py-1 rounded-full"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {errorSubida && (
              <p className="text-red-400 text-xs mb-3">{errorSubida}</p>
            )}

            <button
              onClick={guardarFoto}
              disabled={subiendo}
              className="w-full bg-pink-500 hover:bg-pink-600 transition rounded-full py-3 font-bold text-white disabled:opacity-50"
            >
              {subiendo ? "Guardando..." : "Guardar recuerdo"}
            </button>
          </div>
        </div>
      )}

      {/* ---------- Animacion realista del libro que se abre ---------- */}
      {fase !== "fin" && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center cursor-pointer"
          onClick={() => setFase((p) => (p === "fin" ? p : "zoom"))}
          style={{
            background:
              "radial-gradient(ellipse at center, #2a1847 0%, #1B1033 65%, #120a22 100%)",
            opacity: zoom ? 0 : 1,
            transition: "opacity 600ms ease-in-out 600ms",
            pointerEvents: zoom ? "none" : "auto",
          }}
        >
          {/* Escena 3D */}
          <div
            style={{
              perspective: "2000px",
              perspectiveOrigin: "50% 45%",
              opacity: zoom ? 0 : 1,
              transition: "opacity 500ms ease-in 400ms",
            }}
          >
            {/* Libro completo: se centra al abrirse y hace zoom al final */}
            <div
              style={{
                position: "relative",
                width: "min(66vw, 290px)",
                aspectRatio: "3 / 4",
                transformStyle: "preserve-3d",
                transformOrigin: "0% 50%",
                transform: transformLibro,
                transition: transicionLibro,
              }}
            >
              {/* Sombra sobre la mesa */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.75)",
                  filter: "blur(18px)",
                  borderRadius: 12,
                  transformOrigin: "left center",
                  transform: abierto
                    ? "translateX(-100%) translateY(10px) translateZ(-14px) scaleX(2.04)"
                    : "translateX(0%) translateY(10px) translateZ(-14px) scaleX(1.04)",
                  transition: `transform ${DURACION_TAPA + 300}ms ${EASE_LIBRO}`,
                }}
              />

              {/* Contratapa */}
              <div
                style={{
                  position: "absolute",
                  inset: "-3px -4px -3px 0",
                  transform: "translateZ(-3px)",
                  background: "linear-gradient(225deg, #2d1a52, #1B1033)",
                  borderRadius: "3px 12px 12px 3px",
                }}
              />

              {/* Pagina base (derecha) con el grosor de las hojas */}
              <div
                style={{
                  position: "absolute",
                  inset: "2px 3px 2px 0",
                  background: PAPEL,
                  borderRadius: "0 6px 6px 0",
                  boxShadow:
                    "1px 1px 0 #d8cdb2, 2px 2px 0 #f4ecd6, 3px 3px 0 #d8cdb2, 4px 4px 0 #f4ecd6",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: "18px 14px 18px 22px",
                    background: LINEAS,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Heart size={44} className="text-pink-400/20 fill-pink-400/10" />
                </div>
              </div>

              {/* Hojas que se voltean despues de la tapa */}
              <Hoja abierto={abierto} retraso={420} angulo={-177.5} zCerrado={4} zAbierto={1} />
              <Hoja abierto={abierto} retraso={640} angulo={-176} zCerrado={3} zAbierto={2} />
              <Hoja abierto={abierto} retraso={860} angulo={-174.5} zCerrado={2} zAbierto={3} />

              {/* Tapa delantera (bisagra en el lomo, a la izquierda) */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  transformOrigin: "left center",
                  transformStyle: "preserve-3d",
                  transform: abierto
                    ? "translateZ(-3px) rotateY(-179deg)"
                    : "translateZ(6px) rotateY(0deg)",
                  transition: `transform ${DURACION_TAPA}ms ${EASE_LIBRO}`,
                }}
              >
                {/* Exterior de la tapa */}
                <div
                  style={{
                    ...cara,
                    transform: "translateZ(2px)",
                    borderRadius: "3px 12px 12px 3px",
                    background: CUERO,
                    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)",
                  }}
                >
                  {/* Textura de cuero */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 3px)",
                    }}
                  />
                  {/* Canal de la bisagra */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 18,
                      background:
                        "linear-gradient(90deg, rgba(0,0,0,0.6), rgba(255,255,255,0.08) 55%, rgba(0,0,0,0.35) 75%, transparent)",
                    }}
                  />
                  {/* Marco dorado */}
                  <div
                    style={{
                      position: "absolute",
                      inset: "14px 14px 14px 28px",
                      border: "1px solid rgba(250,204,21,0.35)",
                      borderRadius: 8,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: "19px 19px 19px 33px",
                      border: "1px solid rgba(250,204,21,0.15)",
                      borderRadius: 5,
                    }}
                  />
                  {/* Titulo */}
                  <div
                    style={{
                      position: "absolute",
                      inset: "0 0 0 14px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 2,
                    }}
                  >
                    <Heart
                      size={34}
                      className="text-[#EC4899] fill-[#EC4899] mb-3"
                      style={{ filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.6))" }}
                    />
                    <span
                      style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: "#fff",
                        letterSpacing: "0.05em",
                        textShadow: "0 2px 5px rgba(0,0,0,0.6)",
                      }}
                    >
                      Nuestro
                    </span>
                    <span
                      style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: "#EC4899",
                        letterSpacing: "0.05em",
                        textShadow: "0 2px 5px rgba(0,0,0,0.6)",
                      }}
                    >
                      Álbum
                    </span>
                    <div
                      style={{
                        width: 40,
                        height: 1,
                        background: "rgba(250,204,21,0.6)",
                        marginTop: 10,
                      }}
                    />
                  </div>
                  {/* Brillo que cruza la tapa al abrirse */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.18) 48%, transparent 60%)",
                      backgroundSize: "250% 100%",
                      backgroundPosition: abierto ? "0% 0%" : "100% 0%",
                      transition: `background-position ${DURACION_TAPA}ms ${EASE_LIBRO}`,
                    }}
                  />
                  {/* Sombra segun el giro */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(10,5,25,0.65)",
                      opacity: abierto ? 1 : 0,
                      transition: `opacity ${DURACION_TAPA}ms ${EASE_LIBRO}`,
                    }}
                  />
                </div>

                {/* Interior de la tapa */}
                <div
                  style={{
                    ...cara,
                    transform: "rotateY(180deg) translateZ(2px)",
                    borderRadius: "3px 12px 12px 3px",
                    background: "#1B1033",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: "8px 8px 8px 10px",
                      borderRadius: 6,
                      background:
                        "repeating-linear-gradient(45deg, #3b2563 0px, #3b2563 6px, #34205a 6px, #34205a 12px)",
                      border: "1px solid rgba(250,204,21,0.25)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(90deg, rgba(0,0,0,0.5), transparent 28%)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(10,5,25,0.65)",
                      opacity: abierto ? 0 : 1,
                      transition: `opacity ${DURACION_TAPA}ms ${EASE_LIBRO}`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <p
            className="absolute bottom-10 text-xs text-white/30 tracking-wide"
            style={{ opacity: zoom ? 0 : 1, transition: "opacity 300ms" }}
          >
            Toca para saltar
          </p>
        </div>
      )}
    </section>
  );
}

export default Album;