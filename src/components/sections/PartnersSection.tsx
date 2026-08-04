'use client';

import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ShieldCheck, Scale, Cpu, Megaphone, Landmark, Sparkles, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const PartnersSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const partners = [
    {
      company: 'AMO Advogados',
      category: t('partners_cat_legal') || 'Assessoria Jurídica & Compliance',
      icon: Scale,
      badge: 'PARCEIRO JURÍDICO OFICIAL',
      description:
        'Escritório especializado em direito digital, proteção de marca, NDAs e contratos corporativos no mercado de criadores e agências.',
      benefits: [
        'Análise preventiva de contratos de gestão e imagem',
        'Condições e honorários exclusivos para membros Lumiardi',
        'Suporte em compliance internacional e proteção de privacidade',
      ],
      linkText: 'Solicitar Atendimento Jurídico',
    },
    {
      company: 'JM Master Group',
      category: t('partners_cat_tech') || 'Soluções Tecnológicas & Segurança',
      icon: Cpu,
      badge: 'INFRAESTRUTURA DE SEGURANÇA',
      description:
        'Líder em infraestrutura de TI, proteção contra vazamentos de dados, armazenamento seguro e tecnologia financeira.',
      benefits: [
        'Auditoria preventiva de segurança digital de marca',
        'Proteção e rastreabilidade avançada de mídias',
        'Soluções de nuvem privada corporativa sob medida',
      ],
      linkText: 'Conhecer Soluções Tecnológicas',
    },
    {
      company: 'Mídia & Consultoria Estratégica',
      category: t('partners_cat_media') || 'Mídia & Consultoria Estratégica',
      icon: Megaphone,
      badge: 'GESTÃO DE IMAGEM DE LUXO',
      description:
        'Consultoria de Relações Públicas, estratégia de imagem e posicionamento editorial para criadores e agências de elite.',
      benefits: [
        'Mentoria de posicionamento executivo de luxo silencioso',
        'Planejamento de campanhas de alto impacto editorial',
        'Acesso a redes de distribuição e mídias de alto padrão',
      ],
      linkText: 'Agendar Consultoria de Mídia',
    },
    {
      company: 'Asset & Financial Management',
      category: t('partners_cat_finance') || 'Mercado Financeiro & Gestão',
      icon: Landmark,
      badge: 'SOLUÇÕES FINANCEIRAS',
      description:
        'Consultoria financeira corporativa dedicada à estruturação patrimonial, tributária e de recebíveis para o ecossistema.',
      benefits: [
        'Planejamento tributário e abertura de estruturas corporativas',
        'Gestão e proteção patrimonial privada',
        'Condições especiais em contas e investimentos parceiros',
      ],
      linkText: 'Acessar Consultoria Financeira',
    },
  ];

  useGSAP(
    () => {
      if (!containerRef.current) return;

      gsap.fromTo(
        containerRef.current.querySelectorAll('.partner-card'),
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.15,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 80%',
          },
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      id="parceiros"
      className="w-full bg-[#FAF7F2] text-[#0B0B0B] py-28 md:py-40 relative overflow-hidden border-t border-[#0B0B0B]/10"
    >
      <div className="w-full max-w-[1920px] mx-auto px-6 md:px-16 lg:px-24">
        {/* Editorial Top Section */}
        <div className="max-w-4xl space-y-6 mb-20">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-[#A97745] font-sans font-medium">
            <Sparkles className="w-4 h-4 stroke-[1.2]" />
            <span>{t('partners_tag')}</span>
          </div>

          <h2 className="font-serif-lumiardi text-4xl sm:text-6xl md:text-7xl font-light text-[#0B0B0B] tracking-tight leading-[1.05]">
            {t('partners_title')}
          </h2>

          <p className="text-lg md:text-xl text-[#0B0B0B]/80 font-sans font-light leading-relaxed max-w-3xl">
            {t('partners_desc')}
          </p>
        </div>

        {/* Grid de Parceiros Oficiais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {partners.map((partner, index) => {
            const IconComp = partner.icon;
            return (
              <div
                key={index}
                className="partner-card bg-white border border-[#0B0B0B]/10 p-8 md:p-12 shadow-xl hover:border-[#C9A96B] transition-all duration-500 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-[#0B0B0B]/10 pb-6 mb-6">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.25em] text-[#A97745] font-sans font-semibold block">
                        {partner.category}
                      </span>
                      <h3 className="font-serif-lumiardi text-3xl font-normal text-[#0B0B0B] mt-1">
                        {partner.company}
                      </h3>
                    </div>
                    <div className="p-3 bg-[#C9A96B]/15 border border-[#C9A96B]/30 text-[#8C6B2F]">
                      <IconComp className="w-6 h-6 stroke-[1.2]" />
                    </div>
                  </div>

                  <p className="text-sm text-[#0B0B0B]/75 font-sans font-light leading-relaxed mb-6">
                    {partner.description}
                  </p>

                  <div className="space-y-3 pt-4 border-t border-[#0B0B0B]/10 mb-8">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#8C6B2F] font-sans font-bold block mb-2">
                      Vantagens Exclusivas para Membros Lumiardi:
                    </span>
                    {partner.benefits.map((benefit, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-2.5 text-xs text-[#0B0B0B]/85 font-sans">
                        <CheckCircle2 className="w-4 h-4 text-[#8C6B2F] shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#0B0B0B]/10 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-sans px-3 py-1 bg-[#C9A96B]/10 text-[#8C6B2F] border border-[#C9A96B]/20 font-semibold">
                    {partner.badge}
                  </span>
                  <button
                    onClick={() => {
                      alert(`Solicitação de benefício exclusivo com ${partner.company} enviada para a curadoria Lumiardi.`);
                    }}
                    className="text-xs font-sans text-[#8C6B2F] group-hover:text-[#0B0B0B] uppercase tracking-wider font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>{partner.linkText}</span>
                    <ArrowUpRight className="w-4 h-4 stroke-[1.2] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Nota Institucional */}
        <div className="mt-16 p-6 bg-white border border-[#C9A96B]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-[#0B0B0B]/70 font-sans">
            <ShieldCheck className="w-5 h-5 text-[#8C6B2F] shrink-0" />
            <span>
              <strong>Garantia Lumiardi:</strong> Todos os parceiros listados passam por auditoria de idoneidade, ética e compliance.
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#8C6B2F] font-semibold shrink-0">
            BENEFÍCIOS AUDITADOS
          </span>
        </div>
      </div>
    </section>
  );
};
