import { useEffect, useRef, useState } from "react";
import ConfettiButton from "../conponents/ConfettiButton";
import music from "../assets/audio2.wav";

import love from "../assets/love.jpg";
import love1 from "../assets/love1.jpg";
import love2 from "../assets/love2.jpg";
import love3 from "../assets/love3.jpg";

const imgs = [love, love1, love2, love3];

export default function Sorpresas() {

  const [idx, setIdx] = useState(0);
  const [showSecret, setShowSecret] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const startDatee = new Date("2022-03-27");
  const daysTogether = Math.floor(
    (Date.now() - startDatee.getTime()) / (1000 * 60 * 60 * 24)
  );

  /* 🎶 Música */
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    playing ? audioRef.current.pause() : audioRef.current.play();
    setPlaying(!playing);
  };

  /* 🖼️ Carrusel */
  useEffect(() => {
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % imgs.length);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  /* 💌 Mensajes */
  const secretMessages = [
    "Elegirte siempre será mi mejor decisión ❤️",
    "Contigo todo se siente más bonito ✨",
    "Eres mi lugar seguro 🏡",
    "Te elegiría incluso en otra vida 💞",
  ];

  useEffect(() => {
    if (!showSecret) return;

    const interval = setInterval(() => {
      setCurrentIndex((i) =>
        i < secretMessages.length - 1 ? i + 1 : 0
      );
    }, 3000);

    return () => clearInterval(interval);

  }, [showSecret]);

  /* 💞 Contador */
  const startDate = new Date("2023-03-27");
  const now = new Date();

  let years = now.getFullYear() - startDate.getFullYear();
  let months = now.getMonth() - startDate.getMonth();
  let days = now.getDate() - startDate.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const diffMs = time.getTime() - startDate.getTime();
  const totalSeconds = Math.floor(diffMs / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const hours = totalHours % 24;

  return (
    <section className="p-8 text-center rounded-3xl text-pink-100 bg-gradient-to-br from-purple-700 via-pink-600 to-pink-500 max-w-4xl mx-auto">

      <h1 className="text-4xl font-bold mb-3 drop-shadow-lg">
        💖 Feliz San Valentín 💖
      </h1>

      <p className="italic text-lg mb-3">
        “En este San Valentín no regalo flores,
        te regalo mi corazón y todo lo que soy.”
      </p>

      <p className="text-pink-200 mb-6">
        💞 Llevamos <strong>{daysTogether}</strong> días juntos
      </p>

      {/* CARTA */}
      <div className="bg-white/80 text-purple-900 p-8 rounded-3xl shadow-xl max-w-2xl mx-auto mb-10 backdrop-blur">

        <p className="mb-4">
          Hoy no quiero decirte algo simple, quiero decirte algo verdadero.
        </p>

        <p className="mb-4">
          Gracias por quedarte, por entender, por sentir.
        </p>

        <p className="text-2xl font-bold text-pink-600">
          Si el amor tuviera nombre, tendría el tuyo.
        </p>

      </div>

      {/* IMAGEN */}
      <div className="max-w-md mx-auto overflow-hidden rounded-2xl shadow-2xl mb-4">
        <img
          src={imgs[idx]}
          className="w-full h-72 object-cover"
        />
      </div>

      {/* MINI GALERIA */}
      <div className="flex justify-center gap-3 mb-10 flex-wrap">
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

      {/* COLUMNAS */}
      <div className="grid md:grid-cols-2 gap-10 mb-12">

        <div>
          <h3 className="text-xl font-semibold mb-4">
            🌹 Cosas que amo de ti
          </h3>

          <ul className="space-y-3">

            <li className="bg-pink-200/20 p-3 rounded-xl">
              💗 Tu sonrisa cuando estás feliz
            </li>

            <li className="bg-pink-200/20 p-3 rounded-xl">
              🏡 Cómo me haces sentir en casa
            </li>

            <li className="bg-pink-200/20 p-3 rounded-xl">
              🤍 Tu forma de cuidar y amar
            </li>

            <li className="bg-pink-200/20 p-3 rounded-xl">
              ✨ Que siempre eres tú misma
            </li>

          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">
            💍 Mis promesas
          </h3>

          <ul className="space-y-3">

            <li className="bg-pink-200/20 p-3 rounded-xl">
              💞 Elegirte incluso en los días difíciles
            </li>

            <li className="bg-pink-200/20 p-3 rounded-xl">
              🌿 Caminar contigo sin importar el camino
            </li>

            <li className="bg-pink-200/20 p-3 rounded-xl">
              💖 Amarte con hechos, no solo palabras
            </li>

            <li className="bg-pink-200/20 p-3 rounded-xl">
              🛡️ Protegerte a capa y espada
            </li>

          </ul>
        </div>

      </div>

      {/* CONTADOR */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">

        <div className="bg-pink-100 text-pink-800 p-6 rounded-3xl shadow-xl">
          <h4 className="mb-2 font-semibold">
            💞 Tiempo juntos
          </h4>

          <div className="flex justify-center gap-4 flex-wrap">
            <span className="bg-pink-400 text-white px-4 py-1 rounded-full">
              {years} años
            </span>

            <span className="bg-pink-400 text-white px-4 py-1 rounded-full">
              {months} meses
            </span>

            <span className="bg-pink-400 text-white px-4 py-1 rounded-full">
              {days} días
            </span>
          </div>
        </div>

        <div className="bg-pink-100 text-pink-800 p-6 rounded-3xl shadow-xl">

          <h4 className="mb-2 font-semibold">
            ⏱️ y contando...
          </h4>

          <div className="flex justify-center gap-4 flex-wrap">

            <span className="bg-pink-400 text-white px-4 py-1 rounded-full">
              {hours} h
            </span>

            <span className="bg-pink-400 text-white px-4 py-1 rounded-full">
              {minutes} min
            </span>

            <span className="bg-pink-400 text-white px-4 py-1 rounded-full">
              {seconds} seg
            </span>

          </div>

        </div>

      </div>

      {/* BOTONES */}
      <div className="flex justify-center gap-4 flex-wrap mb-10">

        <ConfettiButton />

        <audio ref={audioRef} src={music} loop />

        <button
          onClick={toggleMusic}
          className="bg-pink-500 hover:bg-pink-600 px-6 py-3 rounded-full shadow-lg"
        >
          {playing ? "⏸️ Pausar Música" : "🎶 Reproducir Música"}
        </button>

      </div>

      {/* MENSAJE SECRETO */}
      <div>

        {!showSecret ? (
          <button
            onClick={() => {
              setShowSecret(true);
              setCurrentIndex(0);
            }}
            className="bg-pink-400 hover:bg-pink-500 px-6 py-3 rounded-full"
          >
            🌹 Ver mensaje secreto
          </button>
        ) : (
          <p className="text-xl mt-4 animate-pulse">
            {secretMessages[currentIndex]}
          </p>
        )}

      </div>

    </section>
  );
}