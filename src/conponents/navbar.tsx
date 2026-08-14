import {
  ArrowLeft,
  Flame,
  Menu,
  X,
  Volume2,
  VolumeX,
  Settings,
  Vibrate,
  Bell,
  BellOff,
  Moon,
  Globe,
  UserCog,
  HelpCircle,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import supabase from "../lib/supabase.js";

function Navbar() {
  const [sound, setSound] = useState(true);
  const [vibracion, setVibracion] = useState(true);
  const [notificaciones, setNotificaciones] = useState(true);
  const [visible, setVisible] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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

  const enJuego = location.pathname.startsWith("/juegos/chispa");

  let titulo = "Chispa";
  let volverA = "/juegos";

  if (location.pathname === "/juegos/chispa") {
    titulo = "Configurar partida";
    volverA = "/juegos";
  } else if (location.pathname === "/juegos/chispa/jugar") {
    titulo = "Chispa";
    volverA = "/juegos/chispa";
  }

  const handleCerrarSesion = async () => {
    setCerrandoSesion(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error cerrando sesión:", error);
      }
    } catch (err) {
      console.error("Error cerrando sesión:", err);
    } finally {
      setCerrandoSesion(false);
      setMenuAbierto(false);
      navigate("/Login");
    }
  };

  const Toggle = ({ activo }: { activo: boolean }) => (
    <span
      className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors shrink-0 ${
        activo ? "bg-pink-500 justify-end" : "bg-white/20 justify-start"
      }`}
    >
      <span className="w-5 h-5 rounded-full bg-white" />
    </span>
  );

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 flex justify-center transition-transform duration-300 ease-in-out ${
          visible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <style>{`
          @keyframes flame-flicker {
            0%, 100% {
              transform: scale(1) rotate(-2deg);
              filter: drop-shadow(0 0 4px rgba(251, 146, 60, 0.7));
            }
            25% {
              transform: scale(1.08) rotate(2deg);
              filter: drop-shadow(0 0 8px rgba(249, 115, 22, 0.9));
            }
            50% {
              transform: scale(0.95) rotate(-1deg);
              filter: drop-shadow(0 0 5px rgba(251, 146, 60, 0.6));
            }
            75% {
              transform: scale(1.05) rotate(1deg);
              filter: drop-shadow(0 0 9px rgba(236, 72, 153, 0.8));
            }
          }
          .flame-icon {
            animation: flame-flicker 1.8s ease-in-out infinite;
            transform-origin: center bottom;
          }
          @keyframes title-glow {
            0%, 100% {
              filter: drop-shadow(0 0 6px rgba(236, 72, 153, 0.35));
            }
            50% {
              filter: drop-shadow(0 0 12px rgba(249, 115, 22, 0.45));
            }
          }
          .chispa-title {
            animation: title-glow 3s ease-in-out infinite;
          }
        `}</style>

        <div className="w-full max-w-[560px] h-16 px-4 flex items-center justify-between bg-[#1a0f2ecc] backdrop-blur-xl border-b border-white/10">
          {enJuego ? (
            <button onClick={() => navigate(volverA)} className="p-2 -ml-2">
              <ArrowLeft size={20} />
            </button>
          ) : (
            <button
              onClick={() => setMenuAbierto(true)}
              className="p-2 -ml-2"
              aria-label="Abrir menú de configuración"
            >
              <Menu size={22} />
            </button>
          )}

          <div className="flex items-center gap-1.5 chispa-title">
            <h1
              className={`font-extrabold tracking-tight bg-gradient-to-r from-pink-500 via-orange-400 to-pink-400 bg-clip-text text-transparent ${
                enJuego && titulo !== "Chispa" ? "text-lg" : "text-xl"
              }`}
            >
              {enJuego ? titulo : "Chispa"}
            </h1>
            {(!enJuego || titulo === "Chispa") && (
              <Flame
                size={20}
                className="flame-icon text-orange-400 fill-orange-500/40"
              />
            )}
          </div>

          <button
            onClick={() => setSound(!sound)}
            className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center active:scale-90 transition"
          >
            {sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>
      </header>

      {/* Overlay */}
      <div
        onClick={() => setMenuAbierto(false)}
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          menuAbierto ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Panel de configuración */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-[70] w-80 max-w-[85%] bg-[#1a0f2e] border-r border-white/10 shadow-2xl transition-transform duration-300 ease-in-out overflow-y-auto ${
          menuAbierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="sticky top-0 flex items-center justify-between h-16 px-4 border-b border-white/10 bg-[#1a0f2e]">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-pink-400" />
            <span className="font-bold text-white">Configuración</span>
          </div>
          <button
            onClick={() => setMenuAbierto(false)}
            className="p-2 -mr-2"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-6 pb-8">
          {/* Preferencias */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/40 px-1">
              Preferencias
            </span>

            <button
              onClick={() => setSound(!sound)}
              className="flex items-center justify-between px-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition text-sm text-white"
            >
              <span className="flex items-center gap-2">
                {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
                Sonido
              </span>
              <Toggle activo={sound} />
            </button>

            <button
              onClick={() => setVibracion(!vibracion)}
              className="flex items-center justify-between px-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition text-sm text-white"
            >
              <span className="flex items-center gap-2">
                <Vibrate size={18} />
                Vibración
              </span>
              <Toggle activo={vibracion} />
            </button>

            <button
              onClick={() => setNotificaciones(!notificaciones)}
              className="flex items-center justify-between px-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition text-sm text-white"
            >
              <span className="flex items-center gap-2">
                {notificaciones ? <Bell size={18} /> : <BellOff size={18} />}
                Notificaciones
              </span>
              <Toggle activo={notificaciones} />
            </button>

            <button
              className="flex items-center justify-between px-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition text-sm text-white"
            >
              <span className="flex items-center gap-2">
                <Moon size={18} />
                Tema
              </span>
              <span className="flex items-center gap-1 text-white/50 text-xs">
                Oscuro
                <ChevronRight size={16} />
              </span>
            </button>

            <button
              className="flex items-center justify-between px-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition text-sm text-white"
            >
              <span className="flex items-center gap-2">
                <Globe size={18} />
                Idioma
              </span>
              <span className="flex items-center gap-1 text-white/50 text-xs">
                Español
                <ChevronRight size={16} />
              </span>
            </button>
          </div>

          {/* Cuenta */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/40 px-1">
              Cuenta
            </span>

            <button
              onClick={() => {
                setMenuAbierto(false);
                navigate("/perfil");
              }}
              className="flex items-center justify-between px-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition text-sm text-white"
            >
              <span className="flex items-center gap-2">
                <UserCog size={18} />
                Editar perfil
              </span>
              <ChevronRight size={16} className="text-white/40" />
            </button>
          </div>

          {/* Soporte */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-white/40 px-1">
              Soporte
            </span>

            <button
              className="flex items-center justify-between px-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition text-sm text-white"
            >
              <span className="flex items-center gap-2">
                <HelpCircle size={18} />
                Ayuda
              </span>
              <ChevronRight size={16} className="text-white/40" />
            </button>

            <button
              onClick={handleCerrarSesion}
              disabled={cerrandoSesion}
              className="flex items-center justify-between px-3 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition text-sm text-red-400 disabled:opacity-60"
            >
              <span className="flex items-center gap-2">
                <LogOut size={18} />
                {cerrandoSesion ? "Cerrando sesión..." : "Cerrar sesión"}
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Navbar;