'use client';

import { useEffect } from 'react';

/**
 * O Safari do iOS ignora `user-scalable=no` por acessibilidade, então o pinch-to-zoom
 * continua possível mesmo com o viewport travado. Quando o site roda como web app
 * (adicionado à Tela de Início), bloqueamos os eventos de gesto do WebKit para manter
 * a sensação de app nativo. No navegador comum o zoom não é tocado.
 */
export const StandaloneZoomGuard = () => {
  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (!isStandalone) return;

    const prevent = (e: Event) => e.preventDefault();
    const events = ['gesturestart', 'gesturechange', 'gestureend'] as const;
    events.forEach((name) => document.addEventListener(name, prevent, { passive: false }));
    return () => events.forEach((name) => document.removeEventListener(name, prevent));
  }, []);

  return null;
};
