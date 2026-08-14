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
  Sparkles,
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
import { CompleteCreatorProfile } from '@/types';
import { Badge } from '@/components/ui/Badge';

export const TalentScoutView: React.FC = () => {
  const { allCreators } = useAuthPortal();

  // Modelos expandidas para demonstrar a robustez do Talent Scout
  const defaultCreators: CompleteCreatorProfile[] = [
    {
      id: 'creator-elena-vance',
      basicInfo: {
        fullName: 'Elena Vance',
        cpf: '***.***.***-**',
        birthDate: '1998-04-12',
        email: 'elena.vance@lumiardi.exclusive',
        address: {
          country: 'Brasil',
          state: 'RJ',
          city: 'Rio de Janeiro',
        },
        document: {
          documentType: 'passaporte',
          fileName: 'passaporte_elena.pdf',
          uploadedAt: new Date().toISOString(),
          verifiedStatus: 'verified',
        },
        createdAt: new Date().toISOString(),
      },
      qualitative: {
        artisticName: 'Elena Vance',
        category: 'Criadora de conteúdo +18',
        gender: 'Feminino Cisgênero',
        hobbies: 'Fotografia editorial, pilates e viagens de luxo',
        platforms: {
          instagram: '@elena.vance',
          privacy: 'elena_vance',
          onlyfans: 'elenavance_vip',
        },
        monthlyRevenueEstimate: 'R$ 80.000 - R$ 150.000',
        conversionRateEstimate: '14.5%',
        availability: ['Tarde', 'Noite'],
        hasChildren: false,
        languages: ['Português', 'Inglês', 'Espanhol'],
        exposureOpinion: 'Posicionamento artístico de alto padrão e bom gosto.',
        personalLimits: 'Não trabalho com conteúdos explícitos sem curadoria.',
        mainGoal: 'Internacionalizar a marca pessoal com agência de topo.',
        measurements: {
          height: '172',
          weight: '58',
          waist: '64',
          bust: '90',
          hips: '96',
        },
        physiognomy: {
          hairColor: 'Castanho Claro',
          eyeColor: 'Verdes',
          skinTone: 'Clara',
        },
      },
      curationStatus: 'approved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'creator-sophia-m',
      basicInfo: {
        fullName: 'Sophia Marchetti',
        cpf: '***.***.***-**',
        birthDate: '1996-09-22',
        email: 'sophia.m@lumiardi.exclusive',
        address: {
          country: 'Itália',
          state: 'Lombardia',
          city: 'Milão',
        },
        document: {
          documentType: 'passaporte',
          fileName: 'id_sophia.pdf',
          uploadedAt: new Date().toISOString(),
          verifiedStatus: 'verified',
        },
        createdAt: new Date().toISOString(),
      },
      qualitative: {
        artisticName: 'SOPHIA M.',
        category: 'Criadora de conteúdo +18',
        gender: 'Feminino Cisgênero',
        hobbies: 'Moda de luxo, arte contemporânea, gastronomia',
        platforms: {
          instagram: '@sophiam_official',
          onlyfans: 'sophiam_icon',
        },
        monthlyRevenueEstimate: 'R$ 150.000+',
        conversionRateEstimate: '18.2%',
        availability: ['Manhã', 'Tarde'],
        hasChildren: false,
        languages: ['Italiano', 'Inglês', 'Francês', 'Espanhol'],
        exposureOpinion: 'Preservação de imagem com ensaios cinematográficos.',
        personalLimits: 'Contratos estritos de confidencialidade apenas.',
        mainGoal: 'Expandir presença nos mercados de Paris e Milão.',
        measurements: {
          height: '176',
          weight: '56',
          waist: '60',
          bust: '88',
          hips: '92',
        },
        physiognomy: {
          hairColor: 'Loiro',
          eyeColor: 'Azuis',
          skinTone: 'Clara',
        },
      },
      curationStatus: 'approved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'creator-valentina-r',
      basicInfo: {
        fullName: 'Valentina Rossi',
        cpf: '***.***.***-**',
        birthDate: '1999-01-15',
        email: 'valentina.r@lumiardi.exclusive',
        address: {
          country: 'Brasil',
          state: 'SP',
          city: 'São Paulo',
        },
        document: {
          documentType: 'rg_cnh',
          fileName: 'cnh_valentina.pdf',
          uploadedAt: new Date().toISOString(),
          verifiedStatus: 'verified',
        },
        createdAt: new Date().toISOString(),
      },
      qualitative: {
        artisticName: 'Valentina Rossi',
        category: 'Criadora e acompanhante',
        gender: 'Feminino Cisgênero',
        hobbies: 'Alta gastronomia, hipismo, produção de vídeo',
        platforms: {
          instagram: '@valentinarossi_vip',
          onlyfans: 'valentinarossi',
        },
        monthlyRevenueEstimate: 'R$ 120.000 - R$ 200.000',
        conversionRateEstimate: '16.8%',
        availability: ['Noite', 'Madrugada', 'Total'],
        hasChildren: false,
        languages: ['Português', 'Inglês'],
        exposureOpinion: 'Discrição total com eventos privados.',
        personalLimits: 'Preservação de familiares e contratos jurídicos exclusivos.',
        mainGoal: 'Consolidar carreira em São Paulo e Miami com agência de topo.',
        measurements: {
          height: '168',
          weight: '54',
          waist: '62',
          bust: '92',
          hips: '94',
        },
        physiognomy: {
          hairColor: 'Morena Escuro',
          eyeColor: 'Castanhos',
          skinTone: 'Morena Clara',
        },
      },
      curationStatus: 'approved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const pool = allCreators.length >= 3 ? allCreators : defaultCreators;

  // Estados dos Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedHair, setSelectedHair] = useState<string>('all');
  const [selectedEyes, setSelectedEyes] = useState<string>('all');
  const [minHeight, setMinHeight] = useState<number>(150);
  const [selectedAvailability, setSelectedAvailability] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal de Detalhes do Talento
  const [selectedTalent, setSelectedTalent] = useState<CompleteCreatorProfile | null>(null);
  const [proposalSentSuccess, setProposalSentSuccess] = useState<string | null>(null);

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

  const handleSendProposal = (talent: CompleteCreatorProfile) => {
    setProposalSentSuccess(talent.qualitative.artisticName);
    setTimeout(() => setProposalSentSuccess(null), 4000);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner de Busca Estilo LinkedIn de Elite */}
      <div className="p-6 md:p-8 bg-[#0F0F0F] border border-white/10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="gold">TALENT SCOUT ELITE</Badge>
            <span className="text-[10px] font-sans text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Apenas Modelos Aprovadas pela Curadoria
            </span>
          </div>
          <h2 className="font-serif-lumiardi text-3xl md:text-4xl font-light text-ivory">
            Busca Avançada de Modelos & Criadoras
          </h2>
          <p className="text-xs md:text-sm font-sans text-ivory/60 mt-1 max-w-2xl">
            Filtre talentos com base em dados verificados da pré-entrevista (biometria, faturamento histórico, fisiognomia e objetivos de carreira).
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
            Grid Visual
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-2 text-xs font-sans uppercase tracking-wider transition-colors cursor-pointer border ${
              viewMode === 'table'
                ? 'bg-gold text-black-matte border-gold font-semibold'
                : 'bg-[#151515] text-ivory/60 border-white/10 hover:text-ivory'
            }`}
          >
            Tabela Executiva
          </button>
        </div>
      </div>

      {proposalSentSuccess && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs font-sans flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Proposta de agenciamento e convite de casting transmitidos com sucesso para <strong>{proposalSentSuccess}</strong>! O chat criptografado foi inicializado.
          </span>
        </div>
      )}

      {/* Painel de Filtros Avançados (LinkedIn de Elite) */}
      <div className="p-5 md:p-6 bg-[#0E0E0E] border border-gold/30 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-gold font-sans text-xs uppercase tracking-widest font-semibold">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filtros Indexados da Pré-Entrevista</span>
          </div>
          <button
            onClick={handleResetFilters}
            className="text-[11px] font-sans text-ivory/50 hover:text-gold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Limpar Filtros
          </button>
        </div>

        {/* Inputs de Filtro */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Busca por Palavra-chave */}
          <div className="space-y-1">
            <label className="block text-[10px] uppercase tracking-wider text-ivory/50 font-sans">
              Nome ou Cidade
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ivory/40" />
              <input
                type="text"
                placeholder="Ex: Elena, Milão, Rio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-[#161616] border border-white/10 text-xs text-ivory focus:outline-none focus:border-gold font-sans"
              />
            </div>
          </div>

          {/* Categoria */}
          <div className="space-y-1">
            <label className="block text-[10px] uppercase tracking-wider text-ivory/50 font-sans">
              Categoria
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-[#161616] border border-white/10 text-xs text-ivory focus:outline-none focus:border-gold font-sans cursor-pointer"
            >
              <option value="all">Todas as Categorias</option>
              <option value="Criadora de conteúdo +18">Criadora +18</option>
              <option value="Criadora e acompanhante">Criadora e Acompanhante</option>
              <option value="Acompanhante">Acompanhante</option>
            </select>
          </div>

          {/* Cabelo */}
          <div className="space-y-1">
            <label className="block text-[10px] uppercase tracking-wider text-ivory/50 font-sans">
              Cor de Cabelo
            </label>
            <select
              value={selectedHair}
              onChange={(e) => setSelectedHair(e.target.value)}
              className="w-full px-3 py-2 bg-[#161616] border border-white/10 text-xs text-ivory focus:outline-none focus:border-gold font-sans cursor-pointer"
            >
              <option value="all">Qualquer Cabelo</option>
              <option value="Castanho">Castanho</option>
              <option value="Loiro">Loiro</option>
              <option value="Morena">Morena</option>
              <option value="Ruiva">Ruiva</option>
            </select>
          </div>

          {/* Olhos */}
          <div className="space-y-1">
            <label className="block text-[10px] uppercase tracking-wider text-ivory/50 font-sans">
              Cor dos Olhos
            </label>
            <select
              value={selectedEyes}
              onChange={(e) => setSelectedEyes(e.target.value)}
              className="w-full px-3 py-2 bg-[#161616] border border-white/10 text-xs text-ivory focus:outline-none focus:border-gold font-sans cursor-pointer"
            >
              <option value="all">Qualquer Olhos</option>
              <option value="Verdes">Verdes</option>
              <option value="Azuis">Azuis</option>
              <option value="Castanhos">Castanhos</option>
            </select>
          </div>

          {/* Altura Mínima */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-ivory/50 font-sans">
              <span>Altura Mínima</span>
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
          <span>{filteredCreators.length} modelos de elite encontradas</span>
          <span className="text-gold">Sincronizado com a base de curadoria Lumiardi</span>
        </div>
      </div>

      {/* Exibição em Grid */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCreators.map((creator) => (
            <div
              key={creator.id}
              className="bg-[#0E0E0E] border border-white/10 hover:border-gold/60 transition-all duration-300 flex flex-col justify-between overflow-hidden group shadow-xl"
            >
              {/* Imagem do Book com Badges */}
              <div className="relative h-72 bg-black overflow-hidden">
                <Image
                  src={
                    creator.id === 'creator-sophia-m'
                      ? '/images/creator_sophia.jpg'
                      : '/images/creator_elena.jpg'
                  }
                  alt={creator.qualitative.artisticName}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge variant="gold">TOP 0.1%</Badge>
                  <span className="px-2 py-0.5 bg-black/70 backdrop-blur-md text-emerald-400 text-[9px] font-sans uppercase tracking-widest font-semibold border border-emerald-500/30">
                    Aprovada ✓
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
                    <span className="text-[9px] uppercase text-ivory/40 block">Altura</span>
                    <span className="text-gold font-medium">
                      {creator.qualitative.measurements.height} cm
                    </span>
                  </div>
                  <div className="p-2 bg-[#151515] border border-white/5">
                    <span className="text-[9px] uppercase text-ivory/40 block">Faturamento</span>
                    <span className="text-emerald-400 font-medium truncate block text-[11px]">
                      {creator.qualitative.monthlyRevenueEstimate.split(' ')[0]}
                    </span>
                  </div>
                  <div className="p-2 bg-[#151515] border border-white/5">
                    <span className="text-[9px] uppercase text-ivory/40 block">Cabelo</span>
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
                    <span>Ver Book</span>
                  </button>

                  <button
                    onClick={() => handleSendProposal(creator)}
                    className="flex-1 px-3 py-2 bg-gold hover:bg-gold-light text-black-matte text-xs font-sans font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Proposta</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Exibição em Tabela Executiva */}
      {viewMode === 'table' && (
        <div className="bg-[#0E0E0E] border border-white/10 overflow-x-auto shadow-2xl">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-[#141414] border-b border-white/10 text-ivory/50 uppercase tracking-widest text-[10px]">
                <th className="p-4">Modelo / Talento</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Localização</th>
                <th className="p-4">Biometria</th>
                <th className="p-4">Fisiognomia</th>
                <th className="p-4">Fat. Mensal Estimado</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCreators.map((creator) => (
                <tr key={creator.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 border border-gold/40 relative bg-black shrink-0 overflow-hidden">
                        <Image
                          src={
                            creator.id === 'creator-sophia-m'
                              ? '/images/creator_sophia.jpg'
                              : '/images/creator_elena.jpg'
                          }
                          alt={creator.qualitative.artisticName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <span className="font-serif-lumiardi text-base text-ivory font-medium block">
                          {creator.qualitative.artisticName}
                        </span>
                        <span className="text-[10px] text-gold">{creator.qualitative.platforms.instagram}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-ivory/70">{creator.qualitative.category}</td>
                  <td className="p-4 text-ivory/70">
                    {creator.basicInfo.address.city}, {creator.basicInfo.address.country}
                  </td>
                  <td className="p-4 text-ivory/80">
                    {creator.qualitative.measurements.height}cm · {creator.qualitative.measurements.weight}kg · {creator.qualitative.measurements.waist}/{creator.qualitative.measurements.bust}/{creator.qualitative.measurements.hips}
                  </td>
                  <td className="p-4 text-ivory/70">
                    {creator.qualitative.physiognomy.hairColor} · Olhos {creator.qualitative.physiognomy.eyeColor}
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
                        onClick={() => handleSendProposal(creator)}
                        className="px-3 py-1.5 bg-gold hover:bg-gold-light text-black-matte text-[10px] uppercase font-sans font-semibold transition-colors cursor-pointer"
                      >
                        Contratar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
                  <Image
                    src={
                      selectedTalent.id === 'creator-sophia-m'
                        ? '/images/creator_sophia.jpg'
                        : '/images/creator_elena.jpg'
                    }
                    alt={selectedTalent.qualitative.artisticName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="gold">APROVADA</Badge>
                    <span className="text-[10px] text-emerald-400 font-sans">Documentos Verificados ✓</span>
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
                  <span className="text-ivory/40 block text-[10px] uppercase">Altura</span>
                  <span className="font-serif-lumiardi text-base text-gold">
                    {selectedTalent.qualitative.measurements.height} cm
                  </span>
                </div>
                <div className="p-3 bg-[#151515] border border-white/5">
                  <span className="text-ivory/40 block text-[10px] uppercase">Busto/Cintura/Quadril</span>
                  <span className="font-serif-lumiardi text-base text-gold">
                    {selectedTalent.qualitative.measurements.bust}/{selectedTalent.qualitative.measurements.waist}/{selectedTalent.qualitative.measurements.hips}
                  </span>
                </div>
                <div className="p-3 bg-[#151515] border border-white/5">
                  <span className="text-ivory/40 block text-[10px] uppercase">Fisiognomia</span>
                  <span className="text-ivory font-medium text-[11px]">
                    {selectedTalent.qualitative.physiognomy.hairColor} / {selectedTalent.qualitative.physiognomy.eyeColor}
                  </span>
                </div>
                <div className="p-3 bg-[#151515] border border-white/5">
                  <span className="text-ivory/40 block text-[10px] uppercase">Fat. Médio</span>
                  <span className="text-emerald-400 font-medium text-[11px]">
                    {selectedTalent.qualitative.monthlyRevenueEstimate}
                  </span>
                </div>
              </div>

              {/* Limites e Objetivos */}
              <div className="space-y-3 text-xs font-sans">
                <div className="p-3.5 bg-[#141414] border border-white/5">
                  <span className="text-bronze font-semibold uppercase tracking-wider text-[10px] block mb-1">
                    Objetivo Declarado na Pré-Entrevista:
                  </span>
                  <p className="text-ivory/80">&quot;{selectedTalent.qualitative.mainGoal}&quot;</p>
                </div>

                <div className="p-3.5 bg-[#141414] border border-white/5">
                  <span className="text-bronze font-semibold uppercase tracking-wider text-[10px] block mb-1">
                    Limites Pessoais de Conteúdo:
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
                  Fechar
                </button>
                <button
                  onClick={() => {
                    handleSendProposal(selectedTalent);
                    setSelectedTalent(null);
                  }}
                  className="px-6 py-2.5 bg-gold hover:bg-gold-light text-black-matte font-semibold text-xs font-sans uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Proposta de Agenciamento</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
