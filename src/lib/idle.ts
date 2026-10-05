/**
 * Agenda trabalho não crítico para quando a thread principal estiver ociosa.
 * Fallback para setTimeout em navegadores sem requestIdleCallback (Safari).
 * Retorna uma função de cancelamento.
 */
export function onIdle(callback: () => void, timeout = 2000): () => void {
  if (typeof window === 'undefined') return () => {};

  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(callback, { timeout });
    return () => window.cancelIdleCallback(id);
  }

  const id = setTimeout(callback, 200);
  return () => clearTimeout(id);
}

/**
 * Executa o callback após o evento `load` da página e um período ocioso,
 * tirando inicializações pesadas (WebGL, 3D) da janela de arranque.
 */
export function afterLoadIdle(callback: () => void, timeout = 3000): () => void {
  if (typeof window === 'undefined') return () => {};

  let cancelIdle: () => void = () => {};
  const schedule = () => {
    cancelIdle = onIdle(callback, timeout);
  };

  if (document.readyState === 'complete') {
    schedule();
    return () => cancelIdle();
  }

  window.addEventListener('load', schedule, { once: true });
  return () => {
    window.removeEventListener('load', schedule);
    cancelIdle();
  };
}
