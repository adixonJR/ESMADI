import { useSyncExternalStore } from "react";

// ---------- Estado global de silencio ----------
let silenciado = localStorage.getItem("silenciado") === "1";
const medios = new Set<HTMLMediaElement>();
const oyentes = new Set<() => void>();

const YT_ORIGIN = "https://www.youtube.com";

// Silencia / activa un reproductor de YouTube incrustado (iframe)
export function aplicarAIframe(iframe: HTMLIFrameElement | null) {
  iframe?.contentWindow?.postMessage(
    JSON.stringify({
      event: "command",
      func: silenciado ? "mute" : "unMute",
      args: [],
    }),
    YT_ORIGIN
  );
}

function aplicar() {
  // <audio> y <video> que estén en el DOM
  document
    .querySelectorAll<HTMLMediaElement>("audio, video")
    .forEach((m) => medios.add(m));

  // Todos los registrados (incluye los creados con new Audio())
  medios.forEach((m) => {
    m.muted = silenciado;
  });

  // Reproductores de YouTube incrustados
  document
    .querySelectorAll<HTMLIFrameElement>('iframe[src*="youtube.com"]')
    .forEach(aplicarAIframe);

  // Si usas Howler.js, esto lo silencia también
  (window as any).Howler?.mute(silenciado);
}

// Cualquier audio/video que llame a play() queda registrado y respeta el silencio
const w = window as any;
if (!w.__sonidoParcheado) {
  w.__sonidoParcheado = true;
  const playOriginal = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
    medios.add(this);
    this.muted = silenciado;
    return playOriginal.call(this);
  };
}

export function alternarSilencio() {
  silenciado = !silenciado;
  localStorage.setItem("silenciado", silenciado ? "1" : "0");
  aplicar();
  oyentes.forEach((o) => o());
}

export function useSilenciado() {
  return useSyncExternalStore(
    (cb) => {
      oyentes.add(cb);
      return () => {
        oyentes.delete(cb);
      };
    },
    () => silenciado
  );
}

aplicar();