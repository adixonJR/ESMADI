import {
  Flame,
  Lock,
  Trophy,
  Hourglass,
  Timer,
  Compass,
  Heart,
  HeartHandshake,
  Crown,
  Gamepad2,
  Zap,
  ChevronRight,
  Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CienCosas from "../conponents/CienCosas";
import { useState, useEffect } from "react";

/* Misma curva de animación que Inicio, Juegos y Nosotros (resorte suave estilo iOS) */
const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

interface Logro {
  titulo: string;
  descripcion: string;
  Icono: LucideIcon;
  color: string;
  conseguido: boolean;
}

const logros: Logro[] = [
  {
    titulo: "100 cosas por hacer",
    descripcion: "100 cosas a lo largo de nuestra vida",
    Icono: Hourglass,
    color: "from-[#8B5CF6] to-[#D946EF]",
    conseguido: true,
  },
  {
    titulo: "cosas por hacer",
    descripcion: "cosas por hacer dependiendo el tiempo",
    Icono: Timer,
    color: "from-[#6366F1] to-[#8B5CF6]",
    conseguido: true,
  },
  {
    titulo: "Primer juego completado",
    descripcion: "Completaste tu primera aventura juntos.",
    Icono: Trophy,
    color: "from-[#FACC15] to-[#FB923C]",
    conseguido: true,
  },
  {
    titulo: "Pareja exploradora",
    descripcion: "Han jugado varios juegos juntos.",
    Icono: Compass,
    color: "from-[#06B6D4] to-[#3B82F6]",
    conseguido: true,
  },
  {
    titulo: "Grandes recuerdos",
    descripcion: "Acumula momentos especiales.",
    Icono: Heart,
    color: "from-[#EC4899] to-[#FB923C]",
    conseguido: true,
  },
  {
    titulo: "Racha de fuego",
    descripcion: "Jueguen 7 días seguidos.",
    Icono: Flame,
    color: "from-[#FB923C] to-[#EC4899]",
    conseguido: false,
  },
  {
    titulo: "Complicidad total",
    descripcion: "Completen 20 retos de la categoría Complicidad.",
    Icono: HeartHandshake,
    color: "from-[#D946EF] to-[#EC4899]",
    conseguido: false,
  },
  {
    titulo: "Maestros del romance",
    descripcion: "Alcancen el nivel 100% de pareja.",
    Icono: Crown,
    color: "from-[#8B5CF6] to-[#EC4899]",
    conseguido: false,
  },
];

const estadisticas: {
  label: string;
  valor: string;
  Icono: LucideIcon;
  color: string;
}[] = [
  { label: "Juegos jugados", valor: "12", Icono: Gamepad2, color: "from-[#EC4899] to-[#FB923C]" },
  { label: "Retos completados", valor: "47", Icono: Zap, color: "from-[#FACC15] to-[#FB923C]" },
  { label: "Racha actual", valor: "3 días", Icono: Flame, color: "from-[#FB923C] to-[#EC4899]" },
];

const categorias = [
  { nombre: "Romántico", progreso: 80, color: "bg-[#EC4899]" },
  { nombre: "Complicidad", progreso: 55, color: "bg-[#FACC15]" },
  { nombre: "Retos", progreso: 40, color: "bg-[#FB923C]" },
  { nombre: "Preguntas", progreso: 70, color: "bg-[#D946EF]" },
];

/* Ícono dentro de un "squircle" con degradado y brillo superior, como los íconos de iOS (igual que en Juegos) */
function IconoTile({
  icon: Icon,
  color,
  tamano = 44,
  apagado = false,
}: {
  icon: LucideIcon;
  color: string;
  tamano?: number;
  apagado?: boolean;
}) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-gradient-to-br ${color} flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_18px_-8px_rgba(0,0,0,0.6)] ${
        apagado ? "opacity-60 saturate-75" : ""
      }`}
      style={{ width: tamano, height: tamano, borderRadius: tamano * 0.28 }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/25 to-transparent" />
      <Icon
        className="relative text-white drop-shadow-sm"
        size={Math.round(tamano * 0.5)}
        strokeWidth={2.1}
      />
    </div>
  );
}

function Progreso() {
  const navigate = useNavigate();
  const [mostrarCienCosas, setMostrarCienCosas] = useState(false);
  const [animar, setAnimar] = useState(false);

  useEffect(() => {
    // Dispara las barras de progreso un frame después del montaje,
    // así el navegador registra el estado inicial (0%) antes de animar.
    const id = requestAnimationFrame(() => setAnimar(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (mostrarCienCosas) {
    return <CienCosas onVolver={() => setMostrarCienCosas(false)} />;
  }

  const conseguidos = logros.filter((l) => l.conseguido);
  const pendientes = logros.filter((l) => !l.conseguido);

  const esClickeable = (titulo: string) =>
    titulo === "100 cosas por hacer" || titulo === "cosas por hacer";

  const handleLogroClick = (titulo: string) => {
    if (titulo === "100 cosas por hacer") {
      setMostrarCienCosas(true);
    } else if (titulo === "cosas por hacer") {
      navigate("/metas");
    }
  };

  const renderFila = (logro: Logro, index: number, total: number) => {
    const clickeable = esClickeable(logro.titulo);
    return (
      <div
        key={logro.titulo}
        role={clickeable ? "button" : undefined}
        tabIndex={clickeable ? 0 : undefined}
        onClick={clickeable ? () => handleLogroClick(logro.titulo) : undefined}
        onKeyDown={
          clickeable
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleLogroClick(logro.titulo);
                }
              }
            : undefined
        }
        className={`flex items-center gap-3.5 pl-4 pr-4 ${
          clickeable ? "press-fila cursor-pointer" : ""
        }`}
      >
        <div className="py-3">
          <IconoTile
            icon={logro.Icono}
            color={logro.color}
            tamano={44}
            apagado={!logro.conseguido}
          />
        </div>
        <div
          className={`flex min-w-0 flex-1 items-center gap-3 py-3.5 ${
            index < total - 1 ? "border-b border-white/[0.07]" : ""
          }`}
        >
          <div className="min-w-0 flex-1">
            <p
              className={`text-[15px] font-semibold leading-tight first-letter:uppercase ${
                logro.conseguido ? "" : "text-white/70"
              }`}
            >
              {logro.titulo}
            </p>
            <p className="mt-0.5 text-[13px] leading-snug text-[#B8B5C9]">
              {logro.descripcion}
            </p>
          </div>
          {!logro.conseguido ? (
            <Lock size={16} strokeWidth={2.1} className="shrink-0 text-white/35" />
          ) : clickeable ? (
            <ChevronRight size={18} strokeWidth={2.2} className="shrink-0 text-white/30" />
          ) : (
            <Check size={18} strokeWidth={2.4} className="shrink-0 text-white/40" />
          )}
        </div>
      </div>
    );
  };

  return (
    <section
      className="progreso-root min-h-[100dvh] bg-[#1B1033] text-white px-4 sm:px-6 py-6 sm:py-10"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, sans-serif',
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <style>{`
        .progreso-root {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }
        @keyframes entrar {
          from { opacity: 0; transform: translate3d(0, 12px, 0); }
          to { opacity: 1; transform: none; }
        }
        .entrar { animation: entrar 520ms ${EASE} both; }

        .press-fila {
          transition: background-color 300ms ease;
          touch-action: manipulation;
        }
        .press-fila:active {
          background-color: rgba(255, 255, 255, 0.06);
          transition-duration: 60ms;
        }

        .barra-relleno { transition: width 900ms ${EASE}; }

        @media (prefers-reduced-motion: reduce) {
          .entrar { animation: none; }
          .press-fila { transition: none; }
          .barra-relleno { transition: none; }
        }
      `}</style>

      <div className="mx-auto max-w-md sm:max-w-lg">
        {/* Encabezado */}
        <header className="entrar mb-7">
          <h1 className="text-[32px] font-bold tracking-tight leading-none">Progreso</h1>
          <p className="mt-2 text-[15px] text-[#B8B5C9]">
            Mira todos los logros que han conseguido.
          </p>
        </header>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          {estadisticas.map((stat, i) => (
            <div
              key={stat.label}
              className="entrar rounded-[24px] border border-white/10 bg-[#2A1847] p-4"
              style={{ animationDelay: `${40 + i * 50}ms` }}
            >
              <IconoTile icon={stat.Icono} color={stat.color} tamano={36} />
              <p className="mt-3 text-[22px] font-bold leading-none tracking-tight tabular-nums">
                {stat.valor}
              </p>
              <p className="mt-1.5 text-[12px] leading-snug text-[#B8B5C9]">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Nivel de pareja */}
        <div
          className="entrar mb-3 rounded-[28px] border border-white/10 bg-[#2A1847] p-5 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.7)]"
          style={{ animationDelay: "200ms" }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-[17px] font-semibold tracking-tight">Nivel de pareja</h2>
            <span className="flex items-center gap-1 rounded-full bg-white/[0.07] px-2.5 py-1 text-[12px] font-medium text-[#FB923C]">
              <Flame size={13} strokeWidth={2.2} /> Racha 3
            </span>
          </div>
          <p className="mt-4 text-[34px] font-bold leading-none tracking-tight tabular-nums">
            65%
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="barra-relleno h-2 rounded-full bg-gradient-to-r from-[#EC4899] to-[#FB923C]"
              style={{ width: animar ? "65%" : "0%" }}
            />
          </div>
          <p className="mt-3 text-[13px] text-[#B8B5C9]">
            65% completado - Sigan creando recuerdos.
          </p>
        </div>

        {/* Progreso por categoría */}
        <div
          className="entrar rounded-[28px] border border-white/10 bg-[#2A1847] p-5 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.7)]"
          style={{ animationDelay: "260ms" }}
        >
          <h2 className="mb-5 text-[17px] font-semibold tracking-tight">
            Progreso por categoría
          </h2>
          <div className="space-y-4">
            {categorias.map((cat, i) => (
              <div key={cat.nombre}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[14px] font-medium">{cat.nombre}</span>
                  <span className="text-[13px] tabular-nums text-[#B8B5C9]">
                    {cat.progreso}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`${cat.color} barra-relleno h-2 rounded-full`}
                    style={{
                      width: animar ? `${cat.progreso}%` : "0%",
                      transitionDelay: `${i * 80}ms`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logros: listas agrupadas estilo Ajustes de iOS */}
        <div
          className="entrar mb-2.5 mt-8 flex items-baseline justify-between px-1"
          style={{ animationDelay: "320ms" }}
        >
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-white/45">
            Conseguidos
          </h2>
          <span className="text-[12px] tabular-nums text-white/45">
            {conseguidos.length} de {logros.length}
          </span>
        </div>
        <div
          className="entrar overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#2A1847]"
          style={{ animationDelay: "360ms" }}
        >
          {conseguidos.map((l, i) => renderFila(l, i, conseguidos.length))}
        </div>

        {pendientes.length > 0 && (
          <>
            <h2
              className="entrar mb-2.5 mt-8 px-1 text-[13px] font-semibold uppercase tracking-wider text-white/45"
              style={{ animationDelay: "400ms" }}
            >
              Por desbloquear
            </h2>
            <div
              className="entrar overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#2A1847]"
              style={{ animationDelay: "440ms" }}
            >
              {pendientes.map((l, i) => renderFila(l, i, pendientes.length))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default Progreso;