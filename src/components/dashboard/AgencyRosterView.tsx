'use client';

import React from 'react';
import Image from 'next/image';
import {
  Users,
  DollarSign,
  Calendar,
  MessageSquare,
  Video,
  FileCheck,
  ShieldCheck,
  HardDrive,
  Plus,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useAuthPortal } from '@/context/AuthPortalContext';

export const AgencyRosterView: React.FC = () => {
  const { allCreators } = useAuthPortal();

  const roster = allCreators.map((c, index) => ({
    id: c.id,
    name: c?.qualitative?.artisticName || c?.basicInfo?.fullName || 'Modelo Lumiardi',
    image: (c as any)?.avatarUrl || (c as any)?.photos?.[0]?.url || (index % 2 === 0 ? '/images/creator_elena.jpg' : '/images/creator_sophia.jpg'),
    category: c?.qualitative?.category || 'Modelo Editorial',
    monthlyGross: c?.qualitative?.monthlyRevenueEstimate || 'Sob Consulta',
    agencyNet: 'Comissão 20%',
    contractType: 'Exclusividade 80/20',
    activeCampaigns: 0,
    status: 'Contrato Ativo',
    nextDeliverable: 'Próxima entrega sob demanda',
  }));

  return (
    <div className="space-y-8">
      {/* Banner de Gestão de Elenco */}
      <div className="p-6 md:p-8 bg-[#0F0F0F] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="gold">ELENCO DE TALENTOS</Badge>
            <span className="text-[10px] font-sans text-ivory/50 uppercase tracking-widest">
              {roster.length} Modelos Vinculadas
            </span>
          </div>
          <h2 className="font-serif-lumiardi text-3xl md:text-4xl font-light text-ivory">
            Gestão de Modelos Agenciadas
          </h2>
          <p className="text-xs md:text-sm font-sans text-ivory/60 mt-1 max-w-2xl">
            Acompanhe entregas de campanhas, cumprimento de prazos e contratos vigentes com suas criadoras agenciadas.
          </p>
        </div>

        <div className="p-4 bg-[#141414] border border-gold/30 flex items-center gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-ivory/40 block font-sans">
              Modelos Vinculadas
            </span>
            <span className="font-serif-lumiardi text-2xl md:text-3xl text-emerald-400 font-medium">
              {roster.length} Ativas
            </span>
            <span className="text-[10px] text-gold font-sans block">
              Repasses Automatizados
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Agenciadas */}
      {roster.length === 0 ? (
        <div className="p-12 bg-[#0E0E0E] border border-dashed border-white/15 text-center space-y-4 rounded-sm">
          <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/40 flex items-center justify-center text-gold mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="font-serif-lumiardi text-2xl font-light text-ivory">
              Nenhuma Modelo no Elenco
            </h3>
            <p className="text-xs text-ivory/50 font-sans leading-relaxed">
              Explore o catálogo de talentos aprovados pela curadoria no <strong>Scout de Modelos</strong> e envie propostas contratuais para compor seu elenco exclusivo.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roster.map((model) => (
          <div
            key={model.id}
            className="bg-[#0E0E0E] border border-white/10 hover:border-gold/50 transition-all duration-300 p-6 space-y-6 shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 border border-gold/40 bg-black shrink-0 overflow-hidden">
                    <Image
                      src={model.image}
                      alt={model.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-serif-lumiardi text-xl font-medium text-ivory">
                      {model.name}
                    </h3>
                    <span className="text-[10px] font-sans text-ivory/50 uppercase tracking-widest block">
                      {model.category}
                    </span>
                  </div>
                </div>

                <Badge variant="gold">{model.status}</Badge>
              </div>

              {/* Dados Financeiros e Contratuais */}
              <div className="space-y-3 pt-4 text-xs font-sans">
                <div className="flex items-center justify-between">
                  <span className="text-ivory/50 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-gold" /> Faturamento Estimado:
                  </span>
                  <span className="font-serif-lumiardi text-sm text-ivory font-medium">
                    {model.monthlyGross}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-ivory/50 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Repasse Agência:
                  </span>
                  <span className="text-emerald-400 font-medium">{model.agencyNet}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-ivory/50 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-bronze" /> Contrato:
                  </span>
                  <span className="text-ivory/80 text-[11px] truncate max-w-[150px]">
                    {model.contractType}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-ivory/50 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-ivory/50" /> Próxima Produção:
                  </span>
                  <span className="text-gold text-[11px] truncate max-w-[140px]">
                    {model.nextDeliverable}
                  </span>
                </div>
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="pt-4 border-t border-white/10 flex items-center gap-2">
              <button
                type="button"
                className="flex-1 py-2 bg-[#151515] hover:bg-gold hover:text-black-matte text-ivory/80 border border-white/10 text-[11px] font-sans uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Mensagem</span>
              </button>

              <button
                type="button"
                className="p-2 bg-[#151515] hover:bg-white/10 text-ivory/60 hover:text-gold border border-white/10 transition-colors cursor-pointer"
                title="Lumiardi Meet"
              >
                <Video className="w-4 h-4" />
              </button>

              <button
                type="button"
                className="p-2 bg-[#151515] hover:bg-white/10 text-ivory/60 hover:text-gold border border-white/10 transition-colors cursor-pointer"
                title="Drive Compartilhado"
              >
                <HardDrive className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
};
