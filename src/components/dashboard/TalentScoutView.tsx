'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  SlidersHorizontal,
  ShieldCheck,
  Eye,
  Send,
  MessageSquare,
  Video,
  MapPin,
  Maximize2,
  DollarSign,
  UserCheck,
  CheckCircle2,
  X,
  Play,
  RotateCcw,
} from 'lucide-react';
import { useAuthPortal } from '@/context/AuthPortalContext';
import { useLanguage } from '@/context/LanguageContext';
import { CompleteCreatorProfile } from '@/types';
import { Badge } from '@/components/ui/Badge';

/** Avatar do talento: usa apenas a foto real do perfil; sem foto, mostra a inicial do nome. */
const TalentAvatar: React.FC<{ creator: CompleteCreatorProfile; imgClassName: string }> = ({ creator, imgClassName }) => {
  const imgSrc: string = (creator as any)?.avatarUrl || (creator as any)?.avatar_url || '';
  const name = creator?.qualitative?.artisticName || '';
  if (!imgSrc) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#151515] text-gold/60 font-serif-lumiardi text-2xl uppercase">
        {name.charAt(0) || '?'}
      </div>
    );
  }
  return imgSrc.startsWith('data:') ? (
    <img src={imgSrc} alt={name} className={`absolute inset-0 w-full h-full ${imgClassName}`} />
  ) : (
    <Image src={imgSrc} alt={name} fill className={imgClassName} unoptimized />
  );
};

