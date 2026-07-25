import { ArrowLeft, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function Navbar() {
  const [sound, setSound] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const enJuego = location.pathname.startsWith("/juegos/chispa");

  let titulo = "Chispa 🔥";
  let volverA = "/juegos";

  if (location.pathname === "/juegos/chispa") {
    titulo = "Configurar partida";
    volverA = "/juegos";
  } else if (location.pathname === "/juegos/chispa/jugar") {
    titulo = "Chispa 🔥";
    volverA = "/juegos/chispa";
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center">
      <div className="w-full max-w-[560px] h-16 px-4 flex items-center justify-between bg-[#1a0f2ecc] backdrop-blur-xl border-b border-white/10">
        {enJuego ? (
          <button onClick={() => navigate(volverA)} className="p-2 -ml-2">
            <ArrowLeft size={20} />
          </button>
        ) : (
          <div className="w-9" />
        )}

        <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 via-orange-400 to-pink-400 bg-clip-text text-transparent">
          {enJuego ? titulo : "Chispa 🔥"}
        </h1>

        <button
          onClick={() => setSound(!sound)}
          className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center active:scale-90 transition"
        >
          {sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>

      </div>
    </header>
  );
}

export default Navbar;