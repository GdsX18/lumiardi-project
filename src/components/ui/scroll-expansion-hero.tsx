'use client';

import { useEffect, useRef, ReactNode } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LumiardiShaderBg } from './LumiardiShaderBg';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface ScrollExpandMediaProps {
  mediaType?: 'video' | 'image';
  mediaSrc: string;
  posterSrc?: string;
  bgImageSrc?: string;
  useShaderBg?: boolean;
  title?: string;
  date?: string;
  scrollToExpand?: string;
  textBlend?: boolean;
  children?: ReactNode;
}

const ScrollExpandMedia = ({
  mediaType = 'video',
  mediaSrc,
  posterSrc,
  bgImageSrc,
  useShaderBg = true,
  title = 'LUMIARDI ECOSYSTEM',
  date,
  scrollToExpand,
  textBlend = false,
  children,
}: ScrollExpandMediaProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const leftTextRef = useRef<HTMLHeadingElement>(null);
  const rightTextRef = useRef<HTMLHeadingElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const crtLayerRef = useRef<HTMLDivElement>(null);

  // ═══════════════════════════════════════════════════════════
  //  Safari / Mac Autoplay Fix
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (mediaType === 'video' && videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn('Autoplay do vídeo prevenido pelo navegador:', error);
        });
      }
    }
  }, [mediaType, mediaSrc]);

  // ═══════════════════════════════════════════════════════════
  //  GSAP Master Timeline
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const section = sectionRef.current;
    const media = mediaRef.current;
    if (!section || !media) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const mobile = vw < 768;
    const initW = mobile ? Math.min(280, vw - 32) : 380;
    const initH = mobile ? 400 : 520;

    // Tamanho final = TV CRT (não chega a fullscreen)
    const finalW = mobile ? vw * 0.92 : vw * 0.86;
    const finalH = mobile ? vh * 0.72 : vh * 0.78;

    const ctx = gsap.context(() => {
      // Estado inicial
      gsap.set(media, {
        width: initW,
        height: initH,
        borderRadius: 24,
        xPercent: -50,
        yPercent: -50,
      });

      if (overlayRef.current) {
        gsap.set(overlayRef.current, { opacity: 0.45 });
      }

      // CRT começa invisível
      if (crtLayerRef.current) {
        gsap.set(crtLayerRef.current, { opacity: 0 });
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=600',
          scrub: 0.5,
          pin: true,
          anticipatePin: 1,
        },
      });

      // ── Card expande até tamanho CRT (0 → 65%) ──
      tl.to(media, {
        width: finalW,
        height: finalH,
        borderRadius: 14,
        ease: 'power2.inOut',
        duration: 0.65,
      }, 0);

      // ── Textos saem lateralmente (0 → 35%) ──
      tl.to(leftTextRef.current, {
        x: -(vw * 0.6),
        opacity: 0,
        ease: 'power3.in',
        duration: 0.35,
      }, 0);

      tl.to(rightTextRef.current, {
        x: vw * 0.6,
        opacity: 0,
        ease: 'power3.in',
        duration: 0.35,
      }, 0);



      // ── Background some ──
      tl.to(bgRef.current, {
        opacity: 0,
        duration: 0.45,
        ease: 'power2.out',
      }, 0);

      // ── Overlay gradiente some ──
      tl.to(overlayRef.current, {
        opacity: 0,
        duration: 0.5,
        ease: 'none',
      }, 0.1);

      // ══════════════════════════════════════════════
      //  FASE 2: Efeito CRT "TV Antiga" aparece
      //  (após a expansão, 50% → 80% do scroll)
      // ══════════════════════════════════════════════

      // CRT overlays (scanlines + vinheta + reflexo) aparecem
      tl.to(crtLayerRef.current, {
        opacity: 1,
        duration: 0.3,
        ease: 'power1.in',
      }, 0.45);

      // Leve scale-down para efeito "empurrado para trás"
      tl.to(media, {
        scale: 0.96,
        duration: 0.35,
        ease: 'power2.out',
      }, 0.55);

      // Sombra interna CRT aparece (profundidade)
      tl.to(media, {
        boxShadow:
          'inset 0 0 80px rgba(0,0,0,0.5), inset 2px 0 12px rgba(255,50,50,0.06), inset -2px 0 12px rgba(50,50,255,0.06), 0 0 80px rgba(0,0,0,0.6)',
        duration: 0.3,
        ease: 'power1.in',
      }, 0.5);
    }, section);

    return () => ctx.revert();
  }, [mediaType]);

  // Extrai palavras do título
  const titleWords = title ? title.split(' ') : ['LUMIARDI', 'ECOSYSTEM'];
  const firstWord = titleWords[0] || 'LUMIARDI';
  const restOfTitle = titleWords.slice(1).join(' ') || 'ECOSYSTEM';

  return (
    <>
      {/* ═══ Seção Pinada — 100vh ═══ */}
      <div
        ref={sectionRef}
        className="relative h-screen w-full bg-[#0B0B0B] overflow-hidden"
      >
        {/* Background Shader / Imagem */}
        <div
          ref={bgRef}
          className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
        >
          {useShaderBg ? (
            <LumiardiShaderBg className="w-full h-full absolute inset-0" />
          ) : bgImageSrc ? (
            <Image
              src={bgImageSrc}
              alt="Background"
              fill
              className="object-cover object-center"
              priority
            />
          ) : (
            <div className="w-full h-full bg-[#0B0B0B]" />
          )}
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* ═══ Card de Mídia + CRT ═══ */}
        <div
          ref={mediaRef}
          className="absolute left-1/2 top-1/2 overflow-hidden z-10"
          style={{ willChange: 'width, height, border-radius, transform' }}
        >
          {/* Conteúdo da mídia */}
          {mediaType === 'video' ? (
            <div className="relative w-full h-full pointer-events-none">
              <video
                ref={videoRef}
                src={mediaSrc}
                poster={posterSrc}
                muted
                playsInline
                preload="auto"
                autoPlay
                loop
                className="w-full h-full object-cover"
              />
              <div
                ref={overlayRef}
                className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30 pointer-events-none"
              />
            </div>
          ) : (
            <div className="relative w-full h-full">
              <Image
                src={mediaSrc}
                alt={title || 'Lumiardi Premium Media'}
                fill
                className="object-cover"
                priority
              />
              <div
                ref={overlayRef}
                className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30 pointer-events-none"
              />
            </div>
          )}

          {/* ═══ CRT "TV Antiga" Layer ═══
              Todas as camadas do efeito ficam dentro deste wrapper.
              GSAP controla a opacidade deste div inteiro.
          */}
          <div
            ref={crtLayerRef}
            className="absolute inset-0 pointer-events-none z-20"
            style={{ opacity: 0 }}
          >
            {/* Scanlines horizontais */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0,0,0,0.13) 2px, rgba(0,0,0,0.13) 4px)',
                mixBlendMode: 'multiply',
              }}
            />

            {/* Vinheta forte (escurece as bordas como tela CRT curva) */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 85% 80% at 50% 50%, transparent 45%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0.85) 100%)',
              }}
            />

            {/* Aberração cromática nas bordas (RGB fringe sutil) */}
            <div
              className="absolute inset-0"
              style={{
                boxShadow:
                  'inset 3px 0 14px rgba(255,30,30,0.07), inset -3px 0 14px rgba(30,30,255,0.07)',
              }}
            />

            {/* Reflexo de vidro CRT (brilho diagonal sutil) */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 35%, transparent 65%, rgba(255,255,255,0.015) 100%)',
                borderRadius: 'inherit',
              }}
            />

            {/* Noise/grain sutil (textura de fósforo) */}
            <div
              className="absolute inset-0 opacity-[0.035]"
              style={{
                backgroundImage:
                  'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
                backgroundSize: '128px 128px',
              }}
            />
          </div>
        </div>

        {/* ═══ Título Esquerdo — "LUMIARDI" ═══ */}
        <h2
          ref={leftTextRef}
          className={`absolute left-4 sm:left-8 md:left-12 lg:left-20 top-1/2 -translate-y-1/2 z-20
            text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl
            font-serif text-[#F7F3EC] tracking-tight uppercase select-none pointer-events-none
            drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] whitespace-nowrap
            ${textBlend ? 'mix-blend-difference' : ''}`}
          style={{ willChange: 'transform, opacity' }}
        >
          {firstWord}
        </h2>

        {/* ═══ Título Direito — "ECOSYSTEM" ═══ */}
        <h2
          ref={rightTextRef}
          className={`absolute right-4 sm:right-8 md:right-12 lg:right-20 top-1/2 -translate-y-1/2 z-20 text-right
            text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl
            font-serif text-[#C9A96B] tracking-tight uppercase select-none pointer-events-none
            drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] whitespace-nowrap
            ${textBlend ? 'mix-blend-difference' : ''}`}
          style={{ willChange: 'transform, opacity' }}
        >
          {restOfTitle}
        </h2>


      </div>

      {/* ═══ Conteúdo FORA do pin ═══ */}
      {children}
    </>
  );
};

export default ScrollExpandMedia;
