'use client';

import { useEffect, useRef, ReactNode } from 'react';
import Image from 'next/image';
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
  //  Otimização e Autoplay do Vídeo (Cross-browser / 60fps)
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const video = videoRef.current;
    if (mediaType === 'video' && video) {
      video.defaultMuted = true;
      video.muted = true;
      video.playsInline = true;
      video.playbackRate = 1.0;

      const attemptPlay = () => {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.warn('Autoplay do vídeo prevenido pelo navegador:', error);
          });
        }
      };

      if (video.readyState >= 2) {
        attemptPlay();
      } else {
        video.addEventListener('canplay', attemptPlay, { once: true });
        video.addEventListener('loadeddata', attemptPlay, { once: true });
      }

      // Reinício imediato do loop para evitar micro-pausas no final
      const handleEnded = () => {
        video.currentTime = 0;
        video.play().catch(() => {});
      };
      video.addEventListener('ended', handleEnded);

      return () => {
        video.removeEventListener('ended', handleEnded);
      };
    }
  }, [mediaType, mediaSrc]);

  // ═══════════════════════════════════════════════════════════
  //  GSAP Master Timeline com Aceleração de Hardware Total
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const section = sectionRef.current;
    const media = mediaRef.current;
    if (!section || !media) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const mobile = vw < 768;
    const initW = mobile ? Math.min(230, vw - 36) : 360;
    const initH = mobile ? 330 : 500;

    // Tamanho final = TV CRT elegante
    const finalW = mobile ? vw * 0.92 : Math.min(vw * 0.82, 1100);
    const finalH = mobile ? vh * 0.64 : Math.min(vh * 0.76, 750);

    const ctx = gsap.context(() => {
      // Estado inicial com aceleração por GPU dedicada
      gsap.set(media, {
        width: initW,
        height: initH,
        borderRadius: mobile ? 16 : 20,
        xPercent: -50,
        yPercent: -50,
        left: '50%',
        top: '50%',
        scale: 1,
        force3D: true,
        transformOrigin: 'center center',
      });

      if (overlayRef.current) {
        gsap.set(overlayRef.current, { opacity: 0.35, force3D: true });
      }

      if (crtLayerRef.current) {
        gsap.set(crtLayerRef.current, { opacity: 0, force3D: true });
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=700',
          scrub: 0.6, // Scrub amortecido suave e fluido sem engasgos
          pin: true,
          anticipatePin: 1,
          fastScrollEnd: true,
          preventOverlaps: true,
          invalidateOnRefresh: true,
        },
      });

      // ── Card expande suavemente com isolamento de layout ──
      tl.to(media, {
        width: finalW,
        height: finalH,
        borderRadius: 14,
        ease: 'power1.out',
        duration: 0.65,
        force3D: true,
      }, 0);

      // ── Textos saem lateralmente com aceleração GPU ──
      tl.to(leftTextRef.current, {
        x: -(vw * 0.5),
        opacity: 0,
        ease: 'power2.in',
        duration: 0.35,
        force3D: true,
      }, 0);

      tl.to(rightTextRef.current, {
        x: vw * 0.5,
        opacity: 0,
        ease: 'power2.in',
        duration: 0.35,
        force3D: true,
      }, 0);

      // ── Background some suavemente ──
      tl.to(bgRef.current, {
        opacity: 0,
        duration: 0.45,
        ease: 'power1.out',
        force3D: true,
      }, 0);

      // ── Overlay gradiente some ──
      tl.to(overlayRef.current, {
        opacity: 0,
        duration: 0.5,
        ease: 'none',
        force3D: true,
      }, 0.1);

      // ══════════════════════════════════════════════
      //  FASE 2: Efeito CRT "TV Antiga" aparece
      // ══════════════════════════════════════════════
      tl.to(crtLayerRef.current, {
        opacity: 1,
        duration: 0.3,
        ease: 'power1.in',
        force3D: true,
      }, 0.45);

      // Leve scale-down de profundidade cinematográfica
      tl.to(media, {
        scale: 0.96,
        duration: 0.35,
        ease: 'power1.out',
        force3D: true,
      }, 0.55);

      tl.to(media, {
        boxShadow:
          'inset 0 0 80px rgba(0,0,0,0.5), inset 2px 0 12px rgba(255,50,50,0.06), inset -2px 0 12px rgba(50,50,255,0.06), 0 0 80px rgba(0,0,0,0.6)',
        duration: 0.3,
        ease: 'power1.in',
      }, 0.5);

      const handleExpand = () => {
        if (tl.scrollTrigger) {
          window.scrollTo({
            top: tl.scrollTrigger.end + 20,
            behavior: 'smooth'
          });
        }
      };

      window.addEventListener('lumiardi-expand-hero', handleExpand);
      return () => {
        window.removeEventListener('lumiardi-expand-hero', handleExpand);
      };
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
          className="absolute inset-0 z-0 overflow-hidden pointer-events-none transform-gpu"
          style={{ transform: 'translateZ(0)' }}
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

        {/* ═══ Card de Mídia Central (Hardware Accelerated + Layout Contained) ═══ */}
        <div
          ref={mediaRef}
          className="absolute left-1/2 top-1/2 overflow-hidden z-10 w-[230px] h-[330px] sm:w-[280px] sm:h-[400px] md:w-[360px] md:h-[500px] rounded-[16px] sm:rounded-[20px] shadow-[0_25px_70px_rgba(0,0,0,0.95)] border-0 transform-gpu"
          style={{
            transform: 'translate3d(-50%, -50%, 0)',
            WebkitTransform: 'translate3d(-50%, -50%, 0)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            contain: 'paint layout',
            willChange: 'transform, width, height, border-radius',
          }}
        >
          {/* Conteúdo da mídia */}
          {mediaType === 'video' ? (
            <div className="relative w-full h-full pointer-events-none overflow-hidden transform-gpu" style={{ contain: 'strict' }}>
              <video
                ref={videoRef}
                src={mediaSrc}
                poster={posterSrc}
                muted
                playsInline
                preload="auto"
                autoPlay
                loop
                controls={false}
                disablePictureInPicture
                disableRemotePlayback
                tabIndex={-1}
                aria-hidden="true"
                className="w-full h-full object-cover transform-gpu pointer-events-none"
                style={{
                  transform: 'translate3d(0, 0, 0) translateZ(0)',
                  WebkitTransform: 'translate3d(0, 0, 0) translateZ(0)',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  contain: 'strict',
                  willChange: 'transform',
                }}
              />
              <div
                ref={overlayRef}
                className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30 pointer-events-none transform-gpu"
                style={{ willChange: 'opacity' }}
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
                className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30 pointer-events-none transform-gpu"
                style={{ willChange: 'opacity' }}
              />
            </div>
          )}

          {/* ═══ CRT "TV Antiga" Layer ═══ */}
          <div
            ref={crtLayerRef}
            className="absolute inset-0 pointer-events-none z-20 transform-gpu"
            style={{ opacity: 0, willChange: 'opacity', contain: 'strict' }}
          >
            {/* Scanlines horizontais ultra-leves */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px)',
              }}
            />

            {/* Vinheta elegante */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse 85% 80% at 50% 50%, transparent 45%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0.85) 100%)',
              }}
            />

            {/* Aberração cromática sutil */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                boxShadow:
                  'inset 3px 0 14px rgba(255,30,30,0.07), inset -3px 0 14px rgba(30,30,255,0.07)',
              }}
            />

            {/* Reflexo de vidro CRT */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 35%, transparent 65%, rgba(255,255,255,0.015) 100%)',
                borderRadius: 'inherit',
              }}
            />
          </div>
        </div>

        {/* ═══ Título Esquerdo — "LUMIARDI" ═══ */}
        <h2
          ref={leftTextRef}
          className={`absolute left-2 sm:left-6 md:left-12 lg:left-20 top-1/2 -translate-y-1/2 z-20
            text-2xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl
            font-serif text-[#F7F3EC] tracking-tight uppercase select-none pointer-events-none
            drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] whitespace-nowrap transform-gpu
            ${textBlend ? 'mix-blend-difference' : ''}`}
          style={{ willChange: 'transform, opacity' }}
        >
          {firstWord}
        </h2>

        {/* ═══ Título Direito — "ECOSYSTEM" ═══ */}
        <h2
          ref={rightTextRef}
          className={`absolute right-2 sm:right-6 md:right-12 lg:right-20 top-1/2 -translate-y-1/2 z-20 text-right
            text-2xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl
            font-serif text-[#C9A96B] tracking-tight uppercase select-none pointer-events-none
            drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] whitespace-nowrap transform-gpu
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
