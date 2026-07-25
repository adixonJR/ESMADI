import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Images, Heart, Mail, BookHeart } from "lucide-react";

function Nosotros() {
  const momentos = [
    {
      icono: "📅",
      titulo: "Nos conocimos",
      descripcion: "Fue en una fiesta de un amigo en común, casi no vamos ninguno de los dos.",
      fecha: "10 Enero 2024",
    },
    {
      icono: "💬",
      titulo: "Primera conversación",
      descripcion: "Empezamos a hablar por chat esa misma noche y no paramos hasta las 3am.",
      fecha: "10 Enero 2024",
    },
    {
      icono: "☕",
      titulo: "Primera cita",
      descripcion: "Un café que se convirtió en 4 horas de conversación sin darnos cuenta.",
      fecha: "2 Febrero 2024",
    },
    {
      icono: "❤️",
      titulo: "Nos hicimos pareja",
      descripcion: "En el parque, bajo la lluvia, justo como en las películas.",
      fecha: "15 Marzo 2024",
    },
    {
      icono: "🎉",
      titulo: "Primer aniversario",
      descripcion: "Celebramos con una cena sorpresa y una carta que hizo llorar a los dos.",
      fecha: "15 Marzo 2025",
    },
    {
      icono: "📸",
      titulo: "Momentos especiales",
      descripcion: "Viajes, risas, discusiones tontas y muchas fotos que guardamos con cariño.",
      fecha: "Todo el año",
    },
    {
      icono: "💍",
      titulo: "Futuro juntos",
      descripcion: "Lo que sigue está por escribirse, y no podríamos estar más emocionados.",
      fecha: "Por vivir",
    }
  ];

  const [visibles, setVisibles] = useState<boolean[]>(
    () => momentos.map(() => false)
  );
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute("data-index"));
          setVisibles((prev) => {
            if (prev[index] === entry.isIntersecting) return prev;
            const copia = [...prev];
            copia[index] = entry.isIntersecting;
            return copia;
          });
        });
      },
      { threshold: 0.3, rootMargin: "0px 0px -10% 0px" }
    );

    refs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className="px-6 py-10">
      {/* Titulo */}
      <div className="text-center mb-10">
        <div className="flex justify-center mb-4">
          <div className="bg-pink-500/20 p-5 rounded-full">
            <Heart 
              size={50}
              className="text-pink-400 fill-pink-400"
            />
          </div>
        </div>
        <h1 className="text-4xl font-bold">
          Nosotros ❤️
        </h1>
        <p className="text-gray-300 mt-3">
          Nuestra historia, nuestros recuerdos y nuestro futuro
        </p>
      </div>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Historia */}
        <div className="bg-white/10 rounded-3xl p-7">
          <div className="flex items-center gap-3 mb-4">
            <BookHeart 
              className="text-pink-400"
              size={35}
            />
            <h2 className="text-2xl font-bold">
              Nuestra historia
            </h2>
          </div>
          <p className="text-gray-300 leading-relaxed">
            Todo comenzó con un momento especial que cambió nuestras vidas.
            Desde ese día hemos creado recuerdos, superado retos y
            construido una historia juntos ❤️
          </p>
        </div>
        {/* Timeline */}
        <div className="bg-white/10 rounded-3xl p-7">
          <div className="flex items-center gap-3 mb-6">
            <Clock 
              className="text-purple-400"
              size={35}
            />
            <h2 className="text-2xl font-bold">
              Línea del tiempo
            </h2>
          </div>
          <div className="relative space-y-5">
            {momentos.map((momento, index) => {
              const visible = visibles[index];
              const esUltimo = index === momentos.length - 1;

              return (
                <div
                  key={index}
                  ref={(el) => { refs.current[index] = el; }}
                  data-index={index}
                  className="relative flex gap-4 items-start"
                >
                  {/* Segmento de línea hacia el siguiente punto */}
                  {!esUltimo && (
                    <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-pink-500/10 overflow-hidden">
                      <div
                        className="w-full bg-pink-500/50 transition-all duration-700 ease-out"
                        style={{
                          height: visible ? "100%" : "0%",
                          transitionDelay: visible ? "200ms" : "0ms",
                        }}
                      />
                    </div>
                  )}

                  {/* Ícono */}
                  <div
                    className="relative z-10 bg-[#241539] rounded-full p-3 text-2xl border border-pink-500/20 transition-all duration-500 ease-out"
                    style={{
                      opacity: visible ? 1 : 0,
                      transform: visible ? "scale(1)" : "scale(0.5)",
                    }}
                  >
                    {momento.icono}
                  </div>

                  {/* Texto */}
                  <div
                    className="flex-1 pt-1 transition-all duration-500 ease-out"
                    style={{
                      opacity: visible ? 1 : 0,
                      transform: visible ? "translateY(0)" : "translateY(16px)",
                      transitionDelay: visible ? "100ms" : "0ms",
                    }}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h3 className="text-xl font-bold">
                        {momento.titulo}
                      </h3>
                      <span className="text-xs sm:text-sm text-pink-400 font-medium">
                        {momento.fecha}
                      </span>
                    </div>
                    <p className="text-gray-300 mt-1">
                      {momento.descripcion}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <Link
            to="/timeline"
            className="block text-center mt-7 bg-pink-500 hover:bg-pink-600 transition rounded-full py-3 font-bold"
          >
            Ver nuestra historia completa ❤️
          </Link>
        </div>
        {/* Album */}
        <Link
          to="/album"
          className="block bg-gradient-to-r from-purple-500/30 to-blue-500/30 rounded-3xl p-7 hover:scale-105 transition"
        >
          <div className="flex items-center gap-4">
            <Images
              size={45}
              className="text-blue-300"
            />
            <div>
              <h2 className="text-2xl font-bold">
                📷 Álbum de recuerdos
              </h2>
              <p className="text-gray-300">
                Guarda nuestras fotos favoritas
              </p>
            </div>
          </div>
        </Link>
        {/* Cartas */}
        <Link
          to="/cartas"
          className="block bg-gradient-to-r from-pink-500/30 to-red-500/30 rounded-3xl p-7 hover:scale-105 transition"
        >
          <div className="flex items-center gap-4">
            <Mail
              size={45}
              className="text-pink-300"
            />
            <div>
              <h2 className="text-2xl font-bold">
                💌 Cartas
              </h2>
              <p className="text-gray-300">
                Escribe mensajes especiales
              </p>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}

export default Nosotros;