'use client';

import { useEffect } from 'react';

/** Ao abrir a home com #âncora, expande o hero e rola até a secção correspondente. */
export function HomeHashScroll() {
  useEffect(() => {
    if (!window.location.hash) return;

    window.dispatchEvent(new Event('lumiardi-expand-hero'));
    const targetHash = window.location.hash.replace('#', '');
    const timer = setTimeout(() => {
      const targetElement = document.getElementById(targetHash);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
