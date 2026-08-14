'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  ShieldCheck,
  Send,
  Sparkles,
  Percent,
  MapPin,
  CheckCircle2,
  Clock,
  FileText,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuthPortal } from '@/context/AuthPortalContext';
import { Badge } from '@/components/ui/Badge';

export const AgencyDirectoryView: React.FC = () => {
  const { allAgencies } = useAuthPortal();
  const [selectedAgency, setSelectedAgency] = useState<any | null>(null);
  const [proposalSent, setProposalSent] = useState<string | null>(null);
  const [customPitch, setCustomPitch] = useState('');

  // Agências parceiras verificadas
  const agencies = [
    {
      id: 'agency-aura',
      name: 'Aura Management',
      image: '/images/agency_aura.jpg',
      commission: '20%',
      location: 'São Paulo, Brasil',
      specialty: 'Gestão de Imagem & Editorial',
      rating: '5.0 ★★★★★',
      verified: true,
      description:
        'Agência de gestão de talentos focada em campanhas nacionais e internacionais de alto padrão.',
      contractStatus: 'Disponível para Candidatura',
    },
    {
      id: 'agency-vanguard',
      name: 'Vanguard Talent Co.',
      image: '/images/agency_vanguard.jpg',
      commission: '30%',
      location: 'Miami & Milão',
      specialty: 'Monetização Internacional',
      rating: '4.9 ★★★★★',
      verified: true,
      description:
        'Representação executiva para os mercados americano e europeu com suporte jurídico e assessoria contratual.',
      contractStatus: 'Disponível para Candidatura',
    },
    {
      id: 'agency-sovereign',
      name: 'Sovereign Elite Network',
      image: '/images/hero_visual.jpg',
      commission: '15%',
      location: 'Paris & Londres',
      specialty: 'Campanhas de Alta Costura',
      rating: '4.8 ★★★★★',
      verified: true,
      description:
        'Rede de casting de luxo especializada em produções autorais e conexões com marcas premium.',
      contractStatus: 'Disponível para Candidatura',
    },
  ];

  const handleApply = (agency: any) => {
    setSelectedAgency(agency);
  };

  const handleConfirmApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgency) return;
    setProposalSent(selectedAgency.id);
    setSelectedAgency(null);
    setCustomPitch('');
  };

  return (
    <div className="space-y-8">
      {/* Top Banner do Catálogo de Agências */}
      <div className="p-6 md:p-8 bg-[#0F0F0F] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="gold">REDE VERIFICADA</Badge>
            <span className="text-[10px] font-sans text-ivory/50 uppercase tracking-widest">
              Apenas Agências Auditadas com Compliance Ativo
            </span>
          </div>
          <h2 className="font-serif-lumiardi text-2xl md:text-4xl font-light text-ivory">
            Agências de Gestão Parceiras
          </h2>
          <p className="text-xs md:text-sm font-sans text-ivory/60 mt-1 max-w-2xl">
            Explore agências parceiras, analise percentuais de comissão e envie seu portfólio diretamente para diretores de casting com um clique.
          </p>
        </div>

        <div className="p-3 bg-[#161616] border border-gold/30 text-xs font-sans text-gold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-gold shrink-0" />
          <span>Contratos Blindados pela Plataforma Lumiardi</span>
        </div>
      </div>

      {proposalSent && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-sans flex items-center justify-between animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Candidatura e Portfólio enviados com sucesso para a diretoria da agência! Eles entrarão em contato via Chat Criptografado.
          </span>
          <button
            onClick={() => setProposalSent(null)}
            className="text-emerald-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Grid de Agências */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agencies.map((agency) => (
          <div
            key={agency.id}
            className="bg-[#0E0E0E] border border-white/10 hover:border-gold/50 transition-all duration-300 flex flex-col justify-between p-6 space-y-6 group shadow-lg"
          >
            <div>
              {/* Header do Card */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="relative w-14 h-14 border border-gold/40 bg-black shrink-0 overflow-hidden">
                  <Image
                    src={agency.image}
                    alt={agency.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-sans text-ivory/40 block">
                    Taxa Agência
                  </span>
                  <span className="font-serif-lumiardi text-2xl text-gold font-medium">
                    {agency.commission}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-serif-lumiardi text-xl font-medium text-ivory group-hover:text-gold transition-colors">
                    {agency.name}
                  </h3>
                  <ShieldCheck className="w-4 h-4 text-gold shrink-0" />
                </div>

                <p className="text-xs text-ivory/50 font-sans flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-bronze" />
                  <span>{agency.location}</span>
                </p>

                <p className="text-xs font-sans text-ivory/70 leading-relaxed pt-2">
                  {agency.description}
                </p>
              </div>

              {/* Tags de Especialidade */}
              <div className="mt-4 pt-3 border-t border-white/5 space-y-2 text-[11px] font-sans">
                <div className="flex items-center justify-between text-ivory/60">
                  <span>Especialidade:</span>
                  <span className="text-ivory font-medium text-right">{agency.specialty}</span>
                </div>
                <div className="flex items-center justify-between text-ivory/60">
                  <span>Compliance:</span>
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Auditado Lumiardi
                  </span>
                </div>
              </div>
            </div>

            {/* Ação de Candidatura */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
              <span className="text-[10px] font-sans text-emerald-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {agency.contractStatus}
              </span>

              <button
                onClick={() => handleApply(agency)}
                className="px-4 py-2 bg-gold hover:bg-gold-light text-black-matte text-xs font-sans font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>Candidatar</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Envio de Portfólio / Candidatura */}
      <AnimatePresence>
        {selectedAgency && (
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
              className="bg-[#0F0F0F] border border-gold/40 p-6 md:p-8 max-w-lg w-full text-ivory shadow-2xl space-y-6 relative"
            >
              <button
                onClick={() => setSelectedAgency(null)}
                className="absolute top-4 right-4 text-ivory/60 hover:text-gold cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-gold font-sans font-semibold">
                  Candidatura Direta de Modelo
                </span>
                <h3 className="font-serif-lumiardi text-2xl font-light text-ivory mt-1">
                  Enviar Portfólio para {selectedAgency.name}
                </h3>
                <p className="text-xs text-ivory/60 font-sans mt-1">
                  Seu Book fotográfico em alta resolução e a ficha técnica completa serão transmitidos com criptografia.
                </p>
              </div>

              <form onSubmit={handleConfirmApplication} className="space-y-4">
                <div>
                  <label className="block text-xs font-sans text-ivory/80 uppercase tracking-wider mb-2">
                    Mensagem de Apresentação / Pitch Pessoal
                  </label>
                  <textarea
                    rows={4}
                    value={customPitch}
                    onChange={(e) => setCustomPitch(e.target.value)}
                    placeholder="Ex: Olá equipe Aura, tenho interesse em trabalhar com campanhas internacionais focadas no mercado europeu..."
                    className="w-full bg-[#181818] border border-white/10 p-3 text-xs text-ivory focus:outline-none focus:border-gold font-sans"
                    required
                  />
                </div>

                <div className="p-3 bg-[#141414] border border-white/5 text-[11px] font-sans text-ivory/70 space-y-1">
                  <div className="flex items-center gap-1.5 text-gold font-medium">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Itens incluídos no envio:</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5 text-ivory/50 text-[10px]">
                    <li>Book com 3 ensaios oficiais em alta resolução</li>
                    <li>Showreel de vídeo (45s em 4K)</li>
                    <li>Ficha técnica com biometria e medidas corporais</li>
                    <li>Métricas de conversão e histórico de faturamento</li>
                  </ul>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedAgency(null)}
                    className="px-4 py-2.5 text-xs uppercase font-sans text-ivory/60 hover:text-ivory cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gold hover:bg-gold-light text-black-matte font-semibold text-xs font-sans uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Transmitir Candidatura</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
