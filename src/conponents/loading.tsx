import { useEffect, useRef, useState } from "react";

interface LoadingScreenProps {
  onFinish: () => void;
  soundEnabled?: boolean;
}

export default function LoadingScreen({
  onFinish,
  soundEnabled = true,
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // --- Sonido de "carga": tick suave que sube de tono ---
  const playLoadingTick = (currentProgress: number) => {
    if (!soundEnabled) return;

    try {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;

      const baseFreq = 440;
      const freq = baseFreq + (currentProgress / 100) * 440;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      // Si el navegador bloquea autoplay, fallamos en silencio
    }
  };

  // --- Sonido de "ding" suave al terminar (ahora suena completo, sin cortarse) ---
  const playChime = (): number => {
    if (!soundEnabled || !audioCtxRef.current) return 0;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    const notas = [880, 1108.7, 1318.5]; // acorde un poco más completo
    let finalStop = 0;

    notas.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.04 + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1 + i * 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      const start = now + i * 0.06;
      const stop = now + 1.2 + i * 0.06;
      osc.start(start);
      osc.stop(stop);
      finalStop = Math.max(finalStop, stop);
    });

    // Devuelve cuánto falta (en ms) para que termine de sonar del todo
    return Math.max(0, (finalStop - now) * 1000);
  };

  useEffect(() => {
    const duration = 1000;
    const interval = 20;
    const step = 100 / (duration / interval);
    let lastTick = 0;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;

        if (Math.floor(next / 8) > lastTick) {
          lastTick = Math.floor(next / 8);
          playLoadingTick(next);
        }

        if (next >= 100) {
          clearInterval(timer);
          const restante = playChime();
          // Espera a que el sonido termine completo antes de navegar
          setTimeout(onFinish, Math.max(500, restante));
          return 100;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#1a0f2e] via-[#2a1240] to-[#1a0f2e] text-white">
      {/* Corazones flotantes de fondo */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 9 }).map((_, i) => (
          <svg
            key={i}
            viewBox="0 0 24 24"
            className="absolute select-none opacity-0"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: "-10%",
              width: `${10 + Math.random() * 16}px`,
              height: `${10 + Math.random() * 16}px`,
              animation: `floatUp ${6 + Math.random() * 6}s linear ${
                Math.random() * 5
              }s infinite`,
              fill: i % 2 === 0 ? "#ff6fa5" : "#c084fc",
            }}
          >
            <path d="M12 21.35c-.3 0-.6-.1-.83-.32C7.14 17.9 3 14.14 3 9.86 3 6.98 5.2 4.75 8 4.75c1.62 0 3.16.79 4 2.08.84-1.29 2.38-2.08 4-2.08 2.8 0 5 2.23 5 5.11 0 4.28-4.14 8.04-8.17 11.17-.23.22-.53.32-.83.32z" />
          </svg>
        ))}
      </div>

      {/* Resplandor central */}
      <div className="absolute h-72 w-72 rounded-full bg-pink-500/20 blur-3xl" />

      {/* Corazón latiendo (forma mejorada, más simétrica y llena) */}
      <div className="relative mb-8 flex items-center justify-center">
        <div
          className="absolute h-24 w-24 rounded-full bg-pink-500/30 blur-xl"
          style={{ animation: "pulseGlow 1.2s ease-in-out infinite" }}
        />
        <svg
          viewBox="0 0 24 24"
          className="relative h-16 w-16 fill-pink-400 drop-shadow-[0_0_12px_rgba(244,114,182,0.8)]"
          style={{ animation: "heartbeat 1.2s ease-in-out infinite" }}
        >
          <path d="M12 21.35c-.34 0-.67-.12-.94-.36C7.4 17.75 2.75 13.6 2.75 9.28 2.75 6.03 5.28 3.5 8.5 3.5c1.9 0 3.68.94 4.75 2.44C14.32 4.44 16.1 3.5 18 3.5c3.22 0 5.75 2.53 5.75 5.78 0 4.32-4.65 8.47-8.31 11.71-.27.24-.6.36-.94.36z" />
        </svg>
      </div>

      {/* Texto */}
      <div className="mb-1 bg-gradient-to-r from-pink-300 via-purple-300 to-pink-300 bg-clip-text text-3xl font-bold tracking-wide text-transparent">
        Chispa
      </div>
      <p className="mb-8 text-xs text-white/50">Conectando corazones...</p>

      {/* Barra de progreso */}
      <div className="h-1.5 w-56 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-pink-400 via-fuchsia-400 to-purple-400 shadow-[0_0_10px_rgba(244,114,182,0.7)] transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <span className="mt-3 text-xs text-white/40">
        {Math.floor(progress)}%
      </span>

      {/* Keyframes personalizados */}
      <style>{`
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          15% { transform: scale(1.25); }
          30% { transform: scale(1); }
          45% { transform: scale(1.15); }
          60% { transform: scale(1); }
        }
        @keyframes pulseGlow {
          0%, 100% { transform: scale(0.9); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 0.9; }
        }
        @keyframes floatUp {
          0% { transform: translateY(0) scale(0.8); opacity: 0; }
          10% { opacity: 0.9; }
          90% { opacity: 0.5; }
          100% { transform: translateY(-110vh) scale(1.1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}