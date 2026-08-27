'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Play,
  CheckCircle2,
  ShieldCheck,
  Globe,
  Maximize2,
  Upload,
  Eye,
  Sliders,
  DollarSign,
  Heart,
  Target,
  FileText,
  X,
  Edit3,
  Plus,
  Building2,
  UserCheck,
  MapPin,
  ClipboardList,
  Share2,
} from 'lucide-react';
import { useAuthPortal } from '@/context/AuthPortalContext';
import { useLanguage } from '@/context/LanguageContext';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EditProfileModal } from './EditProfileModal';

export const CreatorProfileView: React.FC = () => {
  const { activeCreator, refreshData } = useAuthPortal();
  const { t } = useLanguage();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'book' | 'tech-sheet' | 'limits'>('book');

  // Estado do Modal de Edição
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editModalTab, setEditModalTab] = useState<'basic' | 'book' | 'video' | 'measurements' | 'limits'>('basic');

  const openEditModal = (tab: 'basic' | 'book' | 'video' | 'measurements' | 'limits' = 'basic') => {
    setEditModalTab(tab);
    setIsEditModalOpen(true);
  };

  // Fallback padrão para primeiro acesso
  const defaultProfile = {
    avatarUrl: '',
    videoUrl: '',
    qualitative: {
      artisticName: 'Sua Conta Modelo',
      category: 'Modelo & Criadora VIP',
      gender: 'Feminino',
      hobbies: 'Moda, Produção Editorial e Fotografia',
      platforms: {
        instagram: '@suaconta',
        privacy: '',
        onlyfans: '',
      },
      monthlyRevenueEstimate: 'Sob Consulta',
      conversionRateEstimate: '0.0%',
      availability: ['Tarde', 'Noite'],
      hasChildren: false,
      languages: ['Português'],
      exposureOpinion: 'Posicionamento exclusivo e elegante.',
      personalLimits: 'Preservação de imagem e contratos sob curadoria.',
      mainGoal: 'Conectar com agências internacionais de prestígio.',
      measurements: {
        height: '175',
        weight: '55',
        waist: '60',
        bust: '88',
        hips: '90',
      },
      physiognomy: {
        hairColor: 'Natural',
        eyeColor: 'Castanhos',
        skinTone: 'Natural',
      },
    },
    basicInfo: {
      address: {
        country: 'Brasil',
        state: 'SP',
        city: 'São Paulo',
      },
    },
    photos: [] as Array<{ id: string; url: string; title: string; tag?: string }>,
  };

  const creator = {
    ...defaultProfile,
    ...activeCreator,
    avatarUrl: (activeCreator as any)?.avatarUrl || (activeCreator as any)?.avatar_url || (activeCreator as any)?.photos?.[0]?.url || defaultProfile.avatarUrl || '/api/media/assets/images/creator_elena.jpg',
    qualitative: {
      ...defaultProfile.qualitative,
      ...(activeCreator?.qualitative || {}),
      artisticName: activeCreator?.qualitative?.artisticName || (activeCreator as any)?.artistic_name || defaultProfile.qualitative.artisticName,
      category: activeCreator?.qualitative?.category || (activeCreator as any)?.category || defaultProfile.qualitative.category,
      platforms: {
        ...defaultProfile.qualitative.platforms,
        ...(activeCreator?.qualitative?.platforms || {}),
        instagram: activeCreator?.qualitative?.platforms?.instagram || (activeCreator as any)?.instagram || defaultProfile.qualitative.platforms.instagram,
      },
      measurements: {
        ...defaultProfile.qualitative.measurements,
        ...(activeCreator?.qualitative?.measurements || (activeCreator as any)?.measurements || {}),
      },
      physiognomy: {
        ...defaultProfile.qualitative.physiognomy,
        ...(activeCreator?.qualitative?.physiognomy || {}),
      },
      monthlyRevenueEstimate: activeCreator?.qualitative?.monthlyRevenueEstimate || (activeCreator as any)?.monthly_revenue_estimate || defaultProfile.qualitative.monthlyRevenueEstimate,
      personalLimits: activeCreator?.qualitative?.personalLimits || (activeCreator as any)?.exposure_opinion || defaultProfile.qualitative.personalLimits,
      mainGoal: activeCreator?.qualitative?.mainGoal || defaultProfile.qualitative.mainGoal,
      exposureOpinion: activeCreator?.qualitative?.exposureOpinion || defaultProfile.qualitative.exposureOpinion,
    },
    basicInfo: {
      ...defaultProfile.basicInfo,
      ...(activeCreator?.basicInfo || {}),
      address: {
        ...defaultProfile.basicInfo.address,
        ...(activeCreator?.basicInfo?.address || (activeCreator as any)?.address || {}),
      },
    },
    photos: (activeCreator as any)?.photos || (activeCreator?.qualitative as any)?.photos || defaultProfile.photos,
    videoUrl: (activeCreator as any)?.videoUrl || (activeCreator as any)?.video_url || defaultProfile.videoUrl,
    acceptsOffers: (activeCreator as any)?.acceptsOffers !== undefined
      ? (activeCreator as any)?.acceptsOffers
      : ((activeCreator?.qualitative as any)?.acceptsOffers !== undefined
          ? (activeCreator?.qualitative as any)?.acceptsOffers
          : (activeCreator as any)?.accepts_offers !== false),
    isRepresented: Boolean((activeCreator as any)?.isRepresented ?? (activeCreator as any)?.is_represented),
    representedAgencyName: (activeCreator as any)?.representedAgencyName || (activeCreator as any)?.represented_agency_name || '',
  };

  const bookPhotos = (Array.isArray(creator.photos) ? creator.photos : []).filter(
    (photo: any) => photo && typeof photo.url === 'string' && photo.url.trim() !== ''
  );

  return (
    <div className="space-y-8">
      {/* Header do Perfil do Talento */}
      <div className="p-6 md:p-8 bg-[#0F0F0F] border border-gold/30 shadow-2xl relative overflow-hidden rounded-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Foto Principal com Botão de Troca Rápida */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 border-2 border-gold/60 p-1 bg-black shrink-0 rounded-sm group cursor-pointer" onClick={() => openEditModal('basic')}>
              {Boolean(creator.avatarUrl && typeof creator.avatarUrl === 'string' && creator.avatarUrl.trim() !== '') ? (
                <div className="relative w-full h-full overflow-hidden">
                  {creator.avatarUrl.startsWith('data:') ? (
                    <img
                      src={creator.avatarUrl}
                      alt={creator.qualitative?.artisticName || 'Modelo'}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src={creator.avatarUrl}
                      alt={creator.qualitative?.artisticName || 'Modelo'}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  )}
                </div>
              ) : (
                <div className="w-full h-full bg-[#141414] border border-white/10 flex flex-col items-center justify-center text-gold font-serif-lumiardi font-bold text-2xl group-hover:border-gold transition-colors">
                  <span>{((creator.qualitative?.artisticName || 'MO').trim() || 'MO').substring(0, 2).toUpperCase()}</span>
                  <span className="text-[9px] font-sans font-normal text-gold/80 mt-0.5">+ Foto</span>
                </div>
              )}

              {/* Botão Hover de Troca de Foto */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal('basic');
                }}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] text-gold cursor-pointer transition-opacity font-sans"
                title="Trocar Foto de Perfil"
              >
                <Camera className="w-4 h-4 mb-0.5" />
                <span>Trocar Foto</span>
              </button>

              <span className="absolute -bottom-2 -right-2 p-1 bg-black border border-gold text-gold rounded-full">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <Badge variant="bronze">{creator.qualitative.category}</Badge>
                <span className="text-[10px] font-sans text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Curadoria Verificada
                </span>

                {/* Badge de Representação por Agência */}
                {creator.isRepresented ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-purple-500/40 bg-purple-950/40 text-purple-300 font-medium inline-flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    <span>{creator.representedAgencyName || 'Em Agência'}</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-white/20 bg-white/5 text-ivory/70 inline-flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-gold" />
                    <span>Independente</span>
                  </span>
                )}

                {/* Badge de Visibilidade e Recebimento de Ofertas no Scout */}
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border font-medium ${
                    creator.acceptsOffers !== false
                      ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                      : 'border-amber-500/40 bg-amber-950/40 text-amber-300'
                  }`}
                >
                  {creator.acceptsOffers !== false ? 'Scout: Aberta a Propostas' : 'Scout: Propostas Pausadas'}
                </span>
              </div>

              <h2 className="font-serif-lumiardi text-2xl md:text-4xl font-light text-ivory tracking-wide">
                {creator.qualitative.artisticName}
              </h2>

              <p className="text-xs md:text-sm text-ivory/60 font-sans mt-1 flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gold" />
                  {creator.basicInfo.address.city}, {creator.basicInfo.address.state} — {creator.basicInfo.address.country}
                </span>
                <span>•</span>
                <span className="text-gold font-medium">{creator.qualitative.platforms.instagram}</span>
              </p>
            </div>
          </div>

          {/* Ações Rápidas do Perfil */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => openEditModal('book')}
              className="px-4 py-2.5 bg-[#161616] hover:bg-[#222222] text-ivory border border-gold/40 text-xs font-sans uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm rounded-sm hover:border-gold"
            >
              <Upload className="w-3.5 h-3.5 text-gold" />
              <span>{t('book_manage_photos') || 'Gerenciar Fotos do Book'}</span>
            </button>

            <button
              onClick={() => openEditModal('basic')}
              className="px-4 py-2.5 bg-[#161616] hover:bg-[#222222] text-ivory border border-white/10 text-xs font-sans uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer rounded-sm hover:border-gold/40"
            >
              <Edit3 className="w-3.5 h-3.5 text-gold" />
              <span>{t('header_edit_profile') || 'Editar Perfil'}</span>
            </button>

            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                alert('Link confidencial do Book copiado com sucesso!');
              }}
              className="px-5 py-2.5 bg-gold hover:bg-gold-light text-black-matte text-xs font-sans font-semibold uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-md rounded-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{t('book_share_book') || 'Compartilhar Book'}</span>
            </button>
          </div>
        </div>

        {/* Sub-navegação interna do perfil */}
        <div className="flex gap-2 mt-8 pt-4 border-t border-white/10 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('book')}
            className={`px-4 py-2 text-xs font-sans uppercase tracking-widest font-medium transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'book'
                ? 'border-gold text-gold bg-gold/10 font-bold'
                : 'border-transparent text-ivory/60 hover:text-ivory'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-gold" />
            <span>{t('book_subtab_photos') || 'Fotos do Book'}</span>
          </button>
          <button
            onClick={() => setActiveSubTab('tech-sheet')}
            className={`px-4 py-2 text-xs font-sans uppercase tracking-widest font-medium transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'tech-sheet'
                ? 'border-gold text-gold bg-gold/10 font-bold'
                : 'border-transparent text-ivory/60 hover:text-ivory'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5 text-gold" />
            <span>{t('book_subtab_tech') || 'Ficha Técnica'}</span>
          </button>
          <button
            onClick={() => setActiveSubTab('limits')}
            className={`px-4 py-2 text-xs font-sans uppercase tracking-widest font-medium transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'limits'
                ? 'border-gold text-gold bg-gold/10 font-bold'
                : 'border-transparent text-ivory/60 hover:text-ivory'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-gold" />
            <span>{t('book_subtab_guidelines') || 'Diretrizes'}</span>
          </button>
        </div>
      </div>

      {/* Conteúdo da Aba 1: Book & Showreel */}
      {activeSubTab === 'book' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Showreel / Vídeo de Prévia */}
          <div className="p-6 bg-[#0B0B0B] border border-white/10 rounded-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-gold" />
                <h3 className="font-serif-lumiardi text-lg md:text-xl font-light text-ivory">
                  Showreel de Apresentação Oficial
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => openEditModal('video')}
                  className="px-3 py-1.5 bg-[#141414] hover:bg-gold hover:text-black-matte border border-gold/30 text-gold text-xs font-sans transition-colors flex items-center gap-1.5 rounded-sm cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{creator.videoUrl ? 'Alterar Vídeo Showreel' : 'Cadastrar Vídeo Showreel'}</span>
                </button>
              </div>
            </div>

            {creator.videoUrl && creator.videoUrl.trim() !== '' ? (
              <div className="relative w-full h-72 md:h-96 bg-black border border-bronze/30 overflow-hidden group rounded-sm">
                {isVideoPlaying ? (
                  <video
                    src={creator.videoUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <div className="relative w-full h-full bg-[#080808] flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    </div>

                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <button
                        onClick={() => setIsVideoPlaying(true)}
                        className="w-16 h-16 rounded-full bg-gold/90 text-black-matte flex items-center justify-center hover:scale-110 transition-transform shadow-2xl cursor-pointer"
                        aria-label="Assistir Showreel"
                      >
                        <Play className="w-7 h-7 fill-black-matte ml-1" />
                      </button>
                      <span className="text-xs font-sans uppercase tracking-widest text-ivory/80">
                        Clique para reproduzir showreel cadastrado
                      </span>
                    </div>
                  </>
                )}

                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs font-sans text-ivory/70">
                  <span>Showreel Oficial · Perfil Verificado</span>
                  <span>Áudio Estéreo Masterizado</span>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-[#080808] border border-dashed border-gold/30 rounded-sm text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold mx-auto">
                  <Play className="w-5 h-5 ml-0.5" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h4 className="font-serif-lumiardi text-lg font-light text-ivory">
                    Nenhum Vídeo Showreel Cadastrado
                  </h4>
                  <p className="text-xs text-ivory/50 font-sans leading-relaxed">
                    Adicione um vídeo de apresentação ou link MP4 para aumentar o interesse de agências parceiras na contratação do seu casting.
                  </p>
                </div>
                <button
                  onClick={() => openEditModal('video')}
                  className="px-4 py-2 bg-[#141414] hover:bg-gold hover:text-black-matte border border-gold/40 text-gold text-xs font-sans uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 rounded-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Vídeo Showreel</span>
                </button>
              </div>
            )}
          </div>

          {/* Grid de Fotos do Book Profissional */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-[0.25em] text-bronze font-semibold font-sans">
                  Galeria de Alta Resolução
                </span>
                <h3 className="font-serif-lumiardi text-2xl font-light text-ivory">
                  Book Editorial Padronizado
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => openEditModal('book')}
                  className="px-3.5 py-1.5 bg-gold/10 hover:bg-gold text-gold hover:text-black-matte border border-gold/40 text-xs font-sans font-medium transition-colors flex items-center gap-1.5 rounded-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Gerenciar Fotos do Book</span>
                </button>
                <span className="text-xs font-sans text-ivory/50">
                  {bookPhotos.length > 0 ? `Exibindo ${bookPhotos.length} foto(s) oficial(is)` : 'Nenhuma foto cadastrada'}
                </span>
              </div>
            </div>

            {bookPhotos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {bookPhotos.map((photo: any) => (
                  <div
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo.url)}
                    className="group relative h-80 bg-[#121212] border border-white/10 overflow-hidden cursor-pointer hover:border-gold/60 transition-all duration-300 shadow-lg rounded-sm"
                  >
                    {photo.url.startsWith('data:') ? (
                      <img
                        src={photo.url}
                        alt={photo.title || 'Foto do Book'}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <Image
                        src={photo.url}
                        alt={photo.title || 'Foto do Book'}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        unoptimized
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20 opacity-80 group-hover:opacity-95 transition-opacity" />

                    <div className="absolute top-3 right-3 p-1.5 bg-black/60 backdrop-blur-md text-ivory/80 group-hover:text-gold transition-colors rounded-xs">
                      <Maximize2 className="w-4 h-4" />
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <span className="text-[9px] uppercase tracking-widest text-gold font-sans font-semibold block mb-1">
                        {photo.tag || 'Ensaio Oficial'}
                      </span>
                      <h4 className="font-serif-lumiardi text-lg font-light text-ivory group-hover:text-gold transition-colors">
                        {photo.title || 'Ensaio'}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 bg-[#0B0B0B] border border-dashed border-gold/30 rounded-sm text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/40 flex items-center justify-center text-gold mx-auto">
                  <Camera className="w-7 h-7" />
                </div>
                <div className="max-w-md mx-auto space-y-1.5">
                  <h4 className="font-serif-lumiardi text-xl font-light text-ivory">
                    Seu Book Editorial está aguardando suas fotos
                  </h4>
                  <p className="text-xs text-ivory/50 font-sans leading-relaxed">
                    Adicione seus ensaios fotográficos profissionais em alta definição para compor seu portfólio oficial. Agências parceiras utilizam essas fotos para aprovar propostas de casting.
                  </p>
                </div>
                <button
                  onClick={() => openEditModal('book')}
                  className="px-5 py-2.5 bg-gold hover:bg-gold-light text-black-matte text-xs font-sans font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-2 rounded-sm cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Primeira Foto do Book</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 2: Ficha Técnica & Medidas */}
      {activeSubTab === 'tech-sheet' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-end">
            <button
              onClick={() => openEditModal('measurements')}
              className="px-4 py-2 bg-gold/10 hover:bg-gold text-gold hover:text-black-matte border border-gold/40 text-xs font-sans font-medium transition-colors flex items-center gap-2 rounded-sm cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Editar Medidas & Biometria</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Medidas Corporais */}
            <div className="bg-[#0F0F0F] border border-white/10 p-6 space-y-4 rounded-sm">
              <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                <Sliders className="w-4 h-4 text-gold" />
                <h4 className="font-serif-lumiardi text-lg font-medium text-ivory">
                  Medidas Corporais (Biometria)
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-sans">
                <div className="p-3 bg-[#151515] border border-white/5 rounded-xs">
                  <span className="text-ivory/40 block text-[10px] uppercase">Altura</span>
                  <span className="font-serif-lumiardi text-lg text-gold font-medium">
                    {creator.qualitative.measurements.height} cm
                  </span>
                </div>

                <div className="p-3 bg-[#151515] border border-white/5 rounded-xs">
                  <span className="text-ivory/40 block text-[10px] uppercase">Peso</span>
                  <span className="font-serif-lumiardi text-lg text-gold font-medium">
                    {creator.qualitative.measurements.weight} kg
                  </span>
                </div>

                <div className="p-3 bg-[#151515] border border-white/5 rounded-xs">
                  <span className="text-ivory/40 block text-[10px] uppercase">Cintura</span>
                  <span className="font-serif-lumiardi text-lg text-gold font-medium">
                    {creator.qualitative.measurements.waist} cm
                  </span>
                </div>

                <div className="p-3 bg-[#151515] border border-white/5 rounded-xs">
                  <span className="text-ivory/40 block text-[10px] uppercase">Busto</span>
                  <span className="font-serif-lumiardi text-lg text-gold font-medium">
                    {creator.qualitative.measurements.bust} cm
                  </span>
                </div>

                <div className="p-3 bg-[#151515] border border-white/5 col-span-2 rounded-xs">
                  <span className="text-ivory/40 block text-[10px] uppercase">Quadril</span>
                  <span className="font-serif-lumiardi text-lg text-gold font-medium">
                    {creator.qualitative.measurements.hips} cm
                  </span>
                </div>
              </div>
            </div>

            {/* Fisiognomia & Perfil Visual */}
            <div className="bg-[#0F0F0F] border border-white/10 p-6 space-y-4 rounded-sm">
              <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                <Eye className="w-4 h-4 text-gold" />
                <h4 className="font-serif-lumiardi text-lg font-medium text-ivory">
                  Fisiognomia & Idiomas
                </h4>
              </div>

              <div className="space-y-3 text-xs font-sans">
                <div className="p-3 bg-[#151515] border border-white/5 flex items-center justify-between rounded-xs">
                  <span className="text-ivory/50">Cor dos Olhos</span>
                  <span className="text-ivory font-medium">{creator.qualitative.physiognomy.eyeColor}</span>
                </div>

                <div className="p-3 bg-[#151515] border border-white/5 flex items-center justify-between rounded-xs">
                  <span className="text-ivory/50">Cor do Cabelo</span>
                  <span className="text-ivory font-medium">{creator.qualitative.physiognomy.hairColor}</span>
                </div>

                <div className="p-3 bg-[#151515] border border-white/5 flex items-center justify-between rounded-xs">
                  <span className="text-ivory/50">Tom de Pele</span>
                  <span className="text-ivory font-medium">{creator.qualitative.physiognomy.skinTone}</span>
                </div>

                <div className="p-3 bg-[#151515] border border-white/5 rounded-xs">
                  <span className="text-ivory/50 block mb-1">Idiomas Fluentes</span>
                  <div className="flex flex-wrap gap-1">
                    {creator.qualitative.languages.map((lang: string) => (
                      <span key={lang} className="px-2 py-0.5 bg-gold/15 text-gold text-[10px] font-medium border border-gold/30 rounded-xs">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Métricas Comerciais & Plataformas */}
            <div className="bg-[#0F0F0F] border border-white/10 p-6 space-y-4 rounded-sm">
              <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                <DollarSign className="w-4 h-4 text-gold" />
                <h4 className="font-serif-lumiardi text-lg font-medium text-ivory">
                  Métricas & Presença
                </h4>
              </div>

              <div className="space-y-3 text-xs font-sans">
                <div className="p-3 bg-[#151515] border border-white/5 rounded-xs">
                  <span className="text-ivory/40 block text-[10px] uppercase">Faturamento Mensal Estimado</span>
                  <span className="font-serif-lumiardi text-lg text-emerald-400 font-medium">
                    {creator.qualitative.monthlyRevenueEstimate}
                  </span>
                </div>

                <div className="p-3 bg-[#151515] border border-white/5 rounded-xs">
                  <span className="text-ivory/40 block text-[10px] uppercase">Taxa de Conversão</span>
                  <span className="font-serif-lumiardi text-lg text-gold font-medium">
                    {creator.qualitative.conversionRateEstimate}
                  </span>
                </div>

                <div className="p-3 bg-[#151515] border border-white/5 rounded-xs">
                  <span className="text-ivory/40 block text-[10px] uppercase mb-1">Plataformas Ativas</span>
                  <div className="flex items-center gap-2 flex-wrap text-[11px] text-ivory/80">
                    <span className="text-pink-400 font-medium">IG: {creator.qualitative.platforms.instagram}</span>
                    {creator.qualitative.platforms.onlyfans && (
                      <span className="text-sky-400 font-medium">OF: @{creator.qualitative.platforms.onlyfans}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 3: Diretrizes, Limites e Objetivos */}
      {activeSubTab === 'limits' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-end">
            <button
              onClick={() => openEditModal('limits')}
              className="px-4 py-2 bg-gold/10 hover:bg-gold text-gold hover:text-black-matte border border-gold/40 text-xs font-sans font-medium transition-colors flex items-center gap-2 rounded-sm cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Editar Diretrizes & Limites</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-[#0F0F0F] border border-white/10 space-y-4 rounded-sm">
              <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                <ShieldCheck className="w-4 h-4 text-gold" />
                <h4 className="font-serif-lumiardi text-lg font-medium text-ivory">
                  Limites Pessoais & Preservação de Imagem
                </h4>
              </div>
              <p className="text-xs text-ivory/70 font-sans leading-relaxed italic">
                &quot;{creator.qualitative.personalLimits}&quot;
              </p>
              <div className="pt-2">
                <span className="text-[10px] text-ivory/40 block uppercase">Posicionamento de Imagem</span>
                <p className="text-xs text-ivory/80 font-sans mt-0.5">
                  {creator.qualitative.exposureOpinion}
                </p>
              </div>
            </div>

            <div className="p-6 bg-[#0F0F0F] border border-white/10 space-y-4 rounded-sm">
              <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                <Target className="w-4 h-4 text-gold" />
                <h4 className="font-serif-lumiardi text-lg font-medium text-ivory">
                  Objetivo Principal com as Agências
                </h4>
              </div>
              <p className="text-xs text-ivory/70 font-sans leading-relaxed italic">
                &quot;{creator.qualitative.mainGoal}&quot;
              </p>
              <div className="pt-2">
                <span className="text-[10px] text-ivory/40 block uppercase">Disponibilidade de Casting</span>
                <div className="flex gap-2 mt-1">
                  {creator.qualitative.availability.map((av: string) => (
                    <span key={av} className="px-2.5 py-1 bg-gold/15 text-gold text-[10px] font-sans border border-gold/30 rounded-xs">
                      {av}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Zoom de Foto */}
      <AnimatePresence>
        {selectedPhoto && selectedPhoto.trim() !== '' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="relative max-w-4xl max-h-[90vh] w-full h-[80vh]">
              {selectedPhoto && typeof selectedPhoto === 'string' && selectedPhoto.trim() !== '' ? (
                selectedPhoto.startsWith('data:') ? (
                  <img
                    src={selectedPhoto}
                    alt="Book Zoom"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                ) : (
                  <Image
                    src={selectedPhoto}
                    alt="Book Zoom"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                )
              ) : null}
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 p-2 bg-black/80 text-ivory hover:text-gold transition-colors rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE EDIÇÃO DE PERFIL & BOOK */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={creator}
        onSaved={refreshData}
        defaultTab={editModalTab}
      />
    </div>
  );
};