export const TalentScoutView: React.FC = () => {
  const { allCreators } = useAuthPortal();
  const { t, tApiError } = useLanguage();

  // Somente talentos reais vindos da base (sem perfis fictícios de demonstração)
  const pool = allCreators;

  // Estados dos Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedHair, setSelectedHair] = useState<string>('all');
  const [selectedEyes, setSelectedEyes] = useState<string>('all');
  const [minHeight, setMinHeight] = useState<number>(150);
  const [selectedAvailability, setSelectedAvailability] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal de Detalhes do Talento e Propostas
  const [selectedTalent, setSelectedTalent] = useState<CompleteCreatorProfile | null>(null);
  const [proposalModalTalent, setProposalModalTalent] = useState<CompleteCreatorProfile | null>(null);
  const [blockedModalTalent, setBlockedModalTalent] = useState<CompleteCreatorProfile | null>(null);
  const [proposalCommission, setProposalCommission] = useState('20%');
  const [proposalMessage, setProposalMessage] = useState('');
  const [sendingProposal, setSendingProposal] = useState(false);
  const [proposalSentSuccess, setProposalSentSuccess] = useState<string | null>(null);
  const [proposalError, setProposalError] = useState<string | null>(null);

  // Helper para verificar status de agenciamento e recebimento de ofertas
  const getTalentStatusInfo = (c: CompleteCreatorProfile) => {
    const isRep = Boolean((c as any)?.isRepresented ?? (c as any)?.is_represented);
    const agencyName = (c as any)?.representedAgencyName || (c as any)?.represented_agency_name || '';
    const accepts = (c as any)?.acceptsOffers !== undefined
      ? (c as any)?.acceptsOffers
      : ((c?.qualitative as any)?.acceptsOffers !== undefined
          ? (c?.qualitative as any)?.acceptsOffers
          : (c as any)?.accepts_offers !== false);

    if (isRep && !accepts) {
      return {
        label: t('dsh_ts_status_rep_blocked'),
        shortLabel: t('dsh_ts_status_blocked_short'),
        variant: 'blocked' as const,
        isRep,
        agencyName,
        acceptsOffers: false,
      };
    } else if (isRep && accepts) {
      return {
        label: t('dsh_ts_status_rep_open'),
        shortLabel: t('dsh_ts_status_open_short'),
        variant: 'rep_open' as const,
        isRep,
        agencyName,
        acceptsOffers: true,
      };
    } else if (!isRep && accepts) {
      return {
        label: t('dsh_ts_status_indep_open'),
        shortLabel: t('dsh_ts_status_open_short'),
        variant: 'indep_open' as const,
        isRep: false,
        agencyName: '',
        acceptsOffers: true,
      };
    } else {
      return {
        label: t('dsh_ts_status_indep_closed'),
        shortLabel: t('dsh_ts_status_paused_short'),
        variant: 'indep_closed' as const,
        isRep: false,
        agencyName: '',
        acceptsOffers: false,
      };
    }
  };

  // Filtragem Dinâmica
  const filteredCreators = useMemo(() => {
    return pool.filter((c) => {
      // Busca por texto (nome, cidade, hobbies)
      const name = c?.qualitative?.artisticName || c?.basicInfo?.fullName || '';
      const city = c?.basicInfo?.address?.city || '';
      const country = c?.basicInfo?.address?.country || '';

      const matchesSearch =
        searchTerm === '' ||
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.toLowerCase().includes(searchTerm.toLowerCase());

      // Categoria
      const matchesCategory =
        selectedCategory === 'all' || (c?.qualitative?.category && c.qualitative.category === selectedCategory);

      // Cabelo
      const hair = c?.qualitative?.physiognomy?.hairColor || '';
      const matchesHair =
        selectedHair === 'all' ||
        hair.toLowerCase().includes(selectedHair.toLowerCase());

      // Olhos
      const eyes = c?.qualitative?.physiognomy?.eyeColor || '';
      const matchesEyes =
        selectedEyes === 'all' ||
        eyes.toLowerCase().includes(selectedEyes.toLowerCase());

      // Altura mínima
      const heightNum = Number(c?.qualitative?.measurements?.height) || 0;
      const matchesHeight = heightNum >= minHeight;

      // Disponibilidade
      const matchesAvailability =
        selectedAvailability === 'all' ||
        (Array.isArray(c?.qualitative?.availability) && c.qualitative.availability.includes(selectedAvailability as any));

      return (
        matchesSearch &&
        matchesCategory &&
        matchesHair &&
        matchesEyes &&
        matchesHeight &&
        matchesAvailability
      );
    });
  }, [
    pool,
    searchTerm,
    selectedCategory,
    selectedHair,
    selectedEyes,
    minHeight,
    selectedAvailability,
  ]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedHair('all');
    setSelectedEyes('all');
    setMinHeight(150);
    setSelectedAvailability('all');
  };

  const handleInitiateProposal = (talent: CompleteCreatorProfile) => {
    const status = getTalentStatusInfo(talent);
    if (!status.acceptsOffers) {
      setBlockedModalTalent(talent);
    } else {
      setProposalModalTalent(talent);
      setProposalCommission('20%');
      setProposalMessage(t('dsh_ts_proposal_default_msg').replace('{name}', talent.qualitative.artisticName));
      setProposalError(null);
    }
  };

  const handleSendProposalSubmit = async () => {
    if (!proposalModalTalent) return;
    setSendingProposal(true);
    setProposalError(null);

    try {
      const res = await fetch('/api/scout/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: proposalModalTalent.id,
          message: proposalMessage,
          proposedCommission: proposalCommission,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          setBlockedModalTalent(proposalModalTalent);
          setProposalModalTalent(null);
          return;
        }
        throw new Error(tApiError(data, 'dsh_ts_proposal_error'));
      }

      setProposalSentSuccess(proposalModalTalent.qualitative.artisticName);
      setProposalModalTalent(null);
      setTimeout(() => setProposalSentSuccess(null), 5000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('dsh_ts_proposal_failed');
      setProposalError(message);
    } finally {
      setSendingProposal(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner de Busca Estilo LinkedIn de Elite */}
      <div className="p-6 md:p-8 bg-[#0F0F0F] border border-white/10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="gold">{t('agency_tab_scout')}</Badge>
            <span className="text-[10px] font-sans text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t('header_verified')}
            </span>
          </div>
          <h2 className="font-serif-lumiardi text-3xl md:text-4xl font-light text-ivory">
            {t('dash_page_agencies_title_agency')}
          </h2>
          <p className="text-xs md:text-sm font-sans text-ivory/60 mt-1 max-w-2xl">
            {t('dash_page_agencies_sub_agency')}
          </p>
        </div>

        <div className="flex items-center gap-2 self-end lg:self-center">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 text-xs font-sans uppercase tracking-wider transition-colors cursor-pointer border ${
              viewMode === 'grid'
                ? 'bg-gold text-black-matte border-gold font-semibold'
                : 'bg-[#151515] text-ivory/60 border-white/10 hover:text-ivory'
            }`}
          >
            {t('dsh_ts_view_grid')}
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-2 text-xs font-sans uppercase tracking-wider transition-colors cursor-pointer border ${
              viewMode === 'table'
                ? 'bg-gold text-black-matte border-gold font-semibold'
                : 'bg-[#151515] text-ivory/60 border-white/10 hover:text-ivory'
            }`}
          >
            {t('dsh_ts_view_table')}
          </button>
        </div>
      </div>

      {proposalSentSuccess && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs font-sans flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            {t('dsh_ts_sent_a')} <strong>{proposalSentSuccess}</strong>{t('dsh_ts_sent_b')}
          </span>
        </div>
      )}

      {/* Painel de Filtros Avançados (LinkedIn de Elite) */}
      <div className="p-5 md:p-6 bg-[#0E0E0E] border border-gold/30 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-gold font-sans text-xs uppercase tracking-widest font-semibold">
            <SlidersHorizontal className="w-4 h-4" />
            <span>{t('dsh_ts_filters_title')}</span>
          </div>
          <button
            onClick={handleResetFilters}
            className="text-[11px] font-sans text-ivory/50 hover:text-gold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> {t('dsh_ts_clear_filters')}
          </button>
        </div>

        {/* Inputs de Filtro */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Busca por Palavra-chave */}
          <div className="space-y-1">
            <label className="block text-[10px] uppercase tracking-wider text-ivory/50 font-sans">
              {t('dsh_ts_name_or_city')}
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ivory/40" />
              <input
                type="text"
                placeholder={t('dsh_ts_search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-[#161616] border border-white/10 text-xs text-ivory focus:outline-none focus:border-gold font-sans"
              />
            </div>
          </div>

          {/* Categoria */}
          <div className="space-y-1">
            <label className="block text-[10px] uppercase tracking-wider text-ivory/50 font-sans">
              {t('dsh_ts_category')}
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-[#161616] border border-white/10 text-xs text-ivory focus:outline-none focus:border-gold font-sans cursor-pointer"
            >
              <option value="all">{t('dsh_ts_all_categories')}</option>
              <option value="Criadora de conteúdo +18">{t('dsh_ts_cat_creator18')}</option>
              <option value="Criadora e acompanhante">{t('dsh_ts_cat_creator_companion')}</option>
              <option value="Acompanhante">{t('dsh_ts_cat_companion')}</option>
            </select>
          </div>

          {/* Cabelo */}
          <div className="space-y-1">
            <label className="block text-[10px] uppercase tracking-wider text-ivory/50 font-sans">
              {t('dsh_ts_hair_color')}
            </label>
            <select
              value={selectedHair}
              onChange={(e) => setSelectedHair(e.target.value)}
              className="w-full px-3 py-2 bg-[#161616] border border-white/10 text-xs text-ivory focus:outline-none focus:border-gold font-sans cursor-pointer"
            >
              <option value="all">{t('dsh_ts_any_hair')}</option>
              <option value="Castanho">{t('dsh_ts_hair_brown')}</option>
              <option value="Loiro">{t('dsh_ts_hair_blonde')}</option>
              <option value="Morena">{t('dsh_ts_hair_brunette')}</option>
              <option value="Ruiva">{t('dsh_ts_hair_red')}</option>
            </select>
          </div>

          {/* Olhos */}
          <div className="space-y-1">
            <label className="block text-[10px] uppercase tracking-wider text-ivory/50 font-sans">
              {t('dsh_ts_eye_color')}
            </label>
            <select
              value={selectedEyes}
              onChange={(e) => setSelectedEyes(e.target.value)}
              className="w-full px-3 py-2 bg-[#161616] border border-white/10 text-xs text-ivory focus:outline-none focus:border-gold font-sans cursor-pointer"
            >
              <option value="all">{t('dsh_ts_any_eyes')}</option>
              <option value="Verdes">{t('dsh_ts_eyes_green')}</option>
              <option value="Azuis">{t('dsh_ts_eyes_blue')}</option>
              <option value="Castanhos">{t('dsh_ts_eyes_brown')}</option>
            </select>
          </div>

          {/* Altura Mínima */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-ivory/50 font-sans">
              <span>{t('dsh_ts_min_height')}</span>
              <span className="text-gold font-semibold">{minHeight} cm</span>
            </div>
            <input
              type="range"
              min={150}
              max={185}
              step={1}
              value={minHeight}
              onChange={(e) => setMinHeight(Number(e.target.value))}
              className="w-full accent-gold cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 text-xs font-sans text-ivory/50">
          <span>{t('dsh_ts_found_count').replace('{count}', String(filteredCreators.length))}</span>
          <span className="text-gold">{t('dsh_ts_synced')}</span>
        </div>
      </div>

      {/* Estado vazio: sem talentos reais cadastrados ou nenhum resultado para os filtros */}
      {filteredCreators.length === 0 && (
        <div className="p-10 bg-[#0E0E0E] border border-white/10 text-center space-y-2">
          <p className="font-serif-lumiardi text-xl text-ivory">
            {pool.length === 0 ? t('dsh_ts_empty_title') : t('dsh_ts_no_match_title')}
          </p>
          <p className="text-xs font-sans text-ivory/50">
            {pool.length === 0 ? t('dsh_ts_empty_desc') : t('dsh_ts_no_match_desc')}
          </p>
        </div>
      )}

      {/* Exibição em Grid */}
      {viewMode === 'grid' && filteredCreators.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCreators.map((creator) => {
            const statusInfo = getTalentStatusInfo(creator);

            return (
              <div
                key={creator.id}
                className="bg-[#0E0E0E] border border-white/10 hover:border-gold/60 transition-all duration-300 flex flex-col justify-between overflow-hidden group shadow-xl"
              >
                {/* Imagem do Book com Badges */}
                <div className="relative h-72 bg-black overflow-hidden">
                  <TalentAvatar creator={creator} imgClassName="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                  {/* Badges do Card */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                    <div className="flex gap-2">
                      <Badge variant="gold">TOP 0.1%</Badge>
                      <span className="px-2 py-0.5 bg-black/70 backdrop-blur-md text-emerald-400 text-[9px] font-sans uppercase tracking-widest font-semibold border border-emerald-500/30">
                        {t('dsh_ts_approved')}
                      </span>
                    </div>

                    {/* Badge de Status de Agenciamento / Recebimento de Ofertas */}
                    <span
                      className={`px-2 py-0.5 backdrop-blur-md text-[9px] font-mono uppercase tracking-wider font-semibold border rounded-sm ${
                        statusInfo.variant === 'blocked'
                          ? 'bg-amber-950/85 text-amber-300 border-amber-500/50'
                          : statusInfo.variant === 'rep_open'
                          ? 'bg-purple-950/85 text-purple-300 border-purple-500/50'
                          : statusInfo.variant === 'indep_open'
                          ? 'bg-emerald-950/85 text-emerald-300 border-emerald-500/50'
                          : 'bg-zinc-900/85 text-zinc-300 border-zinc-500/50'
                      }`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3">
                    <span className="text-[10px] uppercase tracking-widest text-gold font-sans font-semibold block mb-0.5">
                      {creator.qualitative.category}
                    </span>
                    <h3 className="font-serif-lumiardi text-2xl font-medium text-ivory">
                      {creator.qualitative.artisticName}
                    </h3>
                    <p className="text-xs text-ivory/70 font-sans flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-bronze" />
                      <span>
                        {creator.basicInfo.address.city}, {creator.basicInfo.address.country}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Informações Resumidas da Ficha Técnica */}
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-sans">
                    <div className="p-2 bg-[#151515] border border-white/5">
                      <span className="text-[9px] uppercase text-ivory/40 block">{t('dsh_ts_height')}</span>
                      <span className="text-gold font-medium">
                        {creator.qualitative.measurements.height} cm
                      </span>
                    </div>
                    <div className="p-2 bg-[#151515] border border-white/5">
                      <span className="text-[9px] uppercase text-ivory/40 block">{t('dsh_ts_revenue')}</span>
                      <span className="text-emerald-400 font-medium truncate block text-[11px]">
                        {creator.qualitative.monthlyRevenueEstimate.split(' ')[0]}
                      </span>
                    </div>
                    <div className="p-2 bg-[#151515] border border-white/5">
                      <span className="text-[9px] uppercase text-ivory/40 block">{t('dsh_ts_hair')}</span>
                      <span className="text-ivory font-medium truncate block text-[11px]">
                        {creator.qualitative.physiognomy.hairColor}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs font-sans text-ivory/70 line-clamp-2 italic">
                    &quot;{creator.qualitative.mainGoal}&quot;
                  </p>

                  {/* Botões de Ação */}
                  <div className="pt-3 border-t border-white/10 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedTalent(creator)}
                      className="flex-1 px-3 py-2 bg-[#161616] hover:bg-[#222222] text-ivory border border-white/10 text-xs font-sans uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-gold" />
                      <span>{t('dsh_ts_view_book')}</span>
                    </button>

                    <button
                      onClick={() => handleInitiateProposal(creator)}
                      className={`flex-1 px-3 py-2 text-xs font-sans font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                        statusInfo.acceptsOffers
                          ? 'bg-gold hover:bg-gold-light text-black-matte'
                          : 'bg-zinc-800/80 hover:bg-zinc-700 text-ivory/70 border border-white/10'
                      }`}
                      title={!statusInfo.acceptsOffers ? t('dsh_ts_offers_disabled_title') : t('dsh_ts_send_formal_title')}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{statusInfo.acceptsOffers ? t('dsh_ts_proposal') : t('dsh_ts_offers_off')}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Exibição em Tabela Executiva */}
      {viewMode === 'table' && filteredCreators.length > 0 && (
        <div className="bg-[#0E0E0E] border border-white/10 overflow-x-auto shadow-2xl">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-[#141414] border-b border-white/10 text-ivory/50 uppercase tracking-widest text-[10px]">
                <th className="p-4">{t('dsh_ts_th_talent')}</th>
                <th className="p-4">{t('dsh_ts_th_status')}</th>
                <th className="p-4">{t('dsh_ts_category')}</th>
                <th className="p-4">{t('dsh_ts_th_location')}</th>
                <th className="p-4">{t('dsh_ts_th_biometrics')}</th>
                <th className="p-4">{t('dsh_ts_th_monthly_revenue')}</th>
                <th className="p-4 text-right">{t('dsh_ts_th_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCreators.map((creator) => {
                const statusInfo = getTalentStatusInfo(creator);

                return (
                  <tr key={creator.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 border border-gold/40 relative bg-black shrink-0 overflow-hidden">
                          <TalentAvatar creator={creator} imgClassName="object-cover" />
                        </div>
                        <div>
                          <span className="font-serif-lumiardi text-base text-ivory font-medium block">
                            {creator.qualitative.artisticName}
                          </span>
                          <span className="text-[10px] text-gold">{creator.qualitative.platforms.instagram}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider font-semibold border rounded-sm ${
                          statusInfo.variant === 'blocked'
                            ? 'bg-amber-950/85 text-amber-300 border-amber-500/50'
                            : statusInfo.variant === 'rep_open'
                            ? 'bg-purple-950/85 text-purple-300 border-purple-500/50'
                            : statusInfo.variant === 'indep_open'
                            ? 'bg-emerald-950/85 text-emerald-300 border-emerald-500/50'
                            : 'bg-zinc-900/85 text-zinc-300 border-zinc-500/50'
                        }`}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="p-4 text-ivory/70">{creator.qualitative.category}</td>
                    <td className="p-4 text-ivory/70">
                      {creator.basicInfo.address.city}, {creator.basicInfo.address.country}
                    </td>
                    <td className="p-4 text-ivory/80">
                      {creator.qualitative.measurements.height}cm · {creator.qualitative.measurements.weight}kg · {creator.qualitative.measurements.waist}/{creator.qualitative.measurements.bust}/{creator.qualitative.measurements.hips}
                    </td>
                    <td className="p-4 text-emerald-400 font-medium">
                      {creator.qualitative.monthlyRevenueEstimate}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedTalent(creator)}
                          className="px-2.5 py-1.5 bg-[#181818] hover:bg-gold hover:text-black-matte text-ivory text-[10px] uppercase font-sans border border-white/10 transition-colors cursor-pointer"
                        >
                          Book
                        </button>
                        <button
                          onClick={() => handleInitiateProposal(creator)}
                          className={`px-3 py-1.5 text-[10px] uppercase font-sans font-semibold transition-colors cursor-pointer ${
                            statusInfo.acceptsOffers
                              ? 'bg-gold hover:bg-gold-light text-black-matte'
                              : 'bg-zinc-800 text-ivory/60 border border-white/10 hover:bg-zinc-700'
                          }`}
                        >
                          {statusInfo.acceptsOffers ? t('dsh_ts_hire') : t('dsh_ts_offers_off')}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Book Completo da Modelo */}
      <AnimatePresence>
        {selectedTalent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0F0F0F] border border-gold/40 p-6 md:p-8 max-w-3xl w-full text-ivory shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto relative"
            >
              <button
                onClick={() => setSelectedTalent(null)}
                className="absolute top-4 right-4 text-ivory/60 hover:text-gold cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                <div className="relative w-16 h-16 border-2 border-gold/40 bg-black shrink-0 overflow-hidden">
                  <TalentAvatar creator={selectedTalent} imgClassName="object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="gold">{t('dsh_ts_approved')}</Badge>
                    <span className="text-[10px] text-emerald-400 font-sans">{t('dsh_ts_docs_verified')}</span>
                  </div>
                  <h3 className="font-serif-lumiardi text-3xl font-light text-ivory mt-0.5">
                    {selectedTalent.qualitative.artisticName}
                  </h3>
                  <span className="text-xs text-ivory/60 font-sans">
                    {selectedTalent.basicInfo.address.city}, {selectedTalent.basicInfo.address.country} · {selectedTalent.qualitative.platforms.instagram}
                  </span>
                </div>
              </div>

              {/* Ficha Técnica Modal */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-sans">
                <div className="p-3 bg-[#151515] border border-white/5">
                  <span className="text-ivory/40 block text-[10px] uppercase">{t('dsh_ts_height')}</span>
                  <span className="font-serif-lumiardi text-base text-gold">
                    {selectedTalent.qualitative.measurements.height} cm
                  </span>
                </div>
                <div className="p-3 bg-[#151515] border border-white/5">
                  <span className="text-ivory/40 block text-[10px] uppercase">{t('dsh_ts_bust_waist_hips')}</span>
                  <span className="font-serif-lumiardi text-base text-gold">
                    {selectedTalent.qualitative.measurements.bust}/{selectedTalent.qualitative.measurements.waist}/{selectedTalent.qualitative.measurements.hips}
                  </span>
                </div>
                <div className="p-3 bg-[#151515] border border-white/5">
                  <span className="text-ivory/40 block text-[10px] uppercase">{t('dsh_ts_physiognomy')}</span>
                  <span className="text-ivory font-medium text-[11px]">
                    {selectedTalent.qualitative.physiognomy.hairColor} / {selectedTalent.qualitative.physiognomy.eyeColor}
                  </span>
                </div>
                <div className="p-3 bg-[#151515] border border-white/5">
                  <span className="text-ivory/40 block text-[10px] uppercase">{t('dsh_ts_avg_revenue')}</span>
                  <span className="text-emerald-400 font-medium text-[11px]">
                    {selectedTalent.qualitative.monthlyRevenueEstimate}
                  </span>
                </div>
              </div>

              {/* Limites e Objetivos */}
              <div className="space-y-3 text-xs font-sans">
                <div className="p-3.5 bg-[#141414] border border-white/5">
                  <span className="text-bronze font-semibold uppercase tracking-wider text-[10px] block mb-1">
                    {t('dsh_ts_declared_goal')}
                  </span>
                  <p className="text-ivory/80">&quot;{selectedTalent.qualitative.mainGoal}&quot;</p>
                </div>

                <div className="p-3.5 bg-[#141414] border border-white/5">
                  <span className="text-bronze font-semibold uppercase tracking-wider text-[10px] block mb-1">
                    {t('dsh_ts_personal_limits')}
                  </span>
                  <p className="text-ivory/80">&quot;{selectedTalent.qualitative.personalLimits}&quot;</p>
                </div>
              </div>

              {/* Ações no Modal */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => setSelectedTalent(null)}
                  className="px-4 py-2 text-xs font-sans uppercase text-ivory/60 hover:text-ivory cursor-pointer"
                >
                  {t('dsh_ts_close')}
                </button>
                <button
                  onClick={() => {
                    const t = selectedTalent;
                    setSelectedTalent(null);
                    handleInitiateProposal(t);
                  }}
                  className="px-6 py-2.5 bg-gold hover:bg-gold-light text-black-matte font-semibold text-xs font-sans uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{t('dsh_ts_send_rep_proposal')}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal 1: Formulário de Envio de Proposta Formal */}
      <AnimatePresence>
        {proposalModalTalent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#111111] border border-gold/50 p-6 md:p-8 max-w-xl w-full text-ivory shadow-2xl space-y-5 relative rounded-sm"
            >
              <button
                onClick={() => setProposalModalTalent(null)}
                className="absolute top-4 right-4 text-ivory/60 hover:text-gold cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="border-b border-white/10 pb-4">
                <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-gold font-semibold block">
                  {t('dsh_ts_official_scout')}
                </span>
                <h3 className="font-serif-lumiardi text-2xl text-ivory mt-1">
                  {t('dsh_ts_send_proposal_to').replace('{name}', proposalModalTalent.qualitative.artisticName)}
                </h3>
                <p className="text-xs text-ivory/60 font-sans mt-1">
                  {t('dsh_ts_proposal_modal_desc')}
                </p>
              </div>

              {proposalError && (
                <div className="p-3 bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-sans">
                  {proposalError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-sans text-ivory/70 uppercase tracking-wider mb-1">
                    {t('dsh_ts_commission_label')}
                  </label>
                  <input
                    type="text"
                    value={proposalCommission}
                    onChange={(e) => setProposalCommission(e.target.value)}
                    placeholder={t('dsh_ts_commission_placeholder')}
                    className="w-full bg-[#181818] border border-white/15 focus:border-gold px-3.5 py-2.5 text-xs text-ivory outline-none rounded-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-sans text-ivory/70 uppercase tracking-wider mb-1">
                    {t('dsh_ts_message_label')}
                  </label>
                  <textarea
                    rows={4}
                    value={proposalMessage}
                    onChange={(e) => setProposalMessage(e.target.value)}
                    placeholder={t('dsh_ts_message_placeholder')}
                    className="w-full bg-[#181818] border border-white/15 focus:border-gold p-3 text-xs text-ivory outline-none rounded-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setProposalModalTalent(null)}
                  className="px-4 py-2 text-xs font-sans uppercase text-ivory/60 hover:text-ivory cursor-pointer"
                >
                  {t('dsh_ts_cancel')}
                </button>

                <button
                  type="button"
                  disabled={sendingProposal || !proposalMessage.trim()}
                  onClick={handleSendProposalSubmit}
                  className="px-6 py-2.5 bg-gold hover:bg-gold-light text-black-matte font-bold text-xs font-sans uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingProposal ? t('dsh_ts_transmitting') : t('dsh_ts_transmit')}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal 2: Aviso de Ofertas Desativadas / Já Agenciada */}
      <AnimatePresence>
        {blockedModalTalent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#131313] border border-amber-500/50 p-6 md:p-8 max-w-lg w-full text-ivory shadow-2xl space-y-5 relative rounded-sm text-center"
            >
              <button
                onClick={() => setBlockedModalTalent(null)}
                className="absolute top-4 right-4 text-ivory/60 hover:text-gold cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-full bg-amber-950/60 border border-amber-500/50 flex items-center justify-center mx-auto text-amber-400">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-amber-400 font-semibold block mb-1">
                  {t('dsh_ts_blocked_title')}
                </span>
                <h3 className="font-serif-lumiardi text-2xl text-ivory">
                  {blockedModalTalent.qualitative.artisticName}
                </h3>
              </div>

              <div className="p-4 bg-black/50 border border-white/5 text-xs font-sans text-ivory/80 leading-relaxed text-left space-y-2 rounded-sm">
                <p>
                  <strong>{t('dsh_ts_system_notice')}</strong> {t('dsh_ts_blocked_desc')}
                </p>
                <p className="text-ivory/60 text-[11px]">
                  {t('dsh_ts_blocked_note')}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBlockedModalTalent(null)}
                  className="px-6 py-2.5 bg-gold hover:bg-gold-light text-black-matte font-bold text-xs font-sans uppercase tracking-wider cursor-pointer shadow-md rounded-sm"
                >
                  {t('dsh_ts_understood')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const t = blockedModalTalent;
                    setBlockedModalTalent(null);
                    setSelectedTalent(t);
                  }}
                  className="px-4 py-2.5 bg-[#181818] border border-white/15 text-ivory text-xs font-sans uppercase tracking-wider hover:border-gold transition-colors cursor-pointer rounded-sm"
                >
                  {t('dsh_ts_view_public_book')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
