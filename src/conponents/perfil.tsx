import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  ChevronDown,
  Menu,
  Settings,
  Grid3x3,
  Bookmark,
  User,
  Image as ImageIcon,
  Heart,
  Plus,
  X,
  ImagePlus,
} from "lucide-react";

// ---------- Cliente Supabase ----------
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

type PersonaId = 1 | 2;

const NOMBRE_POR_DEFECTO: Record<PersonaId, { usuario: string; nombre: string }> = {
  1: { usuario: "persona1", nombre: "Persona 1" },
  2: { usuario: "persona2", nombre: "Persona 2" },
};

interface Foto {
  id: string;
  image_path: string;
  descripcion: string;
  favorito: boolean;
  persona_id: PersonaId;
  created_at: string;
  imagen_url: string;
}

interface PerfilInfo {
  id: PersonaId;
  nombre_usuario: string;
  nombre: string;
  bio: string;
  sitio: string;
  siguiendo: number;
  avatar_path: string | null;
  avatar_url?: string;
}

function urlFoto(path: string) {
  return supabase.storage.from("fotos").getPublicUrl(path).data.publicUrl;
}

function urlAvatar(path: string | null) {
  if (!path) return undefined;
  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
}

function Perfil() {
  const [personaId, setPersonaId] = useState<PersonaId>(1);
  const [perfil, setPerfil] = useState<PerfilInfo | null>(null);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState<"grilla" | "guardados">("grilla");

  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [mostrarSubir, setMostrarSubir] = useState(false);

  // ---------- Carga cuando cambia la persona seleccionada ----------
  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargando(true);

      const [perfilRes, fotosRes] = await Promise.all([
        supabase.from("perfil").select("*").eq("id", personaId).maybeSingle(),
        supabase
          .from("fotos")
          .select("*")
          .eq("persona_id", personaId)
          .order("created_at", { ascending: false }),
      ]);

      if (cancelado) return;

      if (perfilRes.data) {
        setPerfil({
          ...perfilRes.data,
          avatar_url: urlAvatar(perfilRes.data.avatar_path),
        });
      } else {
        // si todavia no existe la fila para esta persona, la creamos
        const base = NOMBRE_POR_DEFECTO[personaId];
        const { data: nuevo } = await supabase
          .from("perfil")
          .insert({
            id: personaId,
            nombre_usuario: base.usuario,
            nombre: base.nombre,
            bio: "Nuestros recuerdos juntos",
            sitio: "",
            siguiendo: 0,
          })
          .select()
          .single();
        if (nuevo) setPerfil({ ...nuevo, avatar_url: undefined });
      }

      if (fotosRes.data) {
        setFotos(
          fotosRes.data.map((f) => ({ ...f, imagen_url: urlFoto(f.image_path) }))
        );
      }

      setCargando(false);
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [personaId]);

  const guardadas = useMemo(() => fotos.filter((f) => f.favorito), [fotos]);
  const fotosMostradas = tab === "grilla" ? fotos : guardadas;

  // ---------- Alternar favorito ----------
  async function alternarFavorito(foto: Foto) {
    const nuevoValor = !foto.favorito;
    setFotos((prev) =>
      prev.map((f) => (f.id === foto.id ? { ...f, favorito: nuevoValor } : f))
    );

    const { error } = await supabase
      .from("fotos")
      .update({ favorito: nuevoValor })
      .eq("id", foto.id);

    if (error) {
      setFotos((prev) =>
        prev.map((f) => (f.id === foto.id ? { ...f, favorito: !nuevoValor } : f))
      );
    }
  }

  if (cargando || !perfil) {
    return (
      <section className="min-h-screen bg-[#241539] flex items-center justify-center">
        <p className="text-gray-400 text-sm">Cargando...</p>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen bg-[#241539] overflow-hidden">
      <div className="px-4 sm:px-6 pt-6 pb-28 max-w-md sm:max-w-xl md:max-w-3xl mx-auto">
        {/* ---------- Barra superior ---------- */}
        <div className="flex items-center justify-between mb-5">
          <button className="flex items-center gap-1 text-white font-bold text-base">
            {perfil.nombre_usuario}
            <ChevronDown size={16} className="text-gray-300" />
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMostrarSubir(true)}
              className="text-gray-300 hover:text-white transition"
              title="Subir foto"
            >
              <Plus size={22} />
            </button>
            <button className="text-gray-300 hover:text-white transition">
              <Settings size={22} />
            </button>
            <button className="text-gray-300 hover:text-white transition">
              <Menu size={22} />
            </button>
          </div>
        </div>

        {/* ---------- Switch: Persona 1 / Persona 2 ---------- */}
        <div className="flex bg-white/5 rounded-full p-1 mb-5">
          {([1, 2] as PersonaId[]).map((id) => (
            <button
              key={id}
              onClick={() => setPersonaId(id)}
              className={`flex-1 text-sm font-semibold rounded-full py-2 transition ${
                personaId === id
                  ? "bg-gradient-to-tr from-pink-500 via-fuchsia-500 to-purple-500 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {NOMBRE_POR_DEFECTO[id].nombre}
            </button>
          ))}
        </div>

        {/* ---------- Avatar + estadisticas ---------- */}
        <div className="flex items-center gap-5 mb-4">
          <div className="relative shrink-0 w-20 h-20 rounded-full p-[3px] bg-gradient-to-tr from-pink-500 via-fuchsia-500 to-purple-500">
            <div className="w-full h-full rounded-full bg-[#241539] p-[2px]">
              {perfil.avatar_url ? (
                <img
                  src={perfil.avatar_url}
                  alt={perfil.nombre}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center">
                  <User size={28} className="text-white/40" />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex items-center justify-between text-center">
            <div>
              <p className="text-white font-bold text-base">{fotos.length}</p>
              <p className="text-[11px] text-gray-400">Publicaciones</p>
            </div>
            <div>
              <p className="text-white font-bold text-base">{guardadas.length}</p>
              <p className="text-[11px] text-gray-400">Favoritos</p>
            </div>
            <div>
              <p className="text-white font-bold text-base">{perfil.siguiendo}</p>
              <p className="text-[11px] text-gray-400">Siguiendo</p>
            </div>
          </div>
        </div>

        {/* ---------- Nombre, bio y sitio ---------- */}
        <div className="mb-4">
          <p className="text-white font-bold text-sm">{perfil.nombre}</p>
          {perfil.bio && <p className="text-gray-300 text-sm">{perfil.bio}</p>}
          {perfil.sitio && (
            <a
              href={`https://${perfil.sitio.replace(/^https?:\/\//, "")}`}
              target="_blank"
              rel="noreferrer"
              className="text-pink-400 text-sm hover:underline"
            >
              {perfil.sitio}
            </a>
          )}
        </div>

        {/* ---------- Boton editar perfil ---------- */}
        <button
          onClick={() => setMostrarEditar(true)}
          className="w-full bg-white/10 hover:bg-white/15 transition rounded-xl py-2 text-sm font-semibold text-white mb-6"
        >
          Editar perfil
        </button>

        {/* ---------- Tabs ---------- */}
        <div className="flex items-center border-t border-white/10">
          <button
            onClick={() => setTab("grilla")}
            className={`flex-1 flex items-center justify-center py-3 border-t-2 -mt-px transition ${
              tab === "grilla" ? "border-pink-500 text-white" : "border-transparent text-gray-500"
            }`}
          >
            <Grid3x3 size={20} />
          </button>
          <button
            onClick={() => setTab("guardados")}
            className={`flex-1 flex items-center justify-center py-3 border-t-2 -mt-px transition ${
              tab === "guardados" ? "border-pink-500 text-white" : "border-transparent text-gray-500"
            }`}
          >
            <Bookmark size={20} />
          </button>
        </div>

        {/* ---------- Grilla de fotos (propias de esta persona) ---------- */}
        <div className="grid grid-cols-3 gap-[2px] mt-[2px]">
          {fotosMostradas.length === 0 ? (
            <div className="col-span-3 text-center text-gray-400 text-sm py-12">
              {tab === "grilla" ? "Todavia no hay fotos" : "No hay favoritos todavia"}
            </div>
          ) : (
            fotosMostradas.map((foto) => (
              <div
                key={foto.id}
                className="relative aspect-square bg-white/10 overflow-hidden group"
              >
                {foto.imagen_url ? (
                  <img
                    src={foto.imagen_url}
                    alt={foto.descripcion}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={20} className="text-white/20" />
                  </div>
                )}
                <button
                  onClick={() => alternarFavorito(foto)}
                  className="absolute bottom-1.5 right-1.5 bg-black/50 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition"
                >
                  <Heart
                    size={16}
                    className={foto.favorito ? "fill-pink-500 text-pink-500" : "text-white"}
                  />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ---------- Modal: editar perfil ---------- */}
      {mostrarEditar && (
        <EditarPerfilModal
          perfil={perfil}
          onClose={() => setMostrarEditar(false)}
          onGuardado={(nuevo) => setPerfil(nuevo)}
        />
      )}

      {/* ---------- Modal: subir foto ---------- */}
      {mostrarSubir && (
        <SubirFotoModal
          personaId={personaId}
          onClose={() => setMostrarSubir(false)}
          onSubida={(nueva) => setFotos((prev) => [nueva, ...prev])}
        />
      )}
    </section>
  );
}

// =========================================================
// Modal: editar perfil (nombre, bio, sitio, foto de perfil)
// =========================================================
function EditarPerfilModal({
  perfil,
  onClose,
  onGuardado,
}: {
  perfil: PerfilInfo;
  onClose: () => void;
  onGuardado: (nuevo: PerfilInfo) => void;
}) {
  const [nombre, setNombre] = useState(perfil.nombre);
  const [bio, setBio] = useState(perfil.bio);
  const [sitio, setSitio] = useState(perfil.sitio);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(perfil.avatar_url);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    try {
      let avatar_path = perfil.avatar_path;

      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `persona-${perfil.id}-${Date.now()}.${ext}`;
        const { error: subeError } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true });
        if (subeError) throw subeError;
        avatar_path = path;
      }

      const { data, error: updateError } = await supabase
        .from("perfil")
        .update({ nombre, bio, sitio, avatar_path })
        .eq("id", perfil.id)
        .select()
        .single();

      if (updateError) throw updateError;

      onGuardado({ ...data, avatar_url: urlAvatar(avatar_path) });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center">
      <div className="w-full sm:max-w-sm bg-[#2c1a47] rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold text-base">Editar perfil</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
              {previewUrl ? (
                <img src={previewUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={28} className="text-white/40" />
              )}
            </div>
            <label className="text-pink-400 text-xs cursor-pointer hover:underline">
              Cambiar foto de perfil
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-xs">Nombre</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="bg-white/10 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-xs">Biografia</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              className="bg-white/10 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500 resize-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-xs">Sitio web</label>
            <input
              value={sitio}
              onChange={(e) => setSitio(e.target.value)}
              className="bg-white/10 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={guardando}
            className="mt-1 bg-gradient-to-tr from-pink-500 via-fuchsia-500 to-purple-500 text-white font-semibold rounded-xl py-3 text-sm disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </div>
    </div>
  );
}

// =========================================================
// Modal: subir foto nueva (queda asociada a la persona activa)
// =========================================================
function SubirFotoModal({
  personaId,
  onClose,
  onSubida,
}: {
  personaId: PersonaId;
  onClose: () => void;
  onSubida: (nuevaFoto: Foto) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Elige una foto primero");
      return;
    }
    setSubiendo(true);
    setError(null);

    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

      const { error: subeError } = await supabase.storage.from("fotos").upload(path, file);
      if (subeError) throw subeError;

      const { data, error: insertError } = await supabase
        .from("fotos")
        .insert({
          image_path: path,
          descripcion,
          favorito: false,
          persona_id: personaId,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      onSubida({ ...data, imagen_url: urlFoto(path) });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la foto");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center">
      <div className="w-full sm:max-w-sm bg-[#2c1a47] rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold text-base">
            Subir foto ({NOMBRE_POR_DEFECTO[personaId].nombre})
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="aspect-square w-full rounded-xl bg-white/10 flex items-center justify-center overflow-hidden cursor-pointer border border-dashed border-white/20">
            {previewUrl ? (
              <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <ImagePlus size={28} />
                <span className="text-xs">Elegir una foto</span>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>

          <div className="flex flex-col gap-1">
            <label className="text-gray-400 text-xs">Descripcion (opcional)</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              className="bg-white/10 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500 resize-none"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={subiendo}
            className="mt-1 bg-gradient-to-tr from-pink-500 via-fuchsia-500 to-purple-500 text-white font-semibold rounded-xl py-3 text-sm disabled:opacity-50"
          >
            {subiendo ? "Subiendo..." : "Publicar"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Perfil;