import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Registro centralizado dos plugins do GSAP no Next.js.
 * A verificação typeof window !== 'undefined' previne erros durante o Server-Side Rendering (SSR).
 */
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export { gsap, ScrollTrigger, useGSAP };
export default gsap;
