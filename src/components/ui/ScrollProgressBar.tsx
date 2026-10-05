'use client';

import { useEffect, useRef } from 'react';

/**
 * Barra de progresso de scroll sem framer-motion (é renderizada no layout raiz, em todas as páginas).
 * A leitura do scroll é agrupada num único requestAnimationFrame e a suavização (antes uma spring)
 * fica a cargo de uma transição CSS no compositor.
 */
export const ScrollProgressBar = () => {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      bar.style.transform = `scaleX(${progress})`;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  return (
    <div
      ref={barRef}
      className="fixed top-0 left-0 right-0 z-[200] h-[2px] origin-left"
      style={{
        transform: 'scaleX(0)',
        transition: 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
        willChange: 'transform',
        background: 'linear-gradient(90deg, #8C6B2F, #C9A96B, #D4B87A)',
      }}
    />
  );
};
