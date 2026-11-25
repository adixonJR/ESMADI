import { useState, useEffect, useRef } from "react";
import {
  Heart,
  CalendarDays,
  Sparkles,
  Camera,
  Flame,
  Trophy,
  Gift,
  Gamepad2,
  BarChart3,
  BookHeart,
  ChevronRight,
  GraduationCap,
  Briefcase,
  Home,
  Plane,
  Moon,
  Utensils,
  Dumbbell,
  Car,
  BookOpen,
  Coffee,
  Music2,
  Pencil,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import supabase from "../lib/supabase.js";

/* ---------- Curva de animación estilo iOS (spring suave, sin rebote brusco) ---------- */
const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

/* ---------- Mapeo de email de la cuenta (Supabase Auth) -> personaId ----------
   Mismo mapeo usado en Perfil.tsx. Si más adelante lo cambias ahí,
   recuerda actualizarlo aquí también (o mejor, muévelo a un archivo
   compartido, ej. src/lib/personas.ts, e impórtalo en ambos lados). */
type PersonaId = 1 | 2;
const EMAIL_A_PERSONA_ID: Record<string, PersonaId> = {
  "julcaadixon25@gmail.com": 1,
  "esmeraldajanampa07@gmail.com": 2,
};

/* ---------- Caché local: la app pinta al instante y luego se actualiza ---------- */
function leerCache<T>(clave: string): T | null {
  try {
    const v = localStorage.getItem(clave);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}
function guardarCache(clave: string, valor: unknown) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    /* sin espacio / modo privado: ignorar */
  }
}

/* ---------- Vibración ligera (Android; en iOS Safari se ignora sin errores) ---------- */
function vibrar(ms = 8) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* noop */
  }
}

/* ---------- Helpers de fechas ---------- */
function diasEntre(desde: Date, hasta: Date) {
  const a = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate());
  const b = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate());
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}
function diaDelAnio(fecha: Date) {
  const inicio = new Date(fecha.getFullYear(), 0, 0);
  const diff = fecha.getTime() - inicio.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
function diasHastaProximo(mes: number, dia: number) {
  const hoy = new Date();
  const hoySinHora = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  let proxima = new Date(hoy.getFullYear(), mes - 1, dia);
  if (proxima < hoySinHora) {
    proxima = new Date(hoy.getFullYear() + 1, mes - 1, dia);
  }
  return Math.round((proxima.getTime() - hoySinHora.getTime()) / (1000 * 60 * 60 * 24));
}

/* ---------- Formato de fecha y hora para el recuerdo (created_at de Supabase) ---------- */
function formatearFecha(iso: string | null) {
  if (!iso) return null;
  const fecha = new Date(iso);
  if (isNaN(fecha.getTime())) return null;
  return fecha.toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function formatearHora(iso: string | null) {
  if (!iso) return null;
  const fecha = new Date(iso);
  if (isNaN(fecha.getTime())) return null;
  return fecha.toLocaleTimeString("es-PE", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/* ---------- Contador animado (más corto y con desaceleración suave) ---------- */
function ContadorAnimado({ valor, duracion = 1000 }: { valor: number; duracion?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let inicio: number | null = null;
    let frame: number;
    const paso = (timestamp: number) => {
      if (inicio === null) inicio = timestamp;
      const progreso = Math.min((timestamp - inicio) / duracion, 1);
      const suave = 1 - Math.pow(1 - progreso, 4); // easeOutQuart
      setDisplay(Math.round(suave * valor));
      if (progreso < 1) frame = requestAnimationFrame(paso);
    };
    frame = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(frame);
  }, [valor, duracion]);

  return <>{display.toLocaleString("es-ES")}</>;
}

/* ---------- Reveal: aparece con fade + slide suave al entrar en pantalla ---------- */
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(
    () =>
      typeof window !== "undefined" &&
      !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -20px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translate3d(0, 14px, 0)",
        transition: `opacity 420ms ${EASE} ${delay}ms, transform 520ms ${EASE} ${delay}ms`,
        willChange: visible ? "auto" : "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}

/* ---------- Hoja inferior (bottom sheet) estilo iOS: se desliza y se cierra arrastrando ---------- */
function BottomSheet({
  abierto,
  onCerrar,
  children,
}: {
  abierto: boolean;
  onCerrar: () => void;
  children: React.ReactNode;
}) {
  const [montado, setMontado] = useState(abierto);
  const [visible, setVisible] = useState(false);
  const [arrastre, setArrastre] = useState(0);
  const [arrastrando, setArrastrando] = useState(false);
  const inicioY = useRef(0);

  useEffect(() => {
    if (abierto) {
      setMontado(true);
      const id = requestAnimationFrame(() =>
        requestAnimationFrame(() => setVisible(true))
      );
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
    const t = setTimeout(() => {
      setMontado(false);
      setArrastre(0);
    }, 420);
    return () => clearTimeout(t);
  }, [abierto]);

  useEffect(() => {
    if (!montado) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previo;
      window.removeEventListener("keydown", onKey);
    };
  }, [montado, onCerrar]);

  if (!montado) return null;

  const opacidadFondo = visible ? Math.max(0, 1 - arrastre / 420) : 0;

  return (
    <>
      <div
        onClick={onCerrar}
        className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm"
        style={{
          opacity: opacidadFondo,
          transition: arrastrando ? "none" : `opacity 350ms ${EASE}`,
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-x-0 bottom-0 z-[51] mx-auto max-w-md sm:max-w-xl md:max-w-2xl rounded-t-[32px] bg-[#2A1847] shadow-2xl border-t border-white/10"
        style={{
          transform: visible ? `translate3d(0, ${arrastre}px, 0)` : "translate3d(0, 100%, 0)",
          transition: arrastrando ? "none" : `transform 450ms ${EASE}`,
          paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
          maxHeight: "88dvh",
          willChange: "transform",
        }}
      >
        {/* Zona de arrastre */}
        <div
          className="flex justify-center pt-2.5 pb-3 cursor-grab"
          style={{ touchAction: "none" }}
          onPointerDown={(e) => {
            inicioY.current = e.clientY;
            setArrastrando(true);
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!arrastrando) return;
            setArrastre(Math.max(0, e.clientY - inicioY.current));
          }}
          onPointerUp={() => {
            setArrastrando(false);
            if (arrastre > 110) {
              onCerrar();
            } else {
              setArrastre(0);
            }
          }}
          onPointerCancel={() => {
            setArrastrando(false);
            setArrastre(0);
          }}
        >
          <div className="h-[5px] w-10 rounded-full bg-white/25" />
        </div>
        <div className="overflow-y-auto overscroll-contain px-4 sm:px-5" style={{ maxHeight: "calc(88dvh - 40px)" }}>
          {children}
        </div>
      </div>
    </>
  );
}

/* ---------- Tipos ---------- */
interface ExplorarItem {
  id: string;
  to: string | null;
  icon: LucideIcon;
  iconBg: string;
  title: string;
  desc: string;
  button: string;
  buttonClass: string;
  disabled?: boolean;
}

interface RecuerdoAlbum {
  id: string;
  image_path: string | null;
  descripcion: string | null;
  created_at: string | null;
}

interface ActividadPersona {
  id: string;
  persona: "yo" | "ella";
  nombre: string;
  estado: string;
  icono: string;
  color: string;
}

/* ---------- Íconos disponibles para "¿Qué estamos haciendo?" ---------- */
const ICONOS_DISPONIBLES: { key: string; icon: LucideIcon }[] = [
  { key: "GraduationCap", icon: GraduationCap },
  { key: "Briefcase", icon: Briefcase },
  { key: "Home", icon: Home },
  { key: "Plane", icon: Plane },
  { key: "Moon", icon: Moon },
  { key: "Utensils", icon: Utensils },
  { key: "Dumbbell", icon: Dumbbell },
  { key: "Car", icon: Car },
  { key: "BookOpen", icon: BookOpen },
  { key: "Coffee", icon: Coffee },
  { key: "Music2", icon: Music2 },
  { key: "Heart", icon: Heart },
];
const ICONOS_MAP: Record<string, LucideIcon> = Object.fromEntries(
  ICONOS_DISPONIBLES.map((i) => [i.key, i.icon])
);

const CACHE_NOMBRE = "inicio:nombre";
const CACHE_AVATAR = "inicio:avatar";
const CACHE_ACTIVIDAD = "inicio:actividad";

function Inicio() {
  // Fecha local (no UTC) para que no se corra un día en zonas como Lima
  const fechaInicio = new Date(2022, 4, 22);
  const hoy = new Date();
  const diasJuntos = diasEntre(fechaInicio, hoy);
  const mensajes = [
    "Gracias por ser mi persona favorita ❤️",
    "Cada día contigo es un nuevo recuerdo ✨",
    "Contigo cualquier momento se vuelve especial 💕",
    "Siempre elegiría caminar a tu lado 🫶",
    "Eres mi lugar favorito para volver 🏡💗",
    "Contigo hasta lo simple se siente mágico 🌙",
    "Gracias por tantas risas y tantos abrazos 🤍",
    "Cada día te elijo un poco más 💫",
    "Tú y yo, siempre 🫂",
    "El amor contigo se siente fácil y bonito 🌸",
  ];
  const indiceDelDia = diaDelAnio(hoy);
  const mensaje = mensajes[indiceDelDia % mensajes.length];

  /* ---------- Barra superior que aparece al hacer scroll (estilo iOS) ---------- */
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let ocupado = false;
    const onScroll = () => {
      if (ocupado) return;
      ocupado = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 56);
        ocupado = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ---------- Nombre y avatar (con caché para que aparezcan al instante) ---------- */
  const [nombreUsuario, setNombreUsuario] = useState<string | null>(() =>
    leerCache<string>(CACHE_NOMBRE)
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() =>
    leerCache<string>(CACHE_AVATAR)
  );

  useEffect(() => {
    let activo = true;

    const cargarPerfil = async () => {
      // getSession lee la sesión local: no hace una llamada de red como getUser()
      const { data: sesion } = await supabase.auth.getSession();
      if (!activo) return;

      const email = sesion.session?.user?.email;
      if (!email) return;

      const personaId = EMAIL_A_PERSONA_ID[email.toLowerCase()];
      if (!personaId) return;

      const { data, error } = await supabase
        .from("perfil")
        .select("nombre, avatar_path")
        .eq("id", personaId)
        .maybeSingle();

      if (!activo) return;
      if (error || !data) return;

      setNombreUsuario(data.nombre);
      guardarCache(CACHE_NOMBRE, data.nombre);

      if (data.avatar_path) {
        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(data.avatar_path);
        const url = publicUrlData?.publicUrl ?? null;
        setAvatarUrl(url);
        guardarCache(CACHE_AVATAR, url);
      } else {
        setAvatarUrl(null);
        guardarCache(CACHE_AVATAR, null);
      }
    };

    cargarPerfil();
    return () => {
      activo = false;
    };
  }, []);

  /* ---------- ¿Qué estamos haciendo? (editable, desde Supabase) ---------- */
  const [actividad, setActividad] = useState<ActividadPersona[]>(
    () => leerCache<ActividadPersona[]>(CACHE_ACTIVIDAD) ?? []
  );
  const [cargandoActividad, setCargandoActividad] = useState(
    () => (leerCache<ActividadPersona[]>(CACHE_ACTIVIDAD) ?? []).length === 0
  );
  const [editandoActividad, setEditandoActividad] = useState(false);
  const [borrador, setBorrador] = useState<
    Record<string, { estado: string; icono: string }>
  >({});
  const [toast, setToast] = useState<string | null>(null);

  const mostrarToast = (texto: string) => {
    setToast(texto);
    setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => {
    if (actividad.length > 0) guardarCache(CACHE_ACTIVIDAD, actividad);
  }, [actividad]);

  useEffect(() => {
    let activo = true;

    const cargarActividad = async () => {
      const { data, error } = await supabase
        .from("actividad_actual")
        .select("id, persona, nombre, estado, icono, color")
        .order("persona", { ascending: true });

      if (!activo) return;

      if (error || !data) {
        console.error("Error cargando actividad:", error);
        setCargandoActividad(false);
        return;
      }

      setActividad(data as ActividadPersona[]);
      setCargandoActividad(false);
    };

    cargarActividad();

    // Tiempo real: si la otra persona cambia su estado, se actualiza sin recargar.
    const canal = supabase
      .channel("actividad_actual_cambios")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "actividad_actual" },
        (payload) => {
          if (!activo) return;

          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            const fila = payload.new as ActividadPersona;
            setActividad((prev) => {
              const existe = prev.some((p) => p.id === fila.id);
              if (existe) {
                return prev.map((p) => (p.id === fila.id ? fila : p));
              }
              return [...prev, fila].sort((a, b) =>
                a.persona.localeCompare(b.persona)
              );
            });
          } else if (payload.eventType === "DELETE") {
            const fila = payload.old as ActividadPersona;
            setActividad((prev) => prev.filter((p) => p.id !== fila.id));
          }
        }
      )
      .subscribe();

    return () => {
      activo = false;
      supabase.removeChannel(canal);
    };
  }, []);

  const abrirEdicionActividad = () => {
    const inicial: Record<string, { estado: string; icono: string }> = {};
    actividad.forEach((p) => {
      inicial[p.id] = { estado: p.estado, icono: p.icono };
    });
    setBorrador(inicial);
    setEditandoActividad(true);
    vibrar(6);
  };

  const cerrarEdicion = () => setEditandoActividad(false);

  // Actualización optimista: la pantalla cambia al instante y se guarda en segundo plano.
  const guardarActividad = async () => {
    const anterior = actividad;
    const nuevas = anterior.map((p) => {
      const b = borrador[p.id];
      if (!b) return p;
      return { ...p, estado: b.estado.trim() || p.estado, icono: b.icono };
    });
    const modificadas = nuevas.filter(
      (p, i) => p.estado !== anterior[i].estado || p.icono !== anterior[i].icono
    );

    vibrar(10);
    setActividad(nuevas);
    setEditandoActividad(false);
    if (modificadas.length === 0) return;

    const resultados = await Promise.all(
      modificadas.map((p) =>
        supabase
          .from("actividad_actual")
          .update({ estado: p.estado, icono: p.icono })
          .eq("id", p.id)
      )
    );

    if (resultados.some((r) => r.error)) {
      console.error("Error guardando actividad:", resultados.map((r) => r.error));
      setActividad(anterior);
      mostrarToast("No se pudo guardar. Intenta de nuevo.");
    }
  };

  /* ---------- Recuerdo aleatorio (desde Supabase) ---------- */
  const [recuerdo, setRecuerdo] = useState<RecuerdoAlbum | null>(null);
  const [recuerdoUrl, setRecuerdoUrl] = useState<string | null>(null);
  const [cargandoRecuerdo, setCargandoRecuerdo] = useState(true);
  const [imagenCargada, setImagenCargada] = useState(false);

  useEffect(() => {
    let activo = true;

    const cargarRecuerdoAleatorio = async () => {
      const { data, error } = await supabase
        .from("album")
        .select("id, image_path, descripcion, created_at");

      if (!activo) return;

      if (error || !data || data.length === 0) {
        if (error) console.error("Error cargando recuerdo:", error);
        setCargandoRecuerdo(false);
        return;
      }

      const indiceAleatorio = Math.floor(Math.random() * data.length);
      const elegido = data[indiceAleatorio] as RecuerdoAlbum;
      setRecuerdo(elegido);

      if (elegido.image_path) {
        const { data: publicUrlData } = supabase.storage
          .from("fotos")
          .getPublicUrl(elegido.image_path);
        setRecuerdoUrl(publicUrlData?.publicUrl ?? null);
      } else {
        setRecuerdoUrl(null);
      }

      setCargandoRecuerdo(false);
    };

    cargarRecuerdoAleatorio();

    return () => {
      activo = false;
    };
  }, []);

  const proximasFechas = [
    {
      emoji: "🎂",
      titulo: "Cumpleaños de Adixon",
      fechaTexto: "25 Abril",
      dias: diasHastaProximo(4, 25),
    },
    {
      emoji: "🎂",
      titulo: "Cumpleaños de Esmeralda",
      fechaTexto: "7 Febrero",
      dias: diasHastaProximo(2, 7),
    },
    {
      emoji: "💘",
      titulo: "Aniversario",
      fechaTexto: "17 Marzo",
      dias: diasHastaProximo(3, 17),
    },
  ];

  const explorarItems: ExplorarItem[] = [
    {
      id: "juegos",
      to: "/juegos",
      icon: Gamepad2,
      iconBg: "from-pink-500 to-orange-400",
      title: "Juegos",
      desc: "Preguntas, retos y minijuegos para compartir momentos juntos.",
      button: "Jugar ahora",
      buttonClass: "bg-gradient-to-r from-pink-500 to-orange-400 text-white",
    },
    {
      id: "progreso",
      to: "/progreso",
      icon: BarChart3,
      iconBg: "from-blue-500 to-cyan-400",
      title: "Progreso",
      desc: "Descubre cuánto ha crecido su historia y los logros obtenidos.",
      button: "Ver progreso",
      buttonClass: "bg-[#3D2B61] text-gray-300",
    },
    {
      id: "historia",
      to: "/nosotros",
      icon: BookHeart,
      iconBg: "from-purple-500 to-fuchsia-500",
      title: "Nuestra Historia",
      desc: "Revive cada recuerdo, cada foto y los momentos más especiales.",
      button: "Explorar",
      buttonClass: "bg-[#3D2B61] text-gray-300",
    },
    {
      id: "cartas",
      to: null,
      icon: Heart,
      iconBg: "from-pink-500 to-red-500",
      title: "Cartas",
      desc: "Muy pronto podrás escribir cartas para guardar por siempre.",
      button: "Próximamente",
      buttonClass: "bg-[#3D2B61] text-gray-500",
      disabled: true,
    },
  ];

  return (
    <div
      className="ios-root min-h-[100dvh] bg-[#1B1033] text-white px-4 sm:px-6 md:px-8"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom) + 2.5rem)",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, sans-serif',
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <style>{`
        .ios-root {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
          overscroll-behavior-y: contain;
        }
        .ios-root input { -webkit-user-select: text; user-select: text; }

        /* Efecto de pulsación: se hunde al tocar y vuelve con un resorte suave */
        .press {
          transition: transform 380ms ${EASE}, background-color 250ms ease, opacity 250ms ease;
          touch-action: manipulation;
        }
        .press:active {
          transform: scale(0.96);
          transition-duration: 90ms;
        }
        .press-sm:active { transform: scale(0.92); transition-duration: 90ms; }

        @keyframes flotar {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animar-flotar { animation: flotar 3.2s ease-in-out infinite; }

        @keyframes brillo {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .brillo-esqueleto {
          background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.13) 37%, rgba(255,255,255,0.05) 63%);
          background-size: 400% 100%;
          animation: brillo 1.4s ease-in-out infinite;
        }

        @keyframes toast-in {
          from { opacity: 0; transform: translate(-50%, 16px) scale(0.96); }
          to { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
        .toast-in { animation: toast-in 380ms ${EASE} both; }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        @media (prefers-reduced-motion: reduce) {
          .animar-flotar, .brillo-esqueleto { animation: none; }
          .press, .toast-in { transition: none; animation: none; }
        }
      `}</style>

      {/* Barra superior translúcida (aparece al bajar, como en iOS) */}
      <div
        className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#1B1033]/70 backdrop-blur-xl backdrop-saturate-150"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          opacity: scrolled ? 1 : 0,
          transform: scrolled ? "translate3d(0,0,0)" : "translate3d(0,-8px,0)",
          transition: `opacity 300ms ${EASE}, transform 400ms ${EASE}`,
          pointerEvents: scrolled ? "auto" : "none",
        }}
      >
        <div className="mx-auto flex h-11 max-w-md sm:max-w-xl md:max-w-2xl items-center justify-center gap-2">
          <Heart size={15} className="fill-pink-400 text-pink-400" />
          <span className="text-[15px] font-semibold">Nuestro Espacio</span>
        </div>
      </div>

      <div style={{ height: "env(safe-area-inset-top)" }} />

      <div className="max-w-md sm:max-w-xl md:max-w-2xl mx-auto">
        {/* Saludo (título grande) */}
        <Reveal className="pt-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[28px] sm:text-3xl font-bold tracking-tight">
              ¡Hola,
              {nombreUsuario ? (
                <span className="text-pink-400"> {nombreUsuario}!</span>
              ) : (
                <span className="ml-2 inline-block h-6 w-24 align-middle rounded-full brillo-esqueleto" />
              )}
            </h2>
            <p className="text-gray-400 mt-1 text-sm sm:text-base">
              Bienvenido a nuestro pequeño mundo.
            </p>
          </div>

          <Link
            to="/perfil"
            onClick={() => vibrar(6)}
            className="press press-sm shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 via-fuchsia-500 to-purple-500"
          >
            <div className="w-full h-full rounded-full bg-[#1B1033] flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Foto de perfil"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="relative w-[22px] h-[22px]">
                  <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[10px] h-[10px] rounded-full bg-pink-300" />
                  <div
                    className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[20px] h-[11px] bg-pink-300"
                    style={{ borderRadius: "50% 50% 0 0 / 100% 100% 0 0" }}
                  />
                </div>
              )}
            </div>
          </Link>
        </Reveal>

        {/* Banner */}
        <Reveal className="mt-6" delay={40}>
          <div className="rounded-[28px] p-5 sm:p-6 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-orange-400 shadow-xl shadow-pink-500/20">
            <div className="flex flex-row items-center justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Nuestro Espacio
                </h1>
                <p className="text-white/90 mt-2 text-sm sm:text-base">
                  <ContadorAnimado valor={diasJuntos} /> días creando recuerdos juntos.
                </p>
              </div>
              <Heart className="fill-white shrink-0 animar-flotar" size={40} />
            </div>
            <Link
              to="/nosotros"
              onClick={() => vibrar(6)}
              className="press mt-6 inline-flex items-center gap-2 bg-white text-pink-600 font-semibold px-4 sm:px-5 py-2.5 sm:py-3 rounded-full text-sm sm:text-base"
            >
              Ver nuestra historia
              <ChevronRight size={18} />
            </Link>
          </div>
        </Reveal>

        {/* Contador */}
        <Reveal className="mt-5" delay={70}>
          <div className="bg-[#2A1847] rounded-[28px] p-4 sm:p-5 border border-white/5">
            <div className="flex items-center gap-3">
              <CalendarDays className="text-pink-400" />
              <h3 className="font-bold text-lg sm:text-xl">Tiempo juntos</h3>
            </div>
            <div className="mt-5 text-center">
              <p className="text-5xl sm:text-6xl font-bold text-pink-400 tabular-nums tracking-tight">
                <ContadorAnimado valor={diasJuntos} />
              </p>
              <p className="text-gray-300 mt-2 text-sm sm:text-base">
                días compartiendo momentos ❤️
              </p>
            </div>
          </div>
        </Reveal>

        {/* Mensaje */}
        <Reveal className="mt-5">
          <div className="bg-[#2A1847] rounded-[28px] p-4 sm:p-5 border border-white/5">
            <div className="flex items-center gap-3">
              <Sparkles className="text-yellow-400 animate-pulse" />
              <h3 className="font-bold text-lg sm:text-xl">Mensaje del día</h3>
            </div>
            <p className="text-gray-300 mt-4 italic text-sm sm:text-base">
              "{mensaje}"
            </p>
          </div>
        </Reveal>

        {/* Recuerdo (aleatorio, desde Supabase) */}
        <Reveal className="mt-5">
          <div className="relative rounded-[28px] overflow-hidden bg-gradient-to-r from-purple-700 to-pink-700 shadow-xl min-h-[22rem] sm:min-h-[26rem] flex flex-col">
            {!cargandoRecuerdo && recuerdo && recuerdoUrl && (
              <>
                {!imagenCargada && (
                  <div className="absolute inset-0 brillo-esqueleto" />
                )}
                <img
                  ref={(el) => {
                    if (el?.complete && el.naturalWidth > 0) setImagenCargada(true);
                  }}
                  src={recuerdoUrl}
                  alt={recuerdo.descripcion || "Recuerdo"}
                  decoding="async"
                  onLoad={() => setImagenCargada(true)}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{
                    opacity: imagenCargada ? 1 : 0,
                    transform: imagenCargada ? "scale(1)" : "scale(1.04)",
                    transition: `opacity 600ms ${EASE}, transform 900ms ${EASE}`,
                  }}
                />
              </>
            )}

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/80" />

            <div className="relative z-10 flex items-center gap-3 p-4 sm:p-5">
              <Camera className="text-white" />
              <h3 className="font-bold text-lg sm:text-xl">Recuerdo del día</h3>
            </div>

            <div className="relative z-10 mt-auto bg-gradient-to-t from-black/75 via-black/40 to-transparent px-5 pb-5 pt-14 text-center sm:px-6 sm:pb-6 sm:pt-16">
              {cargandoRecuerdo ? (
                <div className="mx-auto flex max-w-xs flex-col items-center gap-2.5">
                  <div className="h-3.5 w-3/4 rounded-full brillo-esqueleto" />
                  <div className="h-3 w-1/2 rounded-full brillo-esqueleto" />
                </div>
              ) : recuerdo ? (
                <div className="mx-auto flex max-w-md flex-col items-center gap-2">
                  <p className="line-clamp-2 text-balance text-sm font-medium leading-snug text-white drop-shadow-md sm:text-base">
                    {recuerdo.descripcion || ""}
                  </p>

                  {recuerdo.created_at && (
                    <div className="flex items-center justify-center gap-2 whitespace-nowrap text-[11px] font-medium text-white/85 drop-shadow sm:text-xs">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-3.5 w-3.5 shrink-0 text-white/70"
                        aria-hidden="true"
                      >
                        <rect x="3" y="4.5" width="18" height="16" rx="3" />
                        <path d="M8 2.5v4M16 2.5v4M3 9.5h18" />
                      </svg>
                      <time dateTime={recuerdo.created_at}>
                        {formatearFecha(recuerdo.created_at)}
                      </time>

                      <span
                        className="mx-0.5 h-1 w-1 shrink-0 rounded-full bg-white/50"
                        aria-hidden="true"
                      />

                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-3.5 w-3.5 shrink-0 text-white/70"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" />
                      </svg>
                      <time dateTime={recuerdo.created_at}>
                        {formatearHora(recuerdo.created_at)}
                      </time>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-white/80 drop-shadow sm:text-base">
                  Aún no hay recuerdos guardados en el álbum.
                </p>
              )}
            </div>
          </div>
        </Reveal>

        {/* ¿Qué estamos haciendo? */}
        <Reveal className="mt-5">
          <div className="bg-[#2A1847] rounded-[28px] p-4 sm:p-5 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg sm:text-xl">¿Qué estamos haciendo?</h3>

              <button
                onClick={abrirEdicionActividad}
                disabled={cargandoActividad || actividad.length === 0}
                className="press press-sm flex items-center gap-1 text-xs sm:text-sm text-pink-400 font-semibold px-3 py-1.5 rounded-full bg-white/5 disabled:opacity-40"
              >
                <Pencil size={13} />
                Editar
              </button>
            </div>

            {cargandoActividad ? (
              <div className="grid grid-cols-2 gap-3">
                {[0, 1].map((i) => (
                  <div key={i} className="bg-[#1B1033] rounded-3xl h-28 brillo-esqueleto" />
                ))}
              </div>
            ) : actividad.length === 0 ? (
              <p className="text-gray-400 text-sm">Aún no hay estados configurados.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {actividad.map((persona) => {
                  const Icon = ICONOS_MAP[persona.icono] ?? Heart;
                  return (
                    <button
                      key={persona.id}
                      onClick={abrirEdicionActividad}
                      className="press bg-[#1B1033] rounded-3xl p-3 sm:p-4 flex flex-col items-center text-center"
                    >
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br ${persona.color} flex items-center justify-center shadow-lg`}
                      >
                        <Icon size={20} className="text-white" />
                      </div>
                      <p className="mt-2 text-sm sm:text-base font-semibold">{persona.nombre}</p>
                      <p className="text-gray-400 text-xs sm:text-sm mt-0.5">{persona.estado}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Reveal>

        {/* Explorar — Carrusel */}
        <Reveal className="mt-8">
          <h2 className="text-lg sm:text-xl font-bold text-yellow-300 mb-4">Explorar</h2>
          <ExplorarCarrusel items={explorarItems} />
        </Reveal>

        {/* Nuestra aventura */}
        <Reveal className="mt-8">
          <h2 className="text-lg sm:text-xl font-bold text-yellow-300 mb-4">Nuestra aventura</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="press bg-[#2A1847] rounded-[28px] p-4 sm:p-6 text-center border border-white/5">
              <Trophy className="mx-auto text-yellow-400" size={30} />
              <p className="text-gray-400 mt-3 text-sm sm:text-base">Logros</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-yellow-300 mt-2">12</h3>
            </div>
            <div className="press bg-[#2A1847] rounded-[28px] p-4 sm:p-6 text-center border border-white/5">
              <Flame className="mx-auto text-orange-400" size={30} />
              <p className="text-gray-400 mt-3 text-sm sm:text-base">Días juntos</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-pink-400 mt-2 tabular-nums">
                <ContadorAnimado valor={diasJuntos} />
              </h3>
            </div>
          </div>
        </Reveal>

        {/* Acciones rápidas */}
        <Reveal className="mt-8">
          <h2 className="text-lg sm:text-xl font-bold text-yellow-300 mb-4">Acciones rápidas</h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <button
              onClick={() => vibrar(6)}
              className="press bg-[#2A1847] rounded-3xl p-3 sm:p-5 border border-white/5"
            >
              <Camera className="mx-auto text-pink-400" size={26} />
              <p className="mt-2 sm:mt-3 text-xs sm:text-sm">Fotos</p>
            </button>
            <button
              onClick={() => vibrar(6)}
              className="press bg-[#2A1847] rounded-3xl p-3 sm:p-5 border border-white/5"
            >
              <Gift className="mx-auto text-purple-400" size={26} />
              <p className="mt-2 sm:mt-3 text-xs sm:text-sm">Recuerdos</p>
            </button>
            <button
              onClick={() => vibrar(6)}
              className="press bg-[#2A1847] rounded-3xl p-3 sm:p-5 border border-white/5"
            >
              <Heart className="mx-auto text-red-400 fill-red-400" size={26} />
              <p className="mt-2 sm:mt-3 text-xs sm:text-sm">Carta</p>
            </button>
          </div>
        </Reveal>

        {/* Próximas fechas */}
        <Reveal className="mt-8">
          <h2 className="text-lg sm:text-xl font-bold text-yellow-300 mb-4">Próximas fechas ❤️</h2>
          <div className="bg-[#2A1847] rounded-[28px] p-4 sm:p-5 space-y-4 border border-white/5">
            {proximasFechas.map((item, i) => (
              <div key={item.titulo}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm sm:text-base">
                      {item.emoji} {item.titulo}
                    </p>
                    <p className="text-gray-400 text-xs sm:text-sm">{item.fechaTexto}</p>
                  </div>
                  <span
                    className={`text-pink-400 text-xs sm:text-sm text-right ${
                      item.dias === 0 ? "animate-pulse font-semibold" : ""
                    }`}
                  >
                    {item.dias === 0
                      ? "¡Es hoy! 🎉"
                      : item.dias === 1
                      ? "Falta 1 día"
                      : `Faltan ${item.dias} días`}
                  </span>
                </div>
                {i < proximasFechas.length - 1 && (
                  <div className="border-t border-white/10 mt-4"></div>
                )}
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      {/* Hoja inferior para editar el estado (fuera de los Reveal para que position:fixed funcione) */}
      <BottomSheet abierto={editandoActividad} onCerrar={cerrarEdicion}>
        <div className="flex items-center justify-between pb-4">
          <button
            onClick={cerrarEdicion}
            className="press press-sm text-[15px] text-gray-300 px-2 py-1"
          >
            Cancelar
          </button>
          <h3 className="text-[15px] font-semibold">¿Qué estamos haciendo?</h3>
          <button
            onClick={guardarActividad}
            className="press press-sm text-[15px] font-semibold text-pink-400 px-2 py-1"
          >
            Listo
          </button>
        </div>

        <div className="space-y-4 pb-2">
          {actividad.map((persona) => (
            <div key={persona.id} className="bg-[#1B1033] rounded-3xl p-3 sm:p-4">
              <p className="text-sm font-semibold mb-3">{persona.nombre}</p>

              <div className="grid grid-cols-6 gap-2 mb-3">
                {ICONOS_DISPONIBLES.map(({ key, icon: Icon }) => {
                  const seleccionado = borrador[persona.id]?.icono === key;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        vibrar(5);
                        setBorrador((prev) => ({
                          ...prev,
                          [persona.id]: {
                            estado: prev[persona.id]?.estado ?? persona.estado,
                            icono: key,
                          },
                        }));
                      }}
                      className={`press press-sm aspect-square rounded-2xl flex items-center justify-center ${
                        seleccionado
                          ? "bg-gradient-to-br from-pink-500 to-fuchsia-400 shadow-lg shadow-pink-500/30"
                          : "bg-white/5"
                      }`}
                      style={{
                        transform: seleccionado ? "scale(1.06)" : undefined,
                      }}
                    >
                      <Icon size={18} className="text-white" />
                    </button>
                  );
                })}
              </div>

              <input
                type="text"
                value={borrador[persona.id]?.estado ?? ""}
                onChange={(e) =>
                  setBorrador((prev) => ({
                    ...prev,
                    [persona.id]: {
                      icono: prev[persona.id]?.icono ?? persona.icono,
                      estado: e.target.value,
                    },
                  }))
                }
                placeholder="¿Qué está haciendo?"
                maxLength={40}
                // text-base (16px) evita el zoom automático de iOS al enfocar un input
                className="w-full bg-[#2A1847] rounded-2xl px-4 py-3 text-base text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-pink-400 transition-shadow"
              />
            </div>
          ))}
        </div>
      </BottomSheet>

      {/* Aviso (toast) */}
      {toast && (
        <div
          className="toast-in fixed left-1/2 z-[60] rounded-full bg-white/15 px-4 py-2.5 text-sm font-medium backdrop-blur-xl border border-white/10 shadow-xl"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 24px)" }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

/* ---------- Carrusel de Explorar: desliza con el dedo y se ajusta (snap) como en iOS ---------- */
function ExplorarCarrusel({ items }: { items: ExplorarItem[] }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const raf = useRef<number | null>(null);

  const getStep = () => {
    const track = trackRef.current;
    if (!track || !track.children[0]) return 0;
    const card = track.children[0] as HTMLElement;
    const style = window.getComputedStyle(track);
    const gap = parseFloat(style.columnGap || style.gap || "0");
    return card.offsetWidth + gap;
  };

  const onScroll = () => {
    if (raf.current !== null) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = null;
      const track = trackRef.current;
      if (!track) return;
      const step = getStep();
      if (!step) return;
      const maxScroll = track.scrollWidth - track.clientWidth;
      const idx =
        track.scrollLeft >= maxScroll - 2
          ? items.length - 1
          : Math.round(track.scrollLeft / step);
      setActiveIndex((prev) =>
        prev === idx ? prev : Math.max(0, Math.min(idx, items.length - 1))
      );
    });
  };

  useEffect(() => {
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, []);

  const irA = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: getStep() * i, behavior: "smooth" });
    vibrar(5);
  };

  return (
    <div>
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 snap-x snap-mandatory scroll-px-4 sm:-mx-6 sm:px-6 sm:scroll-px-6 md:-mx-8 md:px-8 md:scroll-px-8"
        style={{ WebkitOverflowScrolling: "touch", overscrollBehaviorX: "contain" }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const contenido = (
            <div className="bg-[#2A1847] rounded-3xl p-3 sm:p-4 border border-white/5 h-full flex flex-col text-left">
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br ${item.iconBg} flex items-center justify-center shadow-lg`}
              >
                <Icon size={19} />
              </div>
              <h3 className="mt-3 text-sm sm:text-base font-bold leading-tight">{item.title}</h3>
              <p className="text-gray-400 text-[11px] sm:text-xs mt-1.5 leading-snug flex-1">
                {item.desc}
              </p>
              <span
                className={`mt-3 block w-full text-center rounded-xl py-2 text-[11px] sm:text-xs font-semibold ${
                  item.buttonClass
                } ${item.disabled ? "cursor-not-allowed" : ""}`}
              >
                {item.button}
              </span>
            </div>
          );

          return (
            <div
              key={item.id}
              className="snap-start shrink-0 w-[140px] sm:w-[170px] md:w-[190px]"
            >
              {item.to && !item.disabled ? (
                <Link
                  to={item.to}
                  onClick={() => vibrar(6)}
                  className="press block h-full"
                  draggable={false}
                >
                  {contenido}
                </Link>
              ) : (
                <div className="h-full opacity-80">{contenido}</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-center gap-1.5 mt-3">
        {items.map((item, i) => (
          <button
            key={item.id}
            onClick={() => irA(i)}
            className="h-1.5 rounded-full"
            style={{
              width: i === activeIndex ? 20 : 6,
              backgroundColor:
                i === activeIndex ? "rgb(244 114 182)" : "rgba(255,255,255,0.2)",
              transition: `width 400ms ${EASE}, background-color 300ms ease`,
            }}
            aria-label={`Ir a la tarjeta ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default Inicio;