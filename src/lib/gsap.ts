import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Registro centralizado dos plugins do GSAP no Next.js.
 * A verificação typeof window !== 'undefined' previne erros durante o Server-Side Rendering (SSR).
 */
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  // No mobile a barra de endereço dispara resize a cada scroll; sem isto o ScrollTrigger
  // recalcula todos os triggers/pins continuamente (long tasks durante o scroll).
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export { gsap, ScrollTrigger, useGSAP };
export default gsap;
