'use client';

import React, { useState } from 'react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PricingTable } from '@/components/ui/PricingTable';
import { ShieldCheck, Building2, UserCheck, Check, HardDrive, Search, Lock, Users } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

const PLAN_CONTENT = {
  pt: {
    billed_annually: (amt: string) => `Faturado anualmente por ${amt}/ano`,
    billed_monthly: 'Cobrança mensal recorrente',
    subscribe: (plan: string) => `Assinar ${plan} →`,
    glow_sub: 'Para criadoras que valorizam privacidade absoluta e desejam começar com segurança máxima.',
    glow_f1: 'Presença no Catálogo Oficial de Modelos',
    glow_f2: 'Book Digital com até 15 Fotos em Alta Resolução',
    glow_f3: <><strong>5 GB</strong> de Armazenamento Seguro no Drive</>,
    glow_f4: 'Proteção Anti-Vazamento e Blindagem E2E',
    radiance_sub: 'Para criadoras consolidadas que buscam atração contínua de agências e contratos de alto valor.',
    radiance_f1: 'Destaque no Radar de Scouting Global',
    radiance_f2: 'Book Ilimitado de Fotos + Vídeo Showreel',
    radiance_f3: <><strong>25 GB</strong> de Armazenamento Seguro no Drive</>,
    radiance_f4: 'Marca d’água Dinâmica Tokenizada e NDA',
    icon_sub: 'Para criadoras de topo que exigem prioridade editorial máxima e conexões internacionais.',
    icon_f1: 'Posicionamento Exclusivo no Topo da Vitrine',
    icon_f2: <><strong>100 GB</strong> de Armazenamento Seguro no Drive</>,
    icon_f3: 'Propostas Diretas e Buscas Scout Ilimitadas',
    icon_f4: 'Concierge Dedicado & Suporte VIP Prioritário',
    select_sub: 'Solução sob medida para agências boutique com gestão de até 10 modelos agenciadas e acesso ao catálogo oficial de talentos.',
    select_f1: <><strong>200 Buscas Scout/mês</strong> com filtros avançados</>,
    select_f2: <><strong>Blindagem & NDA</strong> inclusos em todos os contratos</>,
    select_f3: 'Chat interno seguro e gestão de contatos',
    select_f4: 'Acesso integral ao catálogo de Talentos',
    select_f5: <><strong>100 GB de Drive</strong> corporativo criptografado</>,
    sig_sub: 'Infraestrutura corporativa completa para holdings e grandes agências com representação ilimitada de elenco e recursos exclusivos.',
    sig_f1: <><strong>Scout Ilimitado</strong> de modelos e novos talentos</>,
    sig_f2: <><strong>Blindagem & NDA</strong> com suporte jurídico especializado</>,
    sig_f3: 'Espaços de organização e Kanban Ilimitados',
    sig_f4: 'Gerente de conta exclusivo e suporte VIP 24/7',
    sig_f5: <><strong>500 GB de Drive</strong> compartilhado corporativo</>,
  },
  en: {
    billed_annually: (amt: string) => `Billed annually at ${amt}/year`,
    billed_monthly: 'Monthly recurring billing',
    subscribe: (plan: string) => `Subscribe to ${plan} →`,
    glow_sub: 'For creators who value absolute privacy and want to start with maximum security.',
    glow_f1: 'Presence in the Official Model Catalog',
    glow_f2: 'Digital Book with up to 15 High-Resolution Photos',
    glow_f3: <><strong>5 GB</strong> of Secure Drive Storage</>,
    glow_f4: 'Anti-Leak Protection & E2E Shielding',
    radiance_sub: 'For established creators seeking continuous agency attraction and high-value contracts.',
    radiance_f1: 'Featured on Global Scouting Radar',
    radiance_f2: 'Unlimited Photo Book + Video Showreel',
    radiance_f3: <><strong>25 GB</strong> of Secure Drive Storage</>,
    radiance_f4: 'Dynamic Tokenized Watermark & NDA',
    icon_sub: 'For top creators requiring maximum editorial priority and global connections.',
    icon_f1: 'Exclusive Top-of-Showcase Positioning',
    icon_f2: <><strong>100 GB</strong> of Secure Drive Storage</>,
    icon_f3: 'Direct Inquiries & Unlimited Scout Searches',
    icon_f4: 'Dedicated Concierge & Priority VIP Support',
    select_sub: 'Tailored solution for boutique agencies managing up to 10 signed models with official catalog access.',
    select_f1: <><strong>200 Scout Searches/month</strong> with advanced filters</>,
    select_f2: <><strong>Shielding & NDA</strong> included in all contracts</>,
    select_f3: 'Secure internal chat & contact management',
    select_f4: 'Full access to the official Talent catalog',
    select_f5: <><strong>100 GB of Corporate Encrypted Drive</strong></>,
    sig_sub: 'Complete corporate infrastructure for holdings and major agencies with unlimited roster representation.',
    sig_f1: <><strong>Unlimited Scout</strong> for models and new talent</>,
    sig_f2: <><strong>Shielding & NDA</strong> with specialized legal support</>,
    sig_f3: 'Unlimited organization workspaces & Kanban',
    sig_f4: 'Dedicated account manager & 24/7 VIP support',
    sig_f5: <><strong>500 GB of Shared Corporate Drive</strong></>,
  },
  es: {
    billed_annually: (amt: string) => `Facturado anualmente por ${amt}/año`,
    billed_monthly: 'Cobro mensual recurrente',
    subscribe: (plan: string) => `Suscribirse a ${plan} →`,
    glow_sub: 'Para creadoras que valoran la privacidad absoluta y desean comenzar con máxima seguridad.',
    glow_f1: 'Presencia en el Catálogo Oficial de Modelos',
    glow_f2: 'Book Digital con hasta 15 Fotos en Alta Resolución',
    glow_f3: <><strong>5 GB</strong> de Almacenamiento Seguro en Drive</>,
    glow_f4: 'Protección Antifiltraciones y Blindaje E2E',
    radiance_sub: 'Para creadoras consolidadas que buscan atracción continua de agencias y contratos de alto valor.',
    radiance_f1: 'Destacado en el Radar de Scouting Global',
    radiance_f2: 'Book Ilimitado de Fotos + Vídeo Showreel',
    radiance_f3: <><strong>25 GB</strong> de Almacenamiento Seguro en Drive</>,
    radiance_f4: 'Marca de agua Dinámica Tokenizada y NDA',
    icon_sub: 'Para creadoras de élite que exigen máxima prioridad editorial y conexiones internacionales.',
    icon_f1: 'Posicionamiento Exclusivo en la Cima del Catálogo',
    icon_f2: <><strong>100 GB</strong> de Almacenamiento Seguro en Drive</>,
    icon_f3: 'Propuestas Directas y Búsquedas Scout Ilimitadas',
    icon_f4: 'Conserje Dedicado y Soporte VIP Prioritario',
    select_sub: 'Solución a medida para agencias boutique con gestión de hasta 10 modelos agenciadas y acceso al catálogo oficial.',
    select_f1: <><strong>200 Búsquedas Scout/mes</strong> con filtros avanzados</>,
    select_f2: <><strong>Blindaje & NDA</strong> incluidos en todos los contratos</>,
    select_f3: 'Chat interno seguro e gestión de contactos',
    select_f4: 'Acceso integral al catálogo de Talentos',
    select_f5: <><strong>100 GB de Drive</strong> corporativo cifrado</>,
    sig_sub: 'Infraestructura corporativa completa para holdings y grandes agencias con representación ilimitada de elenco.',
    sig_f1: <><strong>Scout Ilimitado</strong> de modelos y nuevos talentos</>,
    sig_f2: <><strong>Blindaje & NDA</strong> con soporte legal especializado</>,
    sig_f3: 'Espacios de organización y Kanban Ilimitados',
    sig_f4: 'Gerente de cuenta exclusivo y soporte VIP 24/7',
    sig_f5: <><strong>500 GB de Drive</strong> corporativo compartido</>,
  },
  fr: {
    billed_annually: (amt: string) => `Facturé annuellement ${amt}/an`,
    billed_monthly: 'Facturation mensuelle récurrente',
    subscribe: (plan: string) => `Souscrire à ${plan} →`,
    glow_sub: 'Pour les créatrices privilégiant une confidentialité absolue et un démarrage ultra-sécurisé.',
    glow_f1: 'Présence au Catalogue Officiel des Mannequins',
    glow_f2: 'Book Numérique jusqu’à 15 Photos Haute Résolution',
    glow_f3: <><strong>5 Go</strong> de Stockage Sécurisé sur Drive</>,
    glow_f4: 'Protection Anti-Fuite et Blindage E2E',
    radiance_sub: 'Pour les créatrices établies recherchant une visibilité continue auprès des agences et contrats premium.',
    radiance_f1: 'Mis en avant sur le Radar de Scouting Mondial',
    radiance_f2: 'Book Photos Illimité + Showreel Vidéo',
    radiance_f3: <><strong>25 Go</strong> de Stockage Sécurisé sur Drive</>,
    radiance_f4: 'Filigrane Dynamique Tokenisé et NDA',
    icon_sub: 'Pour les créatrices de premier plan exigeant une priorité éditoriale maximale et des réseaux internationaux.',
    icon_f1: 'Positionnement Exclusif en Tête de Vitrine',
    icon_f2: <><strong>100 Go</strong> de Stockage Sécurisé sur Drive</>,
    icon_f3: 'Propositions Directes et Recherches Scout Illimitées',
    icon_f4: 'Concierge Dédié & Support VIP Prioritaire',
    select_sub: 'Solution sur mesure pour agences boutique gérant jusqu’à 10 mannequins avec accès au catalogue officiel.',
    select_f1: <><strong>200 Recherches Scout/mois</strong> avec filtres avancés</>,
    select_f2: <><strong>Blindage & NDA</strong> inclus dans tous les contrats</>,
    select_f3: 'Messagerie interne chiffrée et gestion des contacts',
    select_f4: 'Accès complet au catalogue de Talents',
    select_f5: <><strong>100 Go de Drive</strong> d’entreprise chiffré</>,
    sig_sub: 'Infrastructure d’entreprise complète pour holdings et grandes agences avec représentation illimitée d’effectif.',
    sig_f1: <><strong>Scouting Illimité</strong> de mannequins et nouveaux talents</>,
    sig_f2: <><strong>Blindage & NDA</strong> avec accompagnement juridique dédié</>,
    sig_f3: 'Espaces d’organisation et tableaux Kanban illimités',
    sig_f4: 'Gestionnaire de compte dédié et assistance VIP 24/7',
    sig_f5: <><strong>500 Go de Drive</strong> d’entreprise partagé</>,
  },
  it: {
    billed_annually: (amt: string) => `Fatturato annualmente a ${amt}/anno`,
    billed_monthly: 'Fatturazione mensile ricorrente',
    subscribe: (plan: string) => `Abbonati a ${plan} →`,
    glow_sub: 'Per creatrici che apprezzano la privacy assoluta e desiderano iniziare con la massima sicurezza.',
    glow_f1: 'Presenza nel Catalogo Ufficiale Modelle',
    glow_f2: 'Book Digitale fino a 15 Foto in Alta Risoluzione',
    glow_f3: <><strong>5 GB</strong> di Archiviazione Sicura su Drive</>,
    glow_f4: 'Protezione Anti-Fuga e Blindatura E2E',
    radiance_sub: 'Per creatrici affermate che cercano attrazione continua da parte delle agenzie e contratti di alto valore.',
    radiance_f1: 'In evidenza sul Radar di Scouting Globale',
    radiance_f2: 'Book Fotografico Illimitato + Showreel Video',
    radiance_f3: <><strong>25 GB</strong> di Archiviazione Sicura su Drive</>,
    radiance_f4: 'Filigrana Dinamica Tokenizzata e NDA',
    icon_sub: 'Per creatrici di punta che richiedono la massima priorità editoriale e collegamenti internazionali.',
    icon_f1: 'Posizionamento Esclusivo in Cima alla Vetrina',
    icon_f2: <><strong>100 GB</strong> di Archiviazione Sicura su Drive</>,
    icon_f3: 'Proposte Dirette e Ricerche Scout Illimitate',
    icon_f4: 'Concierge Dedicato e Supporto VIP Prioritario',
    select_sub: 'Soluzione su misura per agenzie boutique con gestione fino a 10 modelle e accesso al catalogo ufficiale.',
    select_f1: <><strong>200 Ricerche Scout/mese</strong> con filtri avanzati</>,
    select_f2: <><strong>Blindatura & NDA</strong> inclusi in tutti i contratti</>,
    select_f3: 'Chat interna sicura e gestione dei contatti',
    select_f4: 'Accesso completo al catalogo dei Talenti',
    select_f5: <><strong>100 GB di Drive</strong> aziendale crittografato</>,
    sig_sub: 'Infrastruttura aziendale completa per holding e grandi agenzie con rappresentanza illimitata del cast.',
    sig_f1: <><strong>Scouting Illimitato</strong> di modelle e nuovi talenti</>,
    sig_f2: <><strong>Blindatura & NDA</strong> con supporto legale specializzato</>,
    sig_f3: 'Spazi di organizzazione e Kanban illimitati',
    sig_f4: 'Account manager dedicato e supporto VIP 24/7',
    sig_f5: <><strong>500 GB di Drive</strong> aziendale condiviso</>,
  },
  ru: {
    billed_annually: (amt: string) => `Оплата ежегодно ${amt}/год`,
    billed_monthly: 'Ежемесячное списание',
    subscribe: (plan: string) => `Подписаться на ${plan} →`,
    glow_sub: 'Для создателей, ценящих абсолютную конфиденциальность и стремящихся к максимальной безопасности.',
    glow_f1: 'Присутствие в Официальном Каталоге Моделей',
    glow_f2: 'Цифровой Бук до 15 Фотографий Высокого Разрешения',
    glow_f3: <><strong>5 ГБ</strong> Безопасного Хранилища на Диске</>,
    glow_f4: 'Защита от Утечек и Сквозное E2E Шифрование',
    radiance_sub: 'Для опытных создателей, ищущих постоянное внимание агентств и выгодные контракты.',
    radiance_f1: 'Размещение в Глобальном Скаутинг-Радаре',
    radiance_f2: 'Неограниченный Фотобук + Видео-Шоурил',
    radiance_f3: <><strong>25 ГБ</strong> Безопасного Хранилища на Диске</>,
    radiance_f4: 'Динамический Токенизированный Водяной Знак и NDA',
    icon_sub: 'Для топ-создателей, требующих наивысшего редакционного приоритета и международных связей.',
    icon_f1: 'Эксклюзивное Размещение в Топе Витрины',
    icon_f2: <><strong>100 ГБ</strong> Безопасного Хранилища на Диске</>,
    icon_f3: 'Прямые Предложения и Неограниченный Поиск Скаутов',
    icon_f4: 'Персональный Консьерж и Приоритетная VIP-Поддержка',
    select_sub: 'Индивидуальное решение для бутик-агентств с управлением до 10 моделей и доступом к каталогу.',
    select_f1: <><strong>200 Поисков Скаутов/мес</strong> с расширенными фильтрами</>,
    select_f2: <><strong>Юридическая Защита & NDA</strong> во всех контрактах</>,
    select_f3: 'Защищенный внутренний чат и управление контактами',
    select_f4: 'Полный доступ к каталогу Талантов',
    select_f5: <><strong>100 ГБ Корпоративного Зашифрованного Диска</strong></>,
    sig_sub: 'Комплексная корпоративная инфраструктура для холдингов и крупных агентств с неограниченным ростером.',
    sig_f1: <><strong>Неограниченный Скаутинг</strong> моделей и новых талантов</>,
    sig_f2: <><strong>Юридическая Защита & NDA</strong> со специализированной поддержкой</>,
    sig_f3: 'Неограниченные рабочие пространства и Канбан',
    sig_f4: 'Выделенный персональный менеджер и поддержка VIP 24/7',
    sig_f5: <><strong>500 ГБ Общего Корпоративного Диска</strong></>,
  },
};

