'use client';

import { useEffect, useRef } from 'react';

/**
 * LUMIARDI — ContentProtectionProvider
 *
 * Implementa múltiplas camadas de proteção contra captura não autorizada de conteúdo:
 *
 * 1. Bloqueio de clique direito (contextmenu)
 * 2. Bloqueio de atalhos de teclado (F12, Ctrl+Shift+I/J/U, Ctrl+U, Ctrl+P, Ctrl+S, PrintScreen)
 * 3. Overlay de desfoque ao perder foco da janela (visibilitychange + blur)
 *    → dificulta gravações de tela compartilhada e multijanela
 *
 * NOTA: Estas proteções são camadas de dissuasão — não são 100% infalíveis,
 * mas aumentam significativamente a fricção para captura não autorizada.
 * A proteção @media print está no globals.css.
 */
export function ContentProtectionProvider({ children }: { children: React.ReactNode }) {
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // --- 1. Bloqueio de clique direito ---
    const blockContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // --- 2. Bloqueio de atalhos de teclado sensíveis ---
    const blockShortcuts = (e: KeyboardEvent) => {
      const key = e.key;
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // F12 (DevTools)
      if (key === 'F12') {
        e.preventDefault();
        return;
      }

      // Ctrl+Shift+I (DevTools), Ctrl+Shift+J (Console), Ctrl+Shift+C (Inspector)
      if (ctrl && shift && (key === 'I' || key === 'i' || key === 'J' || key === 'j' || key === 'C' || key === 'c')) {
        e.preventDefault();
        return;
      }

      // Ctrl+U (View Source)
      if (ctrl && (key === 'U' || key === 'u') && !shift) {
        e.preventDefault();
        return;
      }

      // Ctrl+P (Print)
      if (ctrl && (key === 'P' || key === 'p') && !shift) {
        e.preventDefault();
        return;
      }

      // Ctrl+S (Save Page)
      if (ctrl && (key === 'S' || key === 's') && !shift) {
        e.preventDefault();
        return;
      }

      // PrintScreen
      if (key === 'PrintScreen') {
        e.preventDefault();
        return;
      }
    };

    // --- 3. Overlay de desfoque ao perder foco ---
    const createOverlay = () => {
      if (overlayRef.current) return; // Já existe
      const overlay = document.createElement('div');
      overlay.id = 'lumiardi-blur-shield';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 999999;
        backdrop-filter: blur(24px) brightness(0.4);
        -webkit-backdrop-filter: blur(24px) brightness(0.4);
        background: rgba(11, 11, 11, 0.65);
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        transition: opacity 0.15s ease;
      `;
      const msg = document.createElement('p');
      msg.textContent = 'LUMIARDI — Conteúdo Protegido';
      msg.style.cssText = `
        color: rgba(201,169,107,0.7);
        font-size: 13px;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        font-family: system-ui, sans-serif;
        user-select: none;
      `;
      overlay.appendChild(msg);
      document.body.appendChild(overlay);
      overlayRef.current = overlay;
    };

    const removeOverlay = () => {
      if (overlayRef.current) {
        overlayRef.current.remove();
        overlayRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        createOverlay();
      } else {
        removeOverlay();
      }
    };

    const handleWindowBlur = () => {
      createOverlay();
    };

    const handleWindowFocus = () => {
      removeOverlay();
    };

    // Registra todos os event listeners
    document.addEventListener('contextmenu', blockContextMenu);
    document.addEventListener('keydown', blockShortcuts);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('contextmenu', blockContextMenu);
      document.removeEventListener('keydown', blockShortcuts);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      removeOverlay();
    };
  }, []);

  return <>{children}</>;
}
