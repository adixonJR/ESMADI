import {
  House,
  Gamepad2,
  Trophy,
  Users,
  CalendarDays,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

function Footer() {
  const location = useLocation();
  const enJuego = location.pathname.startsWith("/juegos/chispa");
  const [tocado, setTocado] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);

  const lastScrollY = useRef(0);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const diff = currentY - lastScrollY.current;

      if (currentY <= 0) {
        setVisible(true);
      } else if (diff > 4) {
        setVisible(false);
      } else if (diff < -4) {
        setVisible(true);
      }

      lastScrollY.current = currentY;

      if (stopTimer.current) clearTimeout(stopTimer.current);
      stopTimer.current = setTimeout(() => {
        setVisible(true);
      }, 200);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (stopTimer.current) clearTimeout(stopTimer.current);
    };
  }, []);

  const items = [
    { path: "/", label: "Inicio", icon: House },
    { path: "/juegos", label: "Juegos", icon: Gamepad2 },
    { path: "/nosotros", label: "Nosotros", icon: Users },
    { path: "/progreso", label: "Progreso", icon: Trophy },
    { path: "/fechas", label: "Fechas", icon: CalendarDays },
  ];

  const emitir = (accion: "pasar" | "listo") => {
    window.dispatchEvent(new CustomEvent("chispa:accion", { detail: accion }));
  };

  const manejarTap = (path: string) => {
    setTocado(path);
    setTimeout(() => setTocado(null), 400);
  };

  return (
    <footer
      className={`fixed bottom-0 left-0 right-0 flex justify-center z-50 transition-transform duration-300 ease-in-out ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-12deg); }
          75% { transform: rotate(12deg); }
        }

        @keyframes pop-in {
          0% { transform: scale(0.6); }
          60% { transform: scale(1.25); }
          100% { transform: scale(1.1); }
        }

        .icono-wiggle {
          animation: wiggle 0.35s ease-in-out;
        }

        .icono-pop {
          animation: pop-in 0.4s cubic-bezier(0.34,1.56,0.64,1);
        }
      `}</style>

      <div className="w-full max-w-[560px] bg-[#241540]/95 backdrop-blur-xl border-t border-white/10 px-2 py-2 flex justify-around">
        {enJuego ? (
          <div className="w-full flex gap-3 px-2">
            <button
              onClick={() => emitir("pasar")}
              className="flex-1 bg-[#2A1847] border border-white/10 rounded-xl py-2.5 text-sm font-semibold text-gray-300 active:scale-95 transition-transform"
            >
              Pasar 🙈
            </button>

            <button
              onClick={() => emitir("listo")}
              className="flex-1 bg-lime-400 text-[#1B1033] rounded-xl py-2.5 text-sm font-bold active:scale-95 transition-transform"
            >
              Listo, siguiente →
            </button>
          </div>
        ) : (
          items.map((item) => {
            const Icon = item.icon;
            const fueTocado = tocado === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                onClick={() => manejarTap(item.path)}
                className={({ isActive }) =>
                  `relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 ease-out active:scale-90 ${
                    isActive
                      ? "text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/10"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Fondo animado */}
                    <span
                      className={`absolute inset-0 rounded-xl bg-pink-600 transition-all duration-300 ease-out ${
                        isActive
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-75"
                      }`}
                    />

                    {/* Brillo del icono */}
                    {isActive && (
                      <span className="absolute top-0.5 w-9 h-9 rounded-full bg-white/25 blur-md animate-pulse" />
                    )}

                    {/* Icono */}
                    <Icon
                      size={22}
                      fill={isActive ? "currentColor" : "none"}
                      strokeWidth={isActive ? 1.5 : 2}
                      className={`relative transition-all duration-300 ${
                        isActive
                          ? "scale-110 -translate-y-0.5"
                          : "scale-100"
                      } ${
                        fueTocado
                          ? isActive
                            ? "icono-pop"
                            : "icono-wiggle"
                          : ""
                      }`}
                    />

                    {/* Texto */}
                    <span
                      className={`relative text-[11px] font-medium transition-all duration-300 ${
                        isActive ? "font-bold" : ""
                      }`}
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })
        )}
      </div>
    </footer>
  );
}

export default Footer;