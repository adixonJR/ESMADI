import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";
import { LocalNotifications } from "@capacitor/local-notifications";
import {
  Settings,
  Grid3x3,
  Bookmark,
  Users,
  User,
  Image as ImageIcon,
  Heart,
  X,
  ImagePlus,
  Trash2,
  Camera,
} from "lucide-react";

// ---------- Cliente Supabase ----------
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ---------- Notificacion local al subir una foto ----------
async function notificarFotoAgregada() {
  try {
    const permiso = await LocalNotifications.checkPermissions();
    let concedido = permiso.display === "granted";

    if (!concedido) {
      const resultado = await LocalNotifications.requestPermissions();
      concedido = resultado.display === "granted";
    }

    if (!concedido) return;

    await LocalNotifications.schedule({
      notifications: [
        {
          id: Date.now(),
          title: "Nueva foto 📸",
          body: "Se agregó una imagen a tu perfil",
          schedule: { at: new Date(Date.now() + 1000) },
        },
      ],
    });
  } catch (error) {
    console.error("No se pudo enviar la notificacion:", error);
  }
}

type PersonaId = 1 | 2;
type TabId = "grilla" | "guardados" | "juntos";

const NOMBRE_POR_DEFECTO: Record<PersonaId, { usuario: string; nombre: string }> = {
  1: { usuario: "adixon", nombre: "Adixon" },
  2: { usuario: "esmeralda", nombre: "Esmeralda" },
};

// ---------- Mapeo de email de la cuenta (Supabase Auth) -> personaId ----------
// Reemplaza estos correos por los reales de cada cuenta.
const EMAIL_A_PERSONA_ID: Record<string, PersonaId> = {
  "julcaadixon25@gmail.com": 1,
  "esmeraldajanampa07@gmail.com": 2,
};

// ---------- Pestañas del perfil ----------
const TABS = [
  { id: "grilla", icon: Grid3x3, label: "Publicaciones" },
  { id: "guardados", icon: Bookmark, label: "Favoritos" },
  { id: "juntos", icon: Users, label: "Juntos" },
] as const;

interface Foto {
  id: string;
  image_path: string;
  descripcion: string;
  favorito: boolean;
  persona_id: PersonaId;
  created_at: string;
  imagen_url: string;
}

interface PerfilFila {
  id: PersonaId;
  nombre_usuario: string;
  nombre: string;
  bio: string;
  sitio: string;
  siguiendo: number;
  avatar_path: string | null;
  // Requiere la columna: alter table perfil add column portada_path text;
  portada_path?: string | null;
}

interface PerfilInfo extends PerfilFila {
  avatar_url?: string;
  portada_url?: string;
}

function urlFoto(path: string) {
  return supabase.storage.from("fotos").getPublicUrl(path).data.publicUrl;
}

// Avatares y portadas comparten el bucket "avatars"
function urlAvatar(path: string | null | undefined) {
  if (!path) return undefined;
  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
}

function armarPerfil(fila: PerfilFila): PerfilInfo {
  return {
    ...fila,
    avatar_url: urlAvatar(fila.avatar_path),
    portada_url: urlAvatar(fila.portada_path),
  };
}

function Perfil() {
  // personaId = quien tiene la sesion iniciada; vistaId = perfil que se esta viendo
  const [personaId, setPersonaId] = useState<PersonaId | null>(null);
  const [vistaId, setVistaId] = useState<PersonaId | null>(null);
  const [perfil, setPerfil] = useState<PerfilInfo | null>(null);
  const [todasFotos, setTodasFotos] = useState<Foto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorAuth, setErrorAuth] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("grilla");

  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [mostrarSubir, setMostrarSubir] = useState(false);
  const [fotoAmpliadaId, setFotoAmpliadaId] = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [subiendoPortada, setSubiendoPortada] = useState(false);
  const [menuFoto, setMenuFoto] = useState(false);
  const inputPortadaRef = useRef<HTMLInputElement>(null);

  // ---------- Resuelve la persona a partir de la cuenta autenticada ----------
  useEffect(() => {
    let cancelado = false;

    async function resolverPersona() {
      const { data, error } = await supabase.auth.getUser();

      if (cancelado) return;

      if (error || !data.user?.email) {
        setErrorAuth("No se pudo identificar la sesión");
        setCargando(false);
        return;
      }

      const id = EMAIL_A_PERSONA_ID[data.user.email.toLowerCase()];

      if (!id) {
        setErrorAuth("Esta cuenta no está vinculada a un perfil");
        setCargando(false);
        return;
      }

      setPersonaId(id);
      setVistaId(id);
    }

    resolverPersona();
    return () => {
      cancelado = true;
    };
  }, []);

  // ---------- Carga el perfil visto y todas las fotos ----------
  useEffect(() => {
    if (!personaId || !vistaId) return;
    const idPerfil = vistaId;
    const miId = personaId;

    let cancelado = false;

    async function cargar() {
      const [perfilRes, fotosRes] = await Promise.all([
        supabase.from("perfil").select("*").eq("id", idPerfil).maybeSingle(),
        supabase.from("fotos").select("*").order("created_at", { ascending: false }),
      ]);

      if (cancelado) return;

      if (perfilRes.data) {
        setPerfil(armarPerfil(perfilRes.data));
      } else if (idPerfil === miId) {
        // si todavia no existe la fila para esta persona, la creamos
        const base = NOMBRE_POR_DEFECTO[idPerfil];
        const { data: nuevo } = await supabase
          .from("perfil")
          .insert({
            id: idPerfil,
            nombre_usuario: base.usuario,
            nombre: base.nombre,
            bio: "Nuestros recuerdos juntos",
            sitio: "",
            siguiendo: 0,
          })
          .select()
          .single();
        if (nuevo && !cancelado) setPerfil(armarPerfil(nuevo));
      } else {
        // perfil de la pareja sin datos todavia: se muestra uno basico
        const base = NOMBRE_POR_DEFECTO[idPerfil];
        setPerfil({
          id: idPerfil,
          nombre_usuario: base.usuario,
          nombre: base.nombre,
          bio: "",
          sitio: "",
          siguiendo: 0,
          avatar_path: null,
        });
      }

      if (fotosRes.data) {
        setTodasFotos(
          fotosRes.data.map((f) => ({ ...f, imagen_url: urlFoto(f.image_path) }))
        );
      }

      setCargando(false);
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [personaId, vistaId]);

  const esMio = personaId !== null && vistaId === personaId;

  const fotosPersona = useMemo(
    () => todasFotos.filter((f) => f.persona_id === vistaId),
    [todasFotos, vistaId]
  );
  const guardadas = useMemo(() => fotosPersona.filter((f) => f.favorito), [fotosPersona]);

  const fotosMostradas =
    tab === "grilla" ? fotosPersona : tab === "guardados" ? guardadas : todasFotos;
  const fotoAmpliada = todasFotos.find((f) => f.id === fotoAmpliadaId) ?? null;
  const indiceTab = TABS.findIndex((t) => t.id === tab);

  // ---------- Cambiar de perfil (mio <-> pareja) ----------
  function alternarVista() {
    if (!personaId) return;
    setTab("grilla");
    setVistaId(vistaId === personaId ? (personaId === 1 ? 2 : 1) : personaId);
  }

  // ---------- Cambiar portada ----------
  async function cambiarPortada(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !perfil) return;

    setSubiendoPortada(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `portada-${perfil.id}-${Date.now()}.${ext}`;

      const { error: subeError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (subeError) throw subeError;

      const { error: updateError } = await supabase
        .from("perfil")
        .update({ portada_path: path })
        .eq("id", perfil.id);
      if (updateError) throw updateError;

      setPerfil({ ...perfil, portada_path: path, portada_url: urlAvatar(path) });
    } catch (err) {
      console.error(err);
      const msg = (err as { message?: string })?.message ?? "";
      window.alert(
        msg.includes("portada_path")
          ? "Falta la columna de portada. Ejecuta esto en el SQL Editor de Supabase:\n\nalter table perfil add column portada_path text;"
          : "No se pudo cambiar la portada. Intenta de nuevo."
      );
    } finally {
      setSubiendoPortada(false);
    }
  }

  // ---------- Eliminar foto ----------
  async function eliminarFoto(foto: Foto) {
    if (foto.persona_id !== personaId) return;

    const confirmado = window.confirm("¿Eliminar esta foto? Esta acción no se puede deshacer.");
    if (!confirmado) return;

    setEliminandoId(foto.id);

    const { error: storageError } = await supabase.storage
      .from("fotos")
      .remove([foto.image_path]);

    if (storageError) {
      setEliminandoId(null);
      window.alert("No se pudo eliminar la foto. Intenta de nuevo.");
      return;
    }

    const { error: dbError } = await supabase.from("fotos").delete().eq("id", foto.id);

    if (dbError) {
      setEliminandoId(null);
      window.alert("No se pudo eliminar la foto. Intenta de nuevo.");
      return;
    }

    setTodasFotos((prev) => prev.filter((f) => f.id !== foto.id));
    setEliminandoId(null);
    setFotoAmpliadaId(null);
  }

  // ---------- Alternar favorito (solo en fotos propias) ----------
  async function alternarFavorito(foto: Foto) {
    if (foto.persona_id !== personaId) return;

    const nuevoValor = !foto.favorito;
    setTodasFotos((prev) =>
      prev.map((f) => (f.id === foto.id ? { ...f, favorito: nuevoValor } : f))
    );

    const { error } = await supabase
      .from("fotos")
      .update({ favorito: nuevoValor })
      .eq("id", foto.id);

    if (error) {
      setTodasFotos((prev) =>
        prev.map((f) => (f.id === foto.id ? { ...f, favorito: !nuevoValor } : f))
      );
    }
  }

  if (errorAuth) {
    return (
      <section className="min-h-screen bg-[#241539] flex items-center justify-center px-6">
        <p className="text-gray-400 text-sm text-center">{errorAuth}</p>
      </section>
    );
  }

  if (cargando || !perfil || !personaId || !vistaId) {
    return (
      <section className="min-h-screen bg-[#241539] flex items-center justify-center">
        <p className="text-gray-400 text-sm">Cargando...</p>
      </section>
    );
  }

  const otroId: PersonaId = personaId === 1 ? 2 : 1;

  const stats = [
    { tab: "grilla", n: fotosPersona.length, label: "Publicaciones" },
    { tab: "guardados", n: guardadas.length, label: "Favoritos" },
    { tab: "juntos", n: todasFotos.length, label: "Juntos" },
  ] as const;

  const textoVacio: Record<TabId, string> = {
    grilla: esMio ? "Todavia no hay fotos. Toca + para subir la primera." : "Todavia no hay fotos",
    guardados: "No hay favoritos todavia",
    juntos: "Las fotos de los dos apareceran aqui",
  };

  return (
    <section className="relative min-h-screen bg-[#241539] overflow-hidden">
      <div className="max-w-md sm:max-w-xl md:max-w-3xl mx-auto pb-28">
        {/* ---------- Portada (foto larga) ---------- */}
        <div className="relative h-40 md:h-52 overflow-hidden bg-gradient-to-r from-[#3b1d6e] via-fuchsia-500 to-orange-400">
          {perfil.portada_url && (
            <img
              src={perfil.portada_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#1b1033]/40 via-transparent to-[#241539]/75" />

          {esMio && (
            <>
              <input
                ref={inputPortadaRef}
                type="file"
                accept="image/*"
                onChange={cambiarPortada}
                className="hidden"
              />

              <button
                className="absolute top-2.5 right-2.5 z-10 w-11 h-11 flex items-center justify-center rounded-[14px] bg-[#1b1033]/55 backdrop-blur-md text-white active:scale-95 transition"
                title="Ajustes"
              >
                <Settings size={24} />
              </button>

              {menuFoto && (
                <button
                  aria-label="Cerrar menú"
                  onClick={() => setMenuFoto(false)}
                  className="absolute inset-0 z-10 cursor-default"
                />
              )}

              {menuFoto && (
                <div className="absolute bottom-16 right-3 z-20 w-48 overflow-hidden rounded-2xl bg-[#2c1a47]/95 backdrop-blur-md border border-[#47356b] shadow-xl">
                  <button
                    onClick={() => {
                      setMenuFoto(false);
                      setMostrarSubir(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/10 active:bg-white/10 transition"
                  >
                    <ImagePlus size={18} />
                    Subir foto
                  </button>
                  <button
                    onClick={() => {
                      setMenuFoto(false);
                      inputPortadaRef.current?.click();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white border-t border-white/10 hover:bg-white/10 active:bg-white/10 transition"
                  >
                    <ImageIcon size={18} />
                    Cambiar portada
                  </button>
                </div>
              )}

              <button
                onClick={() => setMenuFoto((v) => !v)}
                disabled={subiendoPortada}
                className="absolute bottom-3 right-3 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-[#1b1033]/55 backdrop-blur-md text-white active:scale-95 transition disabled:opacity-50"
                title="Fotos"
              >
                <Camera size={20} />
              </button>
            </>
          )}
        </div>

        <div className="px-4 sm:px-6">
          {/* ---------- Avatar + estadisticas ---------- */}
          <div className="relative z-10 -mt-8 flex items-end gap-[18px]">
            <div className="shrink-0 w-24 h-24 rounded-full p-[3px] bg-gradient-to-br from-fuchsia-500 to-pink-500">
              <div className="w-full h-full rounded-full border-[3px] border-[#241539] bg-[#241539] overflow-hidden">
                {perfil.avatar_url ? (
                  <img
                    src={perfil.avatar_url}
                    alt={perfil.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center">
                    <User size={34} className="text-white/40" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 flex items-center justify-around">
              {stats.map((s) => (
                <button
                  key={s.tab}
                  onClick={() => setTab(s.tab)}
                  className="px-1 py-1.5 text-center active:scale-95 transition"
                >
                  <span className="block text-2xl font-semibold text-white leading-tight">
                    {s.n}
                  </span>
                  <span
                    className={`block text-sm ${tab === s.tab ? "text-pink-500" : "text-gray-400"}`}
                  >
                    {s.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ---------- Nombre, bio y sitio ---------- */}
          <div className="mt-4">
            <p className="text-white font-semibold text-lg">{perfil.nombre}</p>
            {perfil.bio && <p className="text-gray-300 text-base leading-snug mt-0.5">{perfil.bio}</p>}
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

          {/* ---------- Botones: editar perfil / cambiar de perfil ---------- */}
          <div className="flex gap-2.5 mt-[18px]">
            {esMio && (
              <button
                onClick={() => setMostrarEditar(true)}
                className="flex-1 h-[46px] rounded-2xl bg-[#352257] active:bg-[#47356b] transition text-[15px] font-semibold text-white"
              >
                Editar perfil
              </button>
            )}
            <button
              onClick={alternarVista}
              className="flex-1 h-[46px] rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-500 active:opacity-90 transition text-[15px] font-semibold text-white"
            >
              {esMio ? `Ver perfil de ${NOMBRE_POR_DEFECTO[otroId].nombre}` : "Volver a mi perfil"}
            </button>
          </div>

          {/* ---------- Tabs ---------- */}
          <div className="relative mt-[22px] flex border-b border-[#47356b]">
            {TABS.map((t) => {
              const Icono = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  aria-label={t.label}
                  className={`flex-1 h-[54px] flex items-center justify-center transition ${
                    tab === t.id ? "text-white" : "text-gray-400"
                  }`}
                >
                  <Icono size={26} />
                </button>
              );
            })}
            <div
              className="absolute -bottom-px left-0 h-[3px] w-1/3 bg-pink-500 transition-transform duration-200"
              style={{ transform: `translateX(${indiceTab * 100}%)` }}
            />
          </div>

          {/* ---------- Grilla de fotos ---------- */}
          <div className="grid grid-cols-3 gap-1 mt-2">
            {fotosMostradas.length === 0 ? (
              <div className="col-span-3 text-center text-gray-400 text-sm py-12">
                {textoVacio[tab]}
              </div>
            ) : (
              fotosMostradas.map((foto) => (
                <div
                  key={foto.id}
                  className="relative aspect-square bg-white/10 overflow-hidden"
                >
                  {foto.imagen_url ? (
                    <button
                      onClick={() => setFotoAmpliadaId(foto.id)}
                      className="w-full h-full block"
                      title="Ver foto"
                    >
                      <img
                        src={foto.imagen_url}
                        alt={foto.descripcion}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon size={20} className="text-white/20" />
                    </div>
                  )}

                  {tab === "juntos" && (
                    <span className="absolute left-1.5 bottom-1.5 text-[11px] text-white bg-[#1b1033]/65 px-2 py-0.5 rounded-full">
                      {NOMBRE_POR_DEFECTO[foto.persona_id].nombre}
                    </span>
                  )}

                  {foto.persona_id === personaId && (
                    <button
                      onClick={() => alternarFavorito(foto)}
                      className="absolute bottom-1.5 right-1.5 w-[34px] h-[34px] flex items-center justify-center rounded-full bg-[#1b1033]/70 active:scale-90 transition"
                      title="Favorito"
                    >
                      <Heart
                        size={18}
                        className={foto.favorito ? "fill-pink-500 text-pink-500" : "text-white"}
                      />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
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
          onSubida={(nueva) => setTodasFotos((prev) => [nueva, ...prev])}
        />
      )}

      {/* ---------- Modal: foto ampliada (aquí se puede eliminar) ---------- */}
      {fotoAmpliada && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-xl flex flex-col items-center justify-center p-4 animar-entrada-fondo">
          <style>{`
            @keyframes entradaFondo {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes entradaFoto {
              from { opacity: 0; transform: scale(0.85); }
              to { opacity: 1; transform: scale(1); }
            }
            .animar-entrada-fondo { animation: entradaFondo 0.2s ease-out; }
            .animar-entrada-foto { animation: entradaFoto 0.25s cubic-bezier(0.22, 1, 0.36, 1); }
          `}</style>

          <button
            onClick={() => setFotoAmpliadaId(null)}
            className="absolute top-4 right-4 text-white bg-white/10 rounded-full p-2 active:scale-90 transition"
          >
            <X size={20} />
          </button>

          {fotoAmpliada.imagen_url && (
            <img
              src={fotoAmpliada.imagen_url}
              alt={fotoAmpliada.descripcion}
              className="max-w-full max-h-[70vh] object-contain rounded-2xl animar-entrada-foto"
            />
          )}

          {fotoAmpliada.descripcion && (
            <p className="text-white/80 text-sm mt-4 text-center px-4">
              {fotoAmpliada.descripcion}
            </p>
          )}

          {fotoAmpliada.persona_id === personaId && (
            <div className="flex items-center gap-4 mt-6">
              <button
                onClick={() => alternarFavorito(fotoAmpliada)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/15 transition rounded-full px-4 py-2.5 text-white text-sm font-semibold active:scale-95"
              >
                <Heart
                  size={18}
                  className={fotoAmpliada.favorito ? "fill-pink-500 text-pink-500" : "text-white"}
                />
                Favorito
              </button>
              <button
                onClick={() => eliminarFoto(fotoAmpliada)}
                disabled={eliminandoId === fotoAmpliada.id}
                className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 transition rounded-full px-4 py-2.5 text-red-300 text-sm font-semibold active:scale-95 disabled:opacity-50"
              >
                <Trash2 size={18} />
                {eliminandoId === fotoAmpliada.id ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          )}
        </div>
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
  const [nombreUsuario, setNombreUsuario] = useState(perfil.nombre_usuario);
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
        .update({ nombre, nombre_usuario: nombreUsuario, bio, sitio, avatar_path })
        .eq("id", perfil.id)
        .select()
        .single();

      if (updateError) throw updateError;

      onGuardado(armarPerfil(data));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 flex items-end sm:items-center justify-center">
      <div className="w-full sm:max-w-sm bg-[#2c1a47] rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 pb-4 shrink-0">
          <h2 className="text-white font-bold text-base">Editar perfil</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form
          id="form-editar-perfil"
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 px-5 overflow-y-auto"
        >
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
            <label className="text-gray-400 text-xs">Nombre de usuario</label>
            <input
              value={nombreUsuario}
              onChange={(e) => setNombreUsuario(e.target.value)}
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

          <div className="flex flex-col gap-1 pb-2">
            <label className="text-gray-400 text-xs">Sitio web</label>
            <input
              value={sitio}
              onChange={(e) => setSitio(e.target.value)}
              className="bg-white/10 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}
        </form>

        <div className="p-5 pt-3 shrink-0 border-t border-white/10">
          <button
            type="submit"
            form="form-editar-perfil"
            disabled={guardando}
            className="w-full bg-gradient-to-tr from-pink-500 via-fuchsia-500 to-purple-500 text-white font-semibold rounded-xl py-3 text-sm disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
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

      // Notifica que se agrego una foto nueva
      notificarFotoAgregada();

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la foto");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 flex items-end sm:items-center justify-center">
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