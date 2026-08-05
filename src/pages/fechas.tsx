import { useNavigate } from "react-router-dom";
import { LocalNotifications } from "@capacitor/local-notifications";

const sorpresas = [
  {
    label: "San Valentín",
    icono: "💖",
    ruta: "/SanValentin",
  },
  {
    label: "Aniversario",
    icono: "🌹",
    ruta: "/Aniversario",
  },
  {
    label: "Ciclo",
    icono: "🌸",
    ruta: "/floo",
  },
  // ... más sorpresas aquí
];

const eventos = [
  {
    titulo: "Nuestro aniversario",
    fecha: "15 Marzo 2027",
    icono: "❤️",
    faltan: "225 días",
  },
  {
    titulo: "Cumpleaños de Adixon",
    fecha: "10 Octubre 2026",
    icono: "🎂",
    faltan: "71 días",
  },
  {
    titulo: "Cumpleaños de Mi Amor",
    fecha: "24 Diciembre 2026",
    icono: "🎉",
    faltan: "146 días",
  },
  {
    titulo: "San Valentín",
    fecha: "14 Febrero 2027",
    icono: "💝",
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
    } catch (error) {
      console.error("Error al enviar la notificación:", error);
      alert("No se pudo enviar la notificación. Revisa la consola para más detalles.");
    }
  };

  return (
    <div className="min-h-screen bg-[#1B1033] text-white px-5 pt-24 pb-28">
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
        <h1 className="text-3xl font-bold text-[#FB923C] mb-2">
          📅 Fechas Especiales
        </h1>
        <p className="text-gray-400 mb-8">
          Nunca olvidemos nuestros momentos más importantes ❤️
        </p>
      </div>

      {/* BOTÓN DE PRUEBA DE NOTIFICACIÓN */}
      <button
        onClick={enviarNotificacionDePrueba}
        style={{ animationDelay: "80ms" }}
        className="notificacion-boton w-full mb-10 bg-gradient-to-r from-pink-500 to-fuchsia-600 rounded-3xl p-5 shadow-lg flex items-center justify-between"
      >
        <div className="text-left">
          <h2 className="text-lg font-bold">📲 Probar notificación</h2>
          <p className="text-white/80 text-sm mt-1">
            Toca para enviarte un mensaje de prueba
          </p>
        </div>
        <span className="text-2xl">💌</span>
      </button>

      <div className="space-y-5 mb-12">
        {eventos.map((evento, index) => (
          <div
            key={index}
            className="fecha-card bg-[#2A1847] rounded-3xl p-5 border border-white/10 shadow-lg"
            style={{ animationDelay: `${index * 90}ms` }}
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">
                  {evento.icono} {evento.titulo}
                </h2>
                <p className="text-gray-300 mt-1">{evento.fecha}</p>
              </div>

              <div className="bg-pink-500/20 text-pink-300 px-4 py-2 rounded-xl font-semibold">
                {evento.faltan}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SORPRESAS */}
      <div className="sorpresa-titulo" style={{ animationDelay: "200ms" }}>
        <h2 className="text-2xl font-bold text-[#FACC15] mb-2 text-center">
          🎁 Sorpresas
        </h2>
        <p className="text-gray-400 mb-6 text-center">
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
            <h2 className="text-lg font-semibold">
              {s.icono} {s.label}
            </h2>
            <span className="sorpresa-flecha text-[#FB923C] text-xl">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}