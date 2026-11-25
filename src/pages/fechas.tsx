import { useNavigate } from "react-router-dom";
import { LocalNotifications } from "@capacitor/local-notifications";
import {
  Heart,
  Cake,
  PartyPopper,
  Gift,
  HeartHandshake,
  Flower2,
  CalendarHeart,
  Send,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* Ícono dentro de un "squircle" con degradado y brillo superior, como los íconos de iOS (igual que en Juegos) */
function IconoTile({
  icon: Icon,
  color,
  tamano = 44,
}: {
  icon: LucideIcon;
  color: string;
  tamano?: number;
}) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-gradient-to-br ${color} flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_18px_-8px_rgba(0,0,0,0.6)]`}
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

const sorpresas: {
  label: string;
  Icono: LucideIcon;
  color: string;
  ruta: string;
}[] = [
  {
    label: "San Valentín",
    Icono: HeartHandshake,
    color: "from-[#EC4899] to-[#FB923C]",
    ruta: "/SanValentin",
  },
  {
    label: "Aniversario",
    Icono: Flower2,
    color: "from-[#D946EF] to-[#EC4899]",
    ruta: "/Aniversario",
  },
  {
    label: "Ciclo",
    Icono: CalendarHeart,
    color: "from-[#8B5CF6] to-[#D946EF]",
    ruta: "/floo",
  },
  // ... más sorpresas aquí
];

const eventos: {
  titulo: string;
  fecha: string;
  Icono: LucideIcon;
  color: string;
  faltan: string;
}[] = [
  {
    titulo: "Nuestro aniversario",
    fecha: "15 Marzo 2027",
    Icono: Heart,
    color: "from-[#EC4899] to-[#FB923C]",
    faltan: "225 días",
  },
  {
    titulo: "Cumpleaños de Adixon",
    fecha: "10 Octubre 2026",
    Icono: Cake,
    color: "from-[#8B5CF6] to-[#D946EF]",
    faltan: "71 días",
  },
  {
    titulo: "Cumpleaños de Mi Amor",
    fecha: "24 Diciembre 2026",
    Icono: PartyPopper,
    color: "from-[#FACC15] to-[#FB923C]",
    faltan: "146 días",
  },
  {
    titulo: "San Valentín",
    fecha: "14 Febrero 2027",
    Icono: Gift,
    color: "from-[#D946EF] to-[#EC4899]",
    faltan: "198 días",
  },
];

export default function Fechas() {
  const navigate = useNavigate();

  // Envía una notificación local de prueba, para confirmar que las
  // notificaciones funcionan y avisar que ya pueden descargar/probar la app.
  const enviarNotificacionDePrueba = async () => {
    try {
      const permiso = await LocalNotifications.requestPermissions();

      if (permiso.display !== "granted") {
        alert("Necesito permiso de notificaciones para enviarte el mensaje 💌");
        return;
      }

      console.log("Intentando programar notificación...");

      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now(),
            title: "¡Descarga la app! 💕",
            body: "Ya puedes probar la app, toca aquí para abrirla.",
            schedule: { at: new Date(Date.now() + 2000) }, // llega en 2 segundos
          },
        ],
      });

      console.log("Notificación programada con éxito");
    } catch (error) {
      console.error("Error al enviar la notificación:", error);
      alert("No se pudo enviar la notificación. Revisa la consola para más detalles.");
    }
  };

  return (
    <div
      className="min-h-screen bg-[#1B1033] text-white px-5 pt-6 pb-28"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, sans-serif',
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fecha-header {
          animation: fadeIn 0.5s ease both;
        }
        .fecha-card {
          animation: fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .fecha-card:hover {
          transform: translateY(-2px);
          border-color: rgba(236, 72, 153, 0.4);
        }
        .sorpresa-titulo {
          animation: fadeIn 0.5s ease both;
        }
        .sorpresa-card {
          animation: fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .sorpresa-card:hover {
          transform: translateY(-2px);
          border-color: rgba(236, 72, 153, 0.4);
          box-shadow: 0 10px 26px -10px rgba(236, 72, 153, 0.35);
        }
        .sorpresa-card:active {
          transform: scale(0.98);
        }
        .sorpresa-flecha {
          transition: transform 0.2s ease;
        }
        .sorpresa-card:hover .sorpresa-flecha {
          transform: translateX(3px);
        }
        .notificacion-boton {
          animation: fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .notificacion-boton:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 26px -10px rgba(236, 72, 153, 0.5);
        }
        .notificacion-boton:active {
          transform: scale(0.98);
        }
        @media (prefers-reduced-motion: reduce) {
          .fecha-header, .fecha-card, .sorpresa-titulo, .sorpresa-card, .sorpresa-flecha, .notificacion-boton {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      {/* FECHAS ESPECIALES */}
      <div className="fecha-header">
         <header className="entrar mb-7">
          <h1 className="text-[32px] font-bold tracking-tight leading-none">Fechas Especiales</h1>
          <p className="mt-2 text-[15px] text-[#B8B5C9] mb-8">
          Nunca olvidemos nuestros momentos más importantes
        </p>
        </header>
      </div>

      {/* BOTÓN DE PRUEBA DE NOTIFICACIÓN */}
      <button
        onClick={enviarNotificacionDePrueba}
        style={{ animationDelay: "80ms" }}
        className="notificacion-boton w-full mb-10 bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-3xl p-5 shadow-lg flex items-center justify-between"
      >
        <div className="text-left">
          <h2 className="text-[17px] font-bold tracking-tight">Probar notificación</h2>
          <p className="text-white/80 text-[14px] mt-1">
            Toca para enviarte un mensaje de prueba
          </p>
        </div>
        <Send size={24} strokeWidth={2} className="text-white/90 shrink-0" />
      </button>

      <div className="space-y-5 mb-12">
        {eventos.map((evento, index) => (
          <div
            key={index}
            className="fecha-card bg-[#2A1847] rounded-3xl p-5 border border-white/10 shadow-lg"
            style={{ animationDelay: `${index * 90}ms` }}
          >
            <div className="flex justify-between items-center gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <IconoTile icon={evento.Icono} color={evento.color} tamano={44} />
                <div className="min-w-0">
                  <h2 className="text-[17px] font-semibold tracking-tight leading-tight">
                    {evento.titulo}
                  </h2>
                  <p className="text-[#B8B5C9] text-[13px] mt-1">{evento.fecha}</p>
                </div>
              </div>

              <div className="shrink-0 bg-pink-500/20 text-pink-300 px-3.5 py-2 rounded-xl text-[13px] font-semibold">
                {evento.faltan}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SORPRESAS */}
      <div className="sorpresa-titulo" style={{ animationDelay: "200ms" }}>
        <h2 className="text-2xl font-bold tracking-tight text-[#FACC15] mb-2 text-center flex items-center justify-center gap-2.5">
          <Gift size={24} strokeWidth={2.1} />
          Sorpresas
        </h2>
        <p className="text-[#B8B5C9] text-[15px] mb-6 text-center">
          Toca una sorpresa para abrirla
        </p>
      </div>

      <div className="space-y-5">
        {sorpresas.map((s, i) => (
          <button
            key={i}
            onClick={() => navigate(s.ruta)}
            style={{ animationDelay: `${300 + i * 90}ms` }}
            className="sorpresa-card w-full text-left bg-[#2A1847] rounded-3xl p-5 border border-white/10 shadow-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <IconoTile icon={s.Icono} color={s.color} tamano={44} />
              <h2 className="text-[17px] font-semibold tracking-tight">{s.label}</h2>
            </div>
            <ChevronRight
              size={22}
              strokeWidth={2.2}
              className="sorpresa-flecha text-[#FB923C] shrink-0"
            />
          </button>
        ))}
      </div>
    </div>
  );
}