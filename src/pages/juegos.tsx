import { Link } from "react-router-dom";
import { Flame, Brain, Target, HeartHandshake, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
/* Ajusta la ruta o la extensión si tu archivo es distinto (.wav, .ogg, etc.) */
import openGameSound from "../assets/OpenGame.mp3";

/* Misma curva de animación que Inicio.tsx (resorte suave estilo iOS) */
const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

/* Se crea fuera del componente para que siga sonando aunque cambie la pantalla */
const sonidoAbrir = new Audio(openGameSound);
sonidoAbrir.preload = "auto";

function reproducirSonidoAbrir() {
  sonidoAbrir.currentTime = 0;
  sonidoAbrir.play().catch(() => {
    /* si el navegador bloquea el audio, el juego se abre igual */
  });
}

interface Juego {
  id: number;
  key: string;
  to: string | null;
  nombre: string;
  descripcion: string;
  etiquetas: string[];
  icon: LucideIcon;
  color: string;
  disponible: boolean;
}

const juegos: Juego[] = [
  {
    id: 1,
    key: "chispa",
    to: "/juegos/chispa",
    nombre: "Chispa",
    descripcion: "Cartas y retos para subir la temperatura, a su ritmo.",
    etiquetas: ["Cartas", "Retos", "Para dos"],
    icon: Flame,
    color: "from-[#EC4899] to-[#FB923C]",
    disponible: true,
  },
  {
    id: 2,
    key: "memoria",
    to: null,
    nombre: "Memoria",
    descripcion: "Encuentra las parejas y demuestra tu memoria.",
    etiquetas: [],
    icon: Brain,
    color: "from-[#D946EF] to-[#EC4899]",
    disponible: false,
  },
  {
    id: 3,
    key: "retos",
    to: null,
    nombre: "Retos",
    descripcion: "Completa retos divertidos juntos.",
    etiquetas: [],
    icon: Target,
    color: "from-[#FACC15] to-[#FB923C]",
    disponible: false,
  },
  {
    id: 4,
    key: "quiz",
    to: null,
    nombre: "Quiz de Pareja",
    descripcion: "Descubre qué tanto conocen sus gustos.",
    etiquetas: [],
    icon: HeartHandshake,
    color: "from-[#8B5CF6] to-[#D946EF]",
    disponible: false,
  },
];

/* Ícono dentro de un "squircle" con degradado y brillo superior, como los íconos de iOS */
function IconoJuego({
  icon: Icon,
  color,
  tamano = 48,
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

function Juegos() {
  const disponibles = juegos.filter((j) => j.disponible);
  const proximos = juegos.filter((j) => !j.disponible);

  return (
     <section
      className="juegos-root min-h-[100dvh] bg-[#1B1033] text-white px-4 sm:px-6 pt-6 sm:pt-10"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom) + 2.5rem)",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, sans-serif',
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <style>{`
        .juegos-root {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
          overscroll-behavior-y: contain;
        }
        @keyframes entrar {
          from { opacity: 0; transform: translate3d(0, 12px, 0); }
          to { opacity: 1; transform: none; }
        }
        .entrar { animation: entrar 520ms ${EASE} both; }

        .press {
          transition: transform 380ms ${EASE}, background-color 250ms ease;
          touch-action: manipulation;
        }
        .press:active { transform: scale(0.975); transition-duration: 90ms; }

        @media (prefers-reduced-motion: reduce) {
          .entrar { animation: none; }
          .press { transition: none; }
        }
      `}</style>

      <div className="mx-auto max-w-md sm:max-w-lg">
        {/* Encabezado */}
        <header className="entrar mb-7">
          <h1 className="text-[32px] font-bold tracking-tight leading-none">Juegos</h1>
          <p className="mt-2 text-[15px] text-[#B8B5C9]">
            Elijan uno y pásenla bien juntos.
          </p>
        </header>

        {/* Disponible */}
        {disponibles.length > 0 && (
          <>
            <h2
              className="entrar mb-2.5 px-1 text-[13px] font-semibold uppercase tracking-wider text-white/45"
              style={{ animationDelay: "40ms" }}
            >
              Disponible
            </h2>

            <div className="space-y-3">
              {disponibles.map((juego, index) => {
                const contenido = (
                  <>
                    {/* Tinte suave de fondo */}
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_0%_0%,rgba(236,72,153,0.16),transparent_60%)]" />

                    <div className="relative flex items-center gap-4">
                      <IconoJuego icon={juego.icon} color={juego.color} tamano={60} />
                      <div className="min-w-0">
                        <h3 className="text-[22px] font-bold tracking-tight leading-tight">
                          {juego.nombre}
                        </h3>
                        <p className="mt-0.5 text-[14px] leading-snug text-[#B8B5C9]">
                          {juego.descripcion}
                        </p>
                      </div>
                    </div>

                    {juego.etiquetas.length > 0 && (
                      <div className="relative mt-4 flex flex-wrap gap-1.5">
                        {juego.etiquetas.map((e) => (
                          <span
                            key={e}
                            className="rounded-full bg-white/[0.07] px-2.5 py-1 text-[11px] font-medium text-white/70"
                          >
                            {e}
                          </span>
                        ))}
                      </div>
                    )}

                    <div
                      className={`relative mt-5 flex items-center justify-center gap-1 rounded-2xl bg-gradient-to-r ${juego.color} py-3.5 text-[15px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]`}
                    >
                      Jugar
                      <ChevronRight size={18} strokeWidth={2.4} />
                    </div>
                  </>
                );

                const clases =
                  "relative block overflow-hidden rounded-[28px] border border-white/10 bg-[#2A1847] p-5 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.7)]";

                return juego.to ? (
                  <Link
                    key={juego.id}
                    to={juego.to}
                    draggable={false}
                    onClick={() => {
                      reproducirSonidoAbrir();
                      try {
                        navigator.vibrate?.(8);
                      } catch {
                        /* noop */
                      }
                    }}
                    className={`entrar press ${clases}`}
                    style={{ animationDelay: `${80 + index * 70}ms` }}
                  >
                    {contenido}
                  </Link>
                ) : (
                  <div
                    key={juego.id}
                    className={`entrar ${clases}`}
                    style={{ animationDelay: `${80 + index * 70}ms` }}
                  >
                    {contenido}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Próximamente: lista agrupada estilo Ajustes de iOS */}
        {proximos.length > 0 && (
          <>
            <h2
              className="entrar mb-2.5 mt-8 px-1 text-[13px] font-semibold uppercase tracking-wider text-white/45"
              style={{ animationDelay: "200ms" }}
            >
              Próximamente
            </h2>

            <div
              className="entrar overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#2A1847]"
              style={{ animationDelay: "240ms" }}
            >
              {proximos.map((juego, index) => (
                <div
                  key={juego.id}
                  className="flex items-center gap-3.5 pl-4 pr-4"
                >
                  <div className="py-3">
                    <IconoJuego icon={juego.icon} color={juego.color} tamano={44} apagado />
                  </div>
                  <div
                    className={`flex min-w-0 flex-1 items-center gap-3 py-3.5 ${
                      index < proximos.length - 1 ? "border-b border-white/[0.07]" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold leading-tight">{juego.nombre}</p>
                      <p className="mt-0.5 truncate text-[13px] text-[#B8B5C9]">
                        {juego.descripcion}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white/[0.07] px-2.5 py-1 text-[11px] font-medium text-white/55">
                      Pronto
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <p
          className="entrar mt-8 px-4 text-center text-[12px] leading-relaxed text-[#B8B5C9]/80"
          style={{ animationDelay: "320ms" }}
        >
          Juega con respeto, comunicación y consentimiento mutuo.
        </p>
      </div>
    </section>
  );
}

export default Juegos;