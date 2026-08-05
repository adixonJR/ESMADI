import confetti from "canvas-confetti";

export default function ConfettiButton() {
  const fire = () => {
    const duration = 1500;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 10,
        angle: 60,
        spread: 70,
        origin: { x: 0 },
      });

      confetti({
        particleCount: 10,
        angle: 120,
        spread: 70,
        origin: { x: 1 },
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    // 💥 Explosión central (SIN CAMBIAR COLORES)
    confetti({
      particleCount: 180,
      spread: 120,
      startVelocity: 45,
      origin: { y: 0.6 },
    });
  };

  return (
    <button
      onClick={fire}
      className="
        san-voice-btn
        flex items-center gap-2
        bg-gradient-to-r from-pink-500 to-rose-500
        text-white font-semibold
        px-6 py-3 rounded-full
        shadow-lg hover:shadow-pink-500/50
        hover:scale-105 active:scale-95
        transition-all duration-300
      "
    >
      🎉 Precioname
    </button>
  );
}
