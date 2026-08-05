import { useEffect, useState } from "react";

import aniver1 from "../assets/aniver1.png";
import aniver2 from "../assets/aniver2.png";
import aniver3 from "../assets/aniver3.png";
import aniver4 from "../assets/aniver4.png";

const imgs = [aniver1, aniver2, aniver3, aniver4];

export default function Aniversario() {

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % imgs.length);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="p-8 text-center rounded-3xl text-pink-100 bg-gradient-to-br from-rose-700 via-pink-600 to-pink-400 max-w-4xl mx-auto mb-10">

      <h2 className="text-4xl font-bold mb-2 drop-shadow-lg">
        🌹 4 Años Juntos 🌹
      </h2>

      <p className="text-pink-200 italic mb-6">
        17 de marzo — un día que cambió todo 💞
      </p>

      {/* IMAGEN PRINCIPAL */}
      <div className="max-w-md mx-auto overflow-hidden rounded-2xl shadow-2xl mb-4">
        <img
          src={imgs[idx]}
          className="w-full h-72 object-cover transition-all duration-500"
        />
      </div>

      {/* MINIATURAS */}
      <div className="flex justify-center gap-3 mb-8 flex-wrap">
        {imgs.map((img, i) => (
          <img
            key={i}
            src={img}
            onClick={() => setIdx(i)}
            className={`w-16 h-16 rounded-xl object-cover cursor-pointer transition ${
              i === idx
                ? "ring-2 ring-pink-200 scale-105"
                : "opacity-60 hover:opacity-100"
            }`}
          />
        ))}
      </div>

      {/* MENSAJE */}
      <div className="bg-white/80 text-purple-900 p-8 rounded-3xl shadow-xl max-w-2xl mx-auto backdrop-blur">

        <p className="mb-4">
          Cuatro años de elegirte, de crecer juntos, de construir algo hermoso.
        </p>

        <p className="mb-4">
          Cada día a tu lado es un regalo que no me canso de recibir.
        </p>

        <p className="text-2xl font-bold text-pink-600">
          Feliz aniversario, mi amor 💖
        </p>

      </div>

    </section>
  );
}