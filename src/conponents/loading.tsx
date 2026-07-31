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

  // --- Sonido de "ding" suave al terminar ---
  const playChime = () => {
    if (!soundEnabled || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    [880, 1318.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.03 + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7 + i * 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.05);
      osc.stop(now + 0.8 + i * 0.05);
    });
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
          playChime();
          setTimeout(onFinish, 500);
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
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className="absolute select-none opacity-0"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: "-10%",
              fontSize: `${10 + Math.random() * 18}px`,
              animation: `floatUp ${6 + Math.random() * 6}s linear ${
                Math.random() * 5
              }s infinite`,
              color: i % 2 === 0 ? "#ff6fa5" : "#c084fc",
            }}
          >
            ♥
          </span>
        ))}
      </div>

      {/* Resplandor central */}
      <div className="absolute h-72 w-72 rounded-full bg-pink-500/20 blur-3xl" />

      {/* Corazón latiendo */}
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
          <path d="M12 21s-6.7-4.35-9.3-8.1C.6 9.9 1.2 6.3 4.1 4.7c2.2-1.2 4.6-.5 5.9 1.2.6.8 2 .8 2.6 0 1.3-1.7 3.7-2.4 5.9-1.2 2.9 1.6 3.5 5.2 1.4 8.2C18.7 16.65 12 21 12 21z" />
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
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.5; }
          100% { transform: translateY(-110vh); opacity: 0; }
        }
      `}</style>
    </div>
  );
}