import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  Images,
  Heart,
  Mail,
  BookHeart,
  Users,
  MessageCircle,
  Coffee,
  HeartHandshake,
  PartyPopper,
  Camera,
  Gem,
  Music,
  Hourglass,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Momento {
  Icono: LucideIcon;
  titulo: string;
  descripcion: string;
  fecha: string;
}

function Nosotros() {
  const momentos: Momento[] = [
    {
      Icono: Users,
      titulo: "Nos conocimos",
      descripcion:
        "Fue en una fiesta de un amigo en común, casi no vamos ninguno de los dos.",
      fecha: "10 Enero 2024",
    },
    {
      Icono: MessageCircle,
      titulo: "Primera conversación",
      descripcion:
        "Empezamos a hablar por chat esa misma noche y no paramos hasta las 3am.",
      fecha: "10 Enero 2024",
    },
    {
      Icono: Coffee,
      titulo: "Primera cita",
      descripcion:
        "Un café que se convirtió en 4 horas de conversación sin darnos cuenta.",
      fecha: "2 Febrero 2024",
    },
    {
      Icono: HeartHandshake,
      titulo: "Nos hicimos pareja",
      descripcion: "En el parque, bajo la lluvia, justo como en las películas.",
      fecha: "15 Marzo 2024",
    },
    {
      Icono: PartyPopper,
      titulo: "Primer aniversario",
      descripcion:
        "Celebramos con una cena sorpresa y una carta que hizo llorar a los dos.",
      fecha: "15 Marzo 2025",
    },
    {
      Icono: Camera,
      titulo: "Momentos especiales",
      descripcion:
        "Viajes, risas, discusiones tontas y muchas fotos que guardamos con cariño.",
      fecha: "Todo el año",
    },
    {
      Icono: Gem,
      titulo: "Futuro juntos",
      descripcion:
        "Lo que sigue está por escribirse, y no podríamos estar más emocionados.",
      fecha: "Por vivir",
    },
  ];

  const [visibles, setVisibles] = useState<boolean[]>(() =>
    momentos.map(() => false)
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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap');
        .fuente-elegante { font-family: 'Playfair Display', Georgia, serif; }
      `}</style>

      {/* Título */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-5">
          <div className="border border-[#FF7EB6]/40 p-5 rounded-full">
            <Heart size={40} className="text-[#FF7EB6]" strokeWidth={1.5} />
          </div>
        </div>
        <h1 className="fuente-elegante text-4xl sm:text-5xl font-bold tracking-tight">
          Nosotros
        </h1>
        <div className="w-14 h-px bg-[#B388FF]/60 mx-auto mt-4 mb-4" />
        <p className="text-sm sm:text-base tracking-wide opacity-70">
          Nuestra historia, nuestros recuerdos y nuestro futuro
        </p>
      </div>

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Historia */}
        <div className="rounded-3xl p-8 border border-[#453A67]/40">
          <div className="flex items-center gap-3 mb-5">
            <BookHeart className="text-[#FF7EB6]" size={28} strokeWidth={1.5} />
            <h2 className="fuente-elegante text-2xl font-semibold">
              Nuestra historia
            </h2>
          </div>
          <p className="leading-relaxed opacity-80">
            Todo comenzó con un momento especial que cambió nuestras vidas.
            Desde ese día hemos creado recuerdos, superado retos y construido
            una historia juntos ❤️
          </p>
        </div>

        {/* Timeline */}
        <div className="rounded-3xl p-8 border border-[#453A67]/40">
          <div className="flex items-center gap-3 mb-8">
            <Clock className="text-[#B388FF]" size={28} strokeWidth={1.5} />
            <h2 className="fuente-elegante text-2xl font-semibold">
              Línea del tiempo
            </h2>
          </div>

          <div className="relative space-y-6">
            {momentos.map((momento, index) => {
              const visible = visibles[index];
              const esUltimo = index === momentos.length - 1;
              const Icono = momento.Icono;

              return (
                <div
                  key={index}
                  ref={(el) => {
                    refs.current[index] = el;
                  }}
                  data-index={index}
                  className="relative flex gap-5 items-start"
                >
                  {/* Segmento de línea hacia el siguiente punto */}
                  {!esUltimo && (
                    <div className="absolute left-6 top-14 bottom-0 w-px bg-[#453A67]/40 overflow-hidden">
                      <div
                        className="w-full bg-[#FF7EB6] transition-all duration-700 ease-out"
                        style={{
                          height: visible ? "100%" : "0%",
                          transitionDelay: visible ? "200ms" : "0ms",
                        }}
                      />
                    </div>
                  )}

                  {/* Medallón con ícono */}
                  <div
                    className="relative z-10 rounded-full p-3 border border-[#FF7EB6]/40 transition-all duration-500 ease-out"
                    style={{
                      opacity: visible ? 1 : 0,
                      transform: visible ? "scale(1)" : "scale(0.5)",
                    }}
                  >
                    <Icono size={22} className="text-[#FF7EB6]" strokeWidth={1.5} />
                  </div>

                  {/* Texto */}
                  <div
                    className="flex-1 pt-1.5 transition-all duration-500 ease-out"
                    style={{
                      opacity: visible ? 1 : 0,
                      transform: visible ? "translateY(0)" : "translateY(16px)",
                      transitionDelay: visible ? "100ms" : "0ms",
                    }}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h3 className="fuente-elegante text-lg sm:text-xl font-semibold">
                        {momento.titulo}
                      </h3>
                      <span className="text-xs sm:text-sm text-[#B388FF] font-medium tracking-wide">
                        {momento.fecha}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm sm:text-base leading-relaxed opacity-80">
                      {momento.descripcion}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <Link
            to="/timeline"
            className="block text-center mt-9 bg-[#FF4D8D] hover:bg-[#E63A79] transition rounded-full py-3 font-semibold tracking-wide text-white"
          >
            Ver nuestra historia completa
          </Link>
        </div>

        {/* Álbum */}
        <Link
          to="/album"
          className="block rounded-3xl p-7 border border-[#453A67]/40 hover:border-[#B388FF]/50 transition"
        >
          <div className="flex items-center gap-4">
            <div className="border border-[#B388FF]/40 rounded-full p-3">
              <Images size={30} className="text-[#B388FF]" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="fuente-elegante text-xl sm:text-2xl font-semibold">
                Álbum de recuerdos
              </h2>
              <p className="text-sm sm:text-base opacity-80">
                Guarda nuestras fotos favoritas
              </p>
            </div>
          </div>
        </Link>

        {/* Cartas */}
        <Link
          to="/cartas"
          className="block rounded-3xl p-7 border border-[#453A67]/40 hover:border-[#FF7EB6]/50 transition"
        >
          <div className="flex items-center gap-4">
            <div className="border border-[#FF7EB6]/40 rounded-full p-3">
              <Mail size={30} className="text-[#FF7EB6]" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="fuente-elegante text-xl sm:text-2xl font-semibold">
                Cartas
              </h2>
              <p className="text-sm sm:text-base opacity-80">
                Escribe mensajes especiales
              </p>
            </div>
          </div>
        </Link>

        {/* Playlist */}
        <Link
          to="/playlist"
          className="block rounded-3xl p-7 border border-[#453A67]/40 hover:border-[#B388FF]/50 transition"
        >
          <div className="flex items-center gap-4">
            <div className="border border-[#B388FF]/40 rounded-full p-3">
              <Music size={30} className="text-[#B388FF]" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="fuente-elegante text-xl sm:text-2xl font-semibold">
                Playlist
              </h2>
              <p className="text-sm sm:text-base opacity-80">
                Las canciones de nuestra historia
              </p>
            </div>
          </div>
        </Link>

        {/* Cápsula del tiempo */}
        <Link
          to="/capsula-del-tiempo"
          className="block rounded-3xl p-7 border border-[#453A67]/40 hover:border-[#FF7EB6]/50 transition"
        >
          <div className="flex items-center gap-4">
            <div className="border border-[#FF7EB6]/40 rounded-full p-3">
              <Hourglass size={30} className="text-[#FF7EB6]" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="fuente-elegante text-xl sm:text-2xl font-semibold">
                Cápsula del tiempo
              </h2>
              <p className="text-sm sm:text-base opacity-80">
                Mensajes para abrir en el futuro
              </p>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}

export default Nosotros;