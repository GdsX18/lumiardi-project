import dynamic from 'next/dynamic';
import { Header } from '@/components/ui/Header';
import { HeroSection } from '@/components/sections/HeroSection';
import { HomeHashScroll } from '@/components/HomeHashScroll';

// Server Component: só as secções (client components) são hidratadas, cada uma no seu chunk.
// Seções below-the-fold: chunks separados (SSR mantido para SEO)
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
// Feature flag: Vitrine "Explorar Rede de Elite" ocultada temporariamente a pedido da cliente
// Alternar para true quando houver modelos e agências reais aprovadas na curadoria
const SHOW_SHOWCASE_SECTION = false;

// Se a vitrine estiver desativada, não avalia o import dinâmico nem carrega assets no bundle da Home
const ShowcaseSection = SHOW_SHOWCASE_SECTION
  ? dynamic(() => import('@/components/sections/ShowcaseSection').then((m) => ({ default: m.ShowcaseSection })))
  : null;

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
  return (
    <main className="w-full min-h-screen bg-[#0B0B0B] text-ivory font-sans selection:bg-[#C9A96B] selection:text-[#0B0B0B]">
      <Header />
      <HeroSection />
      <PositioningSection />
      <BrandPillarsSection />
      <EcosystemSection />
      <PartnersSection />
      <MediaOpportunitiesSection />
      {ShowcaseSection && <ShowcaseSection />}
      <DashboardShowcaseSection />
      <PlansCTASection />
      <Footer />
      {/* Por último: o efeito precisa correr depois do hero registar o listener de expansão */}
      <HomeHashScroll />
    </main>
  );
}

