import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, LogIn } from "lucide-react";
import supabase from "../lib/supabase.js";
import errorSound from "../assets/error.mp3";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const reproducirError = () => {
    // Si ya había un audio sonando, lo reiniciamos
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(errorSound);
    audioRef.current = audio;

    audio.play().catch((e) => console.warn("No se pudo reproducir el audio:", e));

    // Corta el audio después de 1 segundo
    setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Completa ambos campos para continuar.");
      reproducirError();
      return;
    }

    setCargando(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setCargando(false);

    if (authError) {
      setError("Correo o contraseña incorrectos.");
      reproducirError();
      return;
    }

    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-b from-[#1a0f2e] via-[#2a1240] to-[#1a0f2e] text-white relative overflow-hidden">
      {/* Resplandor de fondo */}
      <div className="absolute h-72 w-72 rounded-full bg-pink-500/20 blur-3xl -top-10 -left-10" />
      <div className="absolute h-72 w-72 rounded-full bg-purple-500/20 blur-3xl bottom-0 right-0" />

      <div className="relative w-full max-w-sm">
        {/* Logo / título */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-3">
            <div className="absolute inset-0 rounded-full bg-pink-500/30 blur-xl" />
            <svg
              viewBox="0 0 24 24"
              className="relative h-14 w-14 fill-pink-400 drop-shadow-[0_0_12px_rgba(244,114,182,0.8)]"
            >
              <path d="M12 4.6c1.6-2 4.2-2.8 6.5-1.7 2.7 1.3 3.9 4.6 2.6 7.4-1.7 3.6-6.2 7-9.1 9.1-2.9-2.1-7.4-5.5-9.1-9.1C1.4 7.5 2.6 4.2 5.3 2.9c2.3-1.1 4.9-.3 6.5 1.7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
            Nuestro Espacio
          </h1>
          <p className="text-xs text-white/50 mt-1">Inicia sesión para continuar</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <Mail
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo electrónico"
              autoComplete="email"
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-sm placeholder:text-white/30 focus:outline-none focus:border-pink-400/60 focus:bg-white/[0.07] transition"
            />
          </div>

          <div className="relative">
            <Lock
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              type={mostrarPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              autoComplete="current-password"
              className="w-full pl-11 pr-11 py-3.5 rounded-xl bg-white/5 border border-white/10 text-sm placeholder:text-white/30 focus:outline-none focus:border-pink-400/60 focus:bg-white/[0.07] transition"
            />
            <button
              type="button"
              onClick={() => setMostrarPassword(!mostrarPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition"
            >
              {mostrarPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="mt-2 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 font-bold text-sm shadow-[0_0_20px_rgba(236,72,153,0.4)] active:scale-95 transition disabled:opacity-60 disabled:active:scale-100"
          >
            {cargando ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={18} />
                Iniciar sesión
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;