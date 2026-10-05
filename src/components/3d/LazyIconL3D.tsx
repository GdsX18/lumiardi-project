'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { onFirstInteraction } from '@/lib/userInteraction';
import type { IconL3DProps } from './IconL3D';

// three.js + R3F + drei (~870 KB) ficam fora do bundle inicial: só são baixados
// quando o ícone se aproxima da viewport.
const IconL3D = dynamic(() => import('./IconL3D').then((m) => ({ default: m.IconL3D })), {
  ssr: false,
});

/**
 * Wrapper que reserva o espaço do ícone 3D (sem CLS) e só monta o Canvas WebGL
 * quando o elemento está a ~300px da viewport e já houve interação real do utilizador
 * (nunca em agentes automatizados).
 */
export const LazyIconL3D: React.FC<IconL3DProps> = ({ className = 'w-48 h-48 md:w-64 md:h-64' }) => {
  const placeholderRef = useRef<HTMLDivElement>(null);
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    const el = placeholderRef.current;
    if (!el || shouldMount) return;

    let cancelStart: () => void = () => {};
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        cancelStart = onFirstInteraction(() => setShouldMount(true));
      },
      { rootMargin: '300px 0px' }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelStart();
    };
  }, [shouldMount]);

  if (shouldMount) return <IconL3D className={className} />;

  return <div ref={placeholderRef} className={`relative ${className}`} aria-hidden="true" />;
};