export default function PlanosPage() {
  const [planCategory, setPlanCategory] = useState<'criadoras' | 'agencias'>('criadoras');
  const [isYearly, setIsYearly] = useState(true);
  const { language, t } = useLanguage();
  const c = PLAN_CONTENT[language as keyof typeof PLAN_CONTENT] || PLAN_CONTENT.pt;

  // Helper para direcionar SEMPRE ao cadastro/qualificação do plano selecionado
  const getPlanLink = (planId: string, category: 'criadoras' | 'agencias', yearly: boolean) => {
    const billingParam = yearly ? 'yearly' : 'monthly';
    return category === 'criadoras'
      ? `/qualificacao?plan=${planId}&billing=${billingParam}`
      : `/qualificacao/agencia?plan=${planId}&billing=${billingParam}`;
  };

  return (
    <main className="min-h-screen bg-[#F7F3EC] text-[#0B0B0B] font-sans selection:bg-[#C9A96B] selection:text-[#0B0B0B]">
      <Header />

      {/* Hero dos Planos */}
      <section className="pt-36 pb-20 bg-[#0B0B0B] text-ivory relative overflow-hidden border-b border-[#C9A96B]/30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#C9A96B]/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 border border-[#C9A96B]/30 bg-[#C9A96B]/5 text-[#C9A96B] text-xs font-sans tracking-[0.3em] uppercase">
            <ShieldCheck className="w-3.5 h-3.5 stroke-[1.2]" />
            <span>{t('plans_hero_tag')}</span>
          </div>

          <h1 className="font-serif-lumiardi text-4xl sm:text-6xl md:text-7xl font-light text-ivory tracking-tight leading-[1.05] max-w-4xl mx-auto">
            {t('plans_hero_title')}
          </h1>

          <p className="font-sans text-base md:text-xl text-ivory/70 font-light leading-relaxed max-w-2xl mx-auto">
            {t('plans_hero_desc')}
          </p>

          {/* Toggle de Categoria: Criadoras vs Agências */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPlanCategory('criadoras')}
                className={`flex items-center gap-2 px-6 py-3 text-xs md:text-sm font-sans tracking-[0.2em] uppercase font-medium transition-all duration-300 cursor-pointer ${
                  planCategory === 'criadoras'
                    ? 'bg-[#C9A96B] text-[#0B0B0B] shadow-lg'
                    : 'bg-transparent border border-white/20 text-ivory/70 hover:border-[#C9A96B] hover:text-[#C9A96B]'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>{t('plans_tab_creators')}</span>
              </button>

              <button
                onClick={() => setPlanCategory('agencias')}
                className={`flex items-center gap-2 px-6 py-3 text-xs md:text-sm font-sans tracking-[0.2em] uppercase font-medium transition-all duration-300 cursor-pointer ${
                  planCategory === 'agencias'
                    ? 'bg-[#C9A96B] text-[#0B0B0B] shadow-lg'
                    : 'bg-transparent border border-white/20 text-ivory/70 hover:border-[#C9A96B] hover:text-[#C9A96B]'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>{t('plans_tab_agencies')}</span>
              </button>
            </div>

            {/* Switch Mensal / Anual com Badge de Economia */}
            <div className="inline-flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-full">
              <button
                onClick={() => setIsYearly(false)}
                className={`px-4 py-1.5 text-xs font-sans uppercase tracking-wider rounded-full transition-all cursor-pointer ${
                  !isYearly ? 'bg-[#C9A96B] text-[#0B0B0B] font-semibold' : 'text-ivory/60 hover:text-ivory'
                }`}
              >
                {t('sub_interval_monthly')}
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`px-4 py-1.5 text-xs font-sans uppercase tracking-wider rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                  isYearly ? 'bg-[#C9A96B] text-[#0B0B0B] font-semibold' : 'text-ivory/60 hover:text-ivory'
                }`}
              >
                <span>{t('sub_interval_yearly')}</span>
                <span className="text-[9px] px-2 py-0.5 bg-emerald-500 text-black-matte font-bold rounded-full">
                  {t('sub_save_10')}
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Conteúdo da Seção de Planos */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          {planCategory === 'criadoras' ? (
            <div className="space-y-16">
              {/* Cards Resumo dos Planos das Criadoras */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Glow */}
                <div className="bg-white border border-[#0B0B0B]/10 p-8 shadow-xl space-y-6 relative hover:border-[#C9A96B] transition-all flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <span className="text-[10px] tracking-[0.25em] uppercase text-[#8C6B2F] font-sans font-semibold">
                        {t('plan_glow_badge')}
                      </span>
                      <h3 className="font-serif-lumiardi text-3xl font-normal text-[#0B0B0B]">{t('plan_glow_title')}</h3>
                      <div className="space-y-0.5">
                        <div className="text-3xl font-serif-lumiardi text-[#8C6B2F]">
                          {isYearly ? 'R$ 17,91' : 'R$ 19,90'} <span className="text-xs font-sans text-[#0B0B0B]/60 font-light">{t('plans_per_month')}</span>
                        </div>
                        <span className="text-[10px] text-[#0B0B0B]/50 font-sans block">
                          {isYearly ? c.billed_annually('R$ 214,92') : c.billed_monthly}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#0B0B0B]/75 font-sans leading-relaxed">
                      {c.glow_sub}
                    </p>

                    <ul className="space-y-3 pt-4 border-t border-[#0B0B0B]/10 text-xs font-sans text-[#0B0B0B]/85">
                      <li className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{c.glow_f1}</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{c.glow_f2}</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <HardDrive className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{c.glow_f3}</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{c.glow_f4}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-6">
                    <Link
                      href={getPlanLink('glow', 'criadoras', isYearly)}
                      className="w-full py-4 bg-[#0B0B0B] text-ivory text-center text-xs tracking-[0.2em] uppercase font-bold hover:bg-[#8C6B2F] transition-all flex items-center justify-center gap-2 shadow-md"
                    >
                      <span>{c.subscribe('Glow')}</span>
                    </Link>
                  </div>
                </div>

                {/* Radiance */}
                <div className="bg-white border border-[#0B0B0B]/10 p-8 shadow-xl space-y-6 relative hover:border-[#C9A96B] transition-all flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <span className="text-[10px] tracking-[0.25em] uppercase text-[#8C6B2F] font-sans font-semibold">
                        {t('plan_radiance_badge')}
                      </span>
                      <h3 className="font-serif-lumiardi text-3xl font-normal text-[#0B0B0B]">{t('plan_radiance_title')}</h3>
                      <div className="space-y-0.5">
                        <div className="text-3xl font-serif-lumiardi text-[#8C6B2F]">
                          {isYearly ? 'R$ 62,91' : 'R$ 69,90'} <span className="text-xs font-sans text-[#0B0B0B]/60 font-light">{t('plans_per_month')}</span>
                        </div>
                        <span className="text-[10px] text-[#0B0B0B]/50 font-sans block">
                          {isYearly ? c.billed_annually('R$ 754,92') : c.billed_monthly}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#0B0B0B]/75 font-sans leading-relaxed">
                      {c.radiance_sub}
                    </p>

                    <ul className="space-y-3 pt-4 border-t border-[#0B0B0B]/10 text-xs font-sans text-[#0B0B0B]/85">
                      <li className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{c.radiance_f1}</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{c.radiance_f2}</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <HardDrive className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{c.radiance_f3}</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{c.radiance_f4}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-6">
                    <Link
                      href={getPlanLink('radiance', 'criadoras', isYearly)}
                      className="w-full py-4 bg-[#0B0B0B] text-ivory text-center text-xs tracking-[0.2em] uppercase font-bold hover:bg-[#8C6B2F] transition-all flex items-center justify-center gap-2 shadow-md"
                    >
                      <span>{c.subscribe('Radiance')}</span>
                    </Link>
                  </div>
                </div>

                {/* Icon */}
                <div className="bg-white border-2 border-[#C9A96B] p-8 shadow-2xl space-y-6 relative flex flex-col justify-between">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#C9A96B] text-[#0B0B0B] text-[9px] uppercase tracking-[0.25em] font-bold px-4 py-1 shadow-md">
                    {t('plan_icon_rec_badge')}
                  </div>

                  <div className="space-y-6 pt-2">
                    <div className="space-y-2">
                      <span className="text-[10px] tracking-[0.25em] uppercase text-[#8C6B2F] font-sans font-semibold">
                        {t('plan_icon_badge')}
                      </span>
                      <h3 className="font-serif-lumiardi text-3xl font-normal text-[#0B0B0B]">{t('plan_icon_title')}</h3>
                      <div className="space-y-0.5">
                        <div className="text-3xl font-serif-lumiardi text-[#8C6B2F]">
                          {isYearly ? 'R$ 116,91' : 'R$ 129,90'} <span className="text-xs font-sans text-[#0B0B0B]/60 font-light">{t('plans_per_month')}</span>
                        </div>
                        <span className="text-[10px] text-[#0B0B0B]/50 font-sans block">
                          {isYearly ? c.billed_annually('R$ 1.402,92') : c.billed_monthly}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#0B0B0B]/75 font-sans leading-relaxed">
                      {c.icon_sub}
                    </p>

                    <ul className="space-y-3 pt-4 border-t border-[#0B0B0B]/10 text-xs font-sans text-[#0B0B0B]/85">
                      <li className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{c.icon_f1}</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <HardDrive className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{c.icon_f2}</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{c.icon_f3}</span>
                      </li>
                      <li className="flex items-center gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{c.icon_f4}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-6">
                    <Link
                      href={getPlanLink('icon', 'criadoras', isYearly)}
                      className="w-full py-4 bg-[#C9A96B] text-[#0B0B0B] text-center text-xs tracking-[0.2em] uppercase font-bold hover:bg-[#D4B87A] transition-all flex items-center justify-center gap-2 shadow-xl"
                    >
                      <span>{c.subscribe('Icon')}</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Tabela Comparativa Detalhada */}
              <div className="space-y-6 pt-10">
                <div className="text-center space-y-2">
                  <h3 className="font-serif-lumiardi text-3xl font-light text-[#0B0B0B]">
                    {t('plans_table_title')}
                  </h3>
                  <p className="text-sm text-[#0B0B0B]/70 font-sans">
                    {t('plans_table_desc')}
                  </p>
                </div>

                <PricingTable />
              </div>
            </div>
          ) : (
            /* Planos para Agências */
            <div className="space-y-16">
              <div className="text-center max-w-2xl mx-auto space-y-4">
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#A97745] font-sans font-medium">
                  {t('plan_agencies_sol_tag')}
                </span>
                <h2 className="font-serif-lumiardi text-4xl md:text-5xl font-light text-[#0B0B0B]">
                  {t('plan_agencies_title')}
                </h2>
                <p className="text-sm md:text-base text-[#0B0B0B]/75 font-sans font-light">
                  {t('plan_agencies_desc')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
                {/* Lumiardi Select */}
                <div className="bg-white border border-[#0B0B0B]/10 p-10 shadow-2xl space-y-8 relative hover:border-[#C9A96B] transition-all flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <span className="text-[10px] uppercase tracking-[0.25em] text-[#8C6B2F] bg-[#C9A96B]/15 border border-[#C9A96B]/30 px-3 py-1 font-sans font-semibold inline-block">
                        {t('plan_select_badge')}
                      </span>
                      <h3 className="font-serif-lumiardi text-4xl font-light text-[#0B0B0B]">
                        {t('plan_select_title')}
                      </h3>
                      <div className="space-y-0.5 pt-1">
                        <div className="text-3xl font-serif-lumiardi text-[#8C6B2F]">
                          {isYearly ? 'R$ 233,10' : 'R$ 259,00'} <span className="text-xs font-sans text-[#0B0B0B]/60 font-light">{t('plans_per_month')}</span>
                        </div>
                        <span className="text-[10px] text-[#0B0B0B]/50 font-sans block">
                          {isYearly ? c.billed_annually('R$ 2.797,20') : c.billed_monthly}
                        </span>
                      </div>
                      <p className="font-serif-lumiardi italic text-lg text-[#A97745] pt-1">
                        {t('plan_select_quote')}
                      </p>
                    </div>

                    <p className="text-sm text-[#0B0B0B]/80 font-sans font-light leading-relaxed">
                      {c.select_sub}
                    </p>

                    <ul className="space-y-3 pt-4 border-t border-[#0B0B0B]/10 text-sm font-sans text-[#0B0B0B]/90">
                      <li className="flex items-center gap-3">
                        <Search className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{c.select_f1}</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{c.select_f2}</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Lock className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{c.select_f3}</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{c.select_f4}</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <HardDrive className="w-4 h-4 text-[#8C6B2F] shrink-0" />
                        <span>{c.select_f5}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-6">
                    <Link
                      href={getPlanLink('select', 'agencias', isYearly)}
                      className="w-full py-4 bg-[#0B0B0B] text-ivory text-center text-xs tracking-[0.25em] uppercase font-bold hover:bg-[#8C6B2F] transition-all block cursor-pointer shadow-lg"
                    >
                      <span>{c.subscribe('Select')}</span>
                    </Link>
                  </div>
                </div>

                {/* Lumiardi Signature */}
                <div className="bg-[#0B0B0B] text-ivory border-2 border-[#C9A96B] p-10 shadow-2xl space-y-8 relative flex flex-col justify-between">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#C9A96B] text-[#0B0B0B] text-[9px] uppercase tracking-[0.25em] font-bold px-4 py-1 shadow-md">
                    {t('plan_sig_rec_badge')}
                  </div>

                  <div className="space-y-6 pt-2">
                    <div className="space-y-3">
                      <span className="text-[10px] uppercase tracking-[0.25em] text-[#C9A96B] bg-[#C9A96B]/15 border border-[#C9A96B]/30 px-3 py-1 font-sans font-semibold inline-block">
                        {t('plan_sig_badge')}
                      </span>
                      <h3 className="font-serif-lumiardi text-4xl font-light text-ivory">
                        {t('plan_sig_title')}
                      </h3>
                      <div className="space-y-0.5 pt-1">
                        <div className="text-3xl font-serif-lumiardi text-[#F5D77F]">
                          {isYearly ? 'R$ 441,00' : 'R$ 490,00'} <span className="text-xs font-sans text-ivory/60 font-light">{t('plans_per_month')}</span>
                        </div>
                        <span className="text-[10px] text-ivory/50 font-sans block">
                          {isYearly ? c.billed_annually('R$ 5.292,00') : c.billed_monthly}
                        </span>
                      </div>
                      <p className="font-serif-lumiardi italic text-lg text-[#C9A96B] pt-1">
                        {t('plan_sig_quote')}
                      </p>
                    </div>

                    <p className="text-sm text-ivory/80 font-sans font-light leading-relaxed">
                      {c.sig_sub}
                    </p>

                    <ul className="space-y-3 pt-4 border-t border-white/10 text-sm font-sans text-ivory/90">
                      <li className="flex items-center gap-3">
                        <Search className="w-4 h-4 text-[#C9A96B] shrink-0" />
                        <span>{c.sig_f1}</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-[#C9A96B] shrink-0" />
                        <span>{c.sig_f2}</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-[#C9A96B] shrink-0" />
                        <span>{c.sig_f3}</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-[#C9A96B] shrink-0" />
                        <span>{c.sig_f4}</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <HardDrive className="w-4 h-4 text-[#C9A96B] shrink-0" />
                        <span>{c.sig_f5}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-6">
                    <Link
                      href={getPlanLink('signature', 'agencias', isYearly)}
                      className="w-full py-4 bg-[#C9A96B] text-[#0B0B0B] text-center text-xs tracking-[0.25em] uppercase font-bold hover:bg-[#D4B87A] transition-all block cursor-pointer shadow-xl"
                    >
                      <span>{c.subscribe('Signature')}</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

