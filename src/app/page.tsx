'use client';

import React, { useEffect } from 'react';
import { Header } from '@/components/ui/Header';
import { HeroSection } from '@/components/sections/HeroSection';
import { PositioningSection } from '@/components/sections/PositioningSection';
import { BrandPillarsSection } from '@/components/sections/BrandPillarsSection';
import { EcosystemSection } from '@/components/sections/EcosystemSection';
import { PartnersSection } from '@/components/sections/PartnersSection';
import { MediaOpportunitiesSection } from '@/components/sections/MediaOpportunitiesSection';
import { ShowcaseSection } from '@/components/sections/ShowcaseSection';
import { DashboardShowcaseSection } from '@/components/sections/DashboardShowcaseSection';
import { PlansCTASection } from '@/components/sections/PlansCTASection';
import { Footer } from '@/components/ui/Footer';

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
