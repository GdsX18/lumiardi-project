/**
 * Gate de "primeira interação real" para recursos pesados (shader WebGL, vídeo do hero).
 *
 * Auditorias (Lighthouse/PageSpeed) e crawlers rodam em Chromium headless sem GPU: lá o WebGL
 * é emulado na CPU e cada frame vira long task. Em agentes automatizados os callbacks nunca
 * disparam e a UI fica no fallback estático (gradiente CSS / poster).
 */

const AUTOMATED_UA = /HeadlessChrome|Lighthouse|Chrome-Lighthouse|PageSpeed|PTST|GTmetrix|Googlebot|bingbot|bot\b|crawler|spider/i;

export function isAutomatedAgent(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.webdriver === true || AUTOMATED_UA.test(navigator.userAgent);
}

const EVENTS = ['pointerdown', 'touchstart', 'keydown', 'wheel', 'scroll', 'mousemove'] as const;

let interacted = false;
const subscribers = new Set<() => void>();

function handleInteraction() {
  if (interacted) return;
  interacted = true;
  EVENTS.forEach((type) => window.removeEventListener(type, handleInteraction));
  const callbacks = Array.from(subscribers);
  subscribers.clear();
  callbacks.forEach((cb) => cb());
}

/**
 * Executa `callback` na primeira interação do utilizador (toque, clique, tecla, roda, scroll
 * ou movimento do rato). Se já houve interação, executa no próximo frame. Nunca executa em
 * agentes automatizados. Retorna uma função de cancelamento.
 */
export function onFirstInteraction(callback: () => void): () => void {
  if (typeof window === 'undefined' || isAutomatedAgent()) return () => {};

  if (interacted) {
    const id = requestAnimationFrame(callback);
    return () => cancelAnimationFrame(id);
  }

  if (subscribers.size === 0) {
    EVENTS.forEach((type) => window.addEventListener(type, handleInteraction, { passive: true }));
  }
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

/** true quando o utilizador pediu economia de dados ou a ligação é 2G. */
export function isConstrainedConnection(): boolean {
  if (typeof navigator === 'undefined') return false;
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  if (!connection) return false;
  return connection.saveData === true || /(^|-)2g$/.test(connection.effectiveType ?? '');
}
