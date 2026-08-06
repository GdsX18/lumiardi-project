'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/ui/Header';
import { HeroSection } from '@/components/sections/HeroSection';

// Seções below-the-fold: carregadas sob demanda (reduz bundle inicial no mobile)
const PositioningSection = dynamic(() =>
  import('@/components/sections/PositioningSection').then(m => ({ default: m.PositioningSection }))
);
const BrandPillarsSection = dynamic(() =>
  import('@/components/sections/BrandPillarsSection').then(m => ({ default: m.BrandPillarsSection }))
);
const EcosystemSection = dynamic(() =>
  import('@/components/sections/EcosystemSection').then(m => ({ default: m.EcosystemSection }))
);
const PartnersSection = dynamic(() =>
  import('@/components/sections/PartnersSection').then(m => ({ default: m.PartnersSection }))
);
const MediaOpportunitiesSection = dynamic(() =>
  import('@/components/sections/MediaOpportunitiesSection').then(m => ({ default: m.MediaOpportunitiesSection }))
);
const ShowcaseSection = dynamic(() =>
  import('@/components/sections/ShowcaseSection').then(m => ({ default: m.ShowcaseSection }))
);
const DashboardShowcaseSection = dynamic(() =>
  import('@/components/sections/DashboardShowcaseSection').then(m => ({ default: m.DashboardShowcaseSection }))
);
const PlansCTASection = dynamic(() =>
  import('@/components/sections/PlansCTASection').then(m => ({ default: m.PlansCTASection }))
);
const Footer = dynamic(() =>
  import('@/components/ui/Footer').then(m => ({ default: m.Footer }))
);

export default function Home() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      window.dispatchEvent(new Event('lumiardi-expand-hero'));
      const targetHash = window.location.hash.replace('#', '');
      const timer = setTimeout(() => {
        const targetElement = document.getElementById(targetHash);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <main className="w-full min-h-screen bg-[#0B0B0B] text-ivory font-sans selection:bg-[#C9A96B] selection:text-[#0B0B0B]">
      <Header />
      <HeroSection />
      <PositioningSection />
      <BrandPillarsSection />
      <EcosystemSection />
      <PartnersSection />
      <MediaOpportunitiesSection />
      <ShowcaseSection />
      <DashboardShowcaseSection />
      <PlansCTASection />
      <Footer />
    </main>
  );
}

