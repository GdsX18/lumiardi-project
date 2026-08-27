'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useAuthPortal } from '@/context/AuthPortalContext';
import { SharedDrivePanel } from '@/components/interactive/SharedDrivePanel';

export const AgencyRosterView: React.FC = () => {
  const router = useRouter();
  const { allCreators } = useAuthPortal();
  const [selectedModelDrive, setSelectedModelDrive] = useState<any | null>(null);

  const roster = allCreators.map((c, index) => ({
    id: c.id,
    name: c?.qualitative?.artisticName || c?.basicInfo?.fullName || 'Modelo Lumiardi',
    image: (c as any)?.avatarUrl || (c as any)?.photos?.[0]?.url || (index % 2 === 0 ? '/api/media/assets/images/creator_elena.jpg' : '/api/media/assets/images/creator_sophia.jpg'),
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
                    {model.image ? (
                      model.image.startsWith('data:') ? (
                        <img src={model.image} alt={model.name} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <Image
                          src={model.image}
                          alt={model.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      )
                    ) : (
                      <div className="w-full h-full bg-[#161616] flex items-center justify-center text-gold font-serif-lumiardi font-bold text-sm">
                        {model.name?.charAt(0) || 'M'}
                      </div>
                    )}
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
                onClick={() => router.push(`/dashboard/chat?user=${model.id}`)}
                className="flex-1 py-2 bg-[#151515] hover:bg-gold hover:text-black-matte text-ivory/80 border border-white/10 text-[11px] font-sans uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Mensagem</span>
              </button>

              <button
                type="button"
                onClick={() => router.push(`/dashboard/meet?room=${model.id}`)}
                className="p-2 bg-[#151515] hover:bg-white/10 text-ivory/60 hover:text-gold border border-white/10 transition-colors cursor-pointer"
                title="Lumiardi Meet"
              >
                <Video className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedModelDrive(model)}
                className="p-2 bg-[#151515] hover:bg-gold hover:text-black-matte text-ivory/60 transition-colors cursor-pointer border border-white/10"
                title={`Abrir Drive Compartilhado de ${model.name}`}
              >
                <HardDrive className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Modal do Drive Compartilhado com a Modelo */}
      {selectedModelDrive && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto"
          onClick={() => setSelectedModelDrive(null)}
        >
          <div
            className="w-full max-w-5xl bg-[#0D0D0D] border border-gold/40 shadow-2xl relative rounded-sm p-2 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#121212]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 border border-gold/40 bg-black relative shrink-0 overflow-hidden">
                  {selectedModelDrive.image ? (
                    selectedModelDrive.image.startsWith('data:') ? (
                      <img src={selectedModelDrive.image} alt={selectedModelDrive.name} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <Image src={selectedModelDrive.image} alt={selectedModelDrive.name} fill className="object-cover" unoptimized />
                    )
                  ) : (
                    <div className="w-full h-full bg-[#161616] flex items-center justify-center text-gold font-serif-lumiardi font-bold text-xs">
                      {selectedModelDrive.name?.charAt(0) || 'M'}
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-sans uppercase tracking-widest text-gold block">
                    Drive Compartilhado Modelo ↔ Agência
                  </span>
                  <h3 className="font-serif-lumiardi text-xl text-ivory font-medium">
                    {selectedModelDrive.name}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedModelDrive(null)}
                className="p-2 text-ivory/60 hover:text-gold cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 max-h-[80vh] overflow-y-auto">
              <SharedDrivePanel
                initialDriveMode="shared"
                targetModelId={selectedModelDrive.id}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
