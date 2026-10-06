'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Users,
  DollarSign,
  MessageSquare,
  Video,
  FileCheck,
  ShieldCheck,
  HardDrive,
  RefreshCw,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useLanguage } from '@/context/LanguageContext';
import { SharedDrivePanel } from '@/components/interactive/SharedDrivePanel';

/** Linha de GET /api/agencies/roster: contrato real + dados públicos da modelo. */
interface RosterEntry {
  contract: { id: string; status: 'active' | 'pending' | 'terminated'; commissionRate: string; startDate: string };
  model: { id: string; name: string; avatarUrl: string; category: string; monthlyRevenueEstimate: string };
  conversationId: string;
}

interface RosterCard {
  id: string;
  name: string;
  image: string;
  category: string;
  monthlyGross: string;
  agencyNet: string;
  contractSince: string;
  status: string;
  conversationId: string;
}

export const AgencyRosterView: React.FC = () => {
  const router = useRouter();
  const { t, formatDate } = useLanguage();
  const [selectedModelDrive, setSelectedModelDrive] = useState<RosterCard | null>(null);
  const [entries, setEntries] = useState<RosterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Somente contratos reais de agency_model_contracts (não o catálogo inteiro)
  const loadRoster = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetch('/api/agencies/roster', { cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setEntries(Array.isArray(data.roster) ? data.roster : []);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  const notInformed = t('dsh_cp_not_informed');
  const roster: RosterCard[] = entries.map(({ contract, model, conversationId }) => ({
    id: model.id,
    name: model.name || t('dsh_ro_model_fallback'),
    // Sem foto real, exibe a inicial do nome (sem imagens de banco de demonstração)
    image: model.avatarUrl || '',
    category: model.category || notInformed,
    monthlyGross: model.monthlyRevenueEstimate || notInformed,
    agencyNet: t('dsh_ro_commission').replace('{pct}', contract.commissionRate || notInformed),
    contractSince: contract.startDate
      ? t('dsh_ro_since').replace('{date}', formatDate(contract.startDate))
      : notInformed,
    status: contract.status === 'active' ? t('dsh_ro_contract_active') : t('dsh_ro_contract_pending'),
    conversationId,
  }));

  return (
    <div className="space-y-8">
      {/* Banner de Gestão de Elenco */}
      <div className="p-6 md:p-8 bg-[#0F0F0F] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="gold">{t('agency_tab_roster')}</Badge>
            <span className="text-[10px] font-sans text-ivory/50 uppercase tracking-widest">
              {roster.length} {t('agency_models_count')}
            </span>
          </div>
          <h2 className="font-serif-lumiardi text-3xl md:text-4xl font-light text-ivory">
            {t('dash_page_book_title_agency')}
          </h2>
          <p className="text-xs md:text-sm font-sans text-ivory/60 mt-1 max-w-2xl">
            {t('dash_page_book_sub_agency')}
          </p>
        </div>

        <div className="p-4 bg-[#141414] border border-gold/30 flex items-center gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-ivory/40 block font-sans">
              {t('agency_tab_roster')}
            </span>
            <span className="font-serif-lumiardi text-2xl md:text-3xl text-emerald-400 font-medium">
              {roster.length} {t('header_verified')}
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Agenciadas */}
      {loading ? (
        <div className="p-12 text-center text-xs font-sans text-ivory/40 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-gold" />
          <span>{t('dsh_ad_syncing')}</span>
        </div>
      ) : loadError ? (
        <div className="p-10 bg-[#0E0E0E] border border-red-500/30 text-center space-y-3 rounded-sm">
          <p className="text-sm font-sans text-red-300">{t('dsh_ad_sync_failed')}</p>
          <button
            type="button"
            onClick={loadRoster}
            className="px-4 py-2 bg-gold/10 hover:bg-gold text-gold hover:text-black-matte border border-gold/40 text-xs font-sans uppercase tracking-wider font-semibold transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('dsh_ad_retry')}</span>
          </button>
        </div>
      ) : roster.length === 0 ? (
        <div className="p-12 bg-[#0E0E0E] border border-dashed border-white/15 text-center space-y-4 rounded-sm">
          <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/40 flex items-center justify-center text-gold mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="font-serif-lumiardi text-2xl font-light text-ivory">
              {t('dsh_ro_empty_title')}
            </h3>
            <p className="text-xs text-ivory/50 font-sans leading-relaxed">
              {t('dsh_ro_empty_a')} <strong>{t('dsh_ro_empty_scout')}</strong> {t('dsh_ro_empty_b')}
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
                    <DollarSign className="w-3.5 h-3.5 text-gold" /> {t('dsh_ro_est_revenue')}
                  </span>
                  <span className="font-serif-lumiardi text-sm text-ivory font-medium">
                    {model.monthlyGross}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-ivory/50 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> {t('dsh_ro_agency_share')}
                  </span>
                  <span className="text-emerald-400 font-medium">{model.agencyNet}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-ivory/50 flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-bronze" /> {t('dsh_ro_contract')}
                  </span>
                  <span className="text-ivory/80 text-[11px] truncate max-w-[150px]">
                    {model.contractSince}
                  </span>
                </div>

              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="pt-4 border-t border-white/10 flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push(`/dashboard/chat?conversationId=${encodeURIComponent(model.conversationId)}`)}
                className="flex-1 py-2 bg-[#151515] hover:bg-gold hover:text-black-matte text-ivory/80 border border-white/10 text-[11px] font-sans uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{t('dsh_ro_message')}</span>
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
                title={t('dsh_ro_open_shared_drive').replace('{name}', model.name)}
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
                    {t('dsh_ro_shared_drive_label')}
                  </span>
                  <h3 className="font-serif-lumiardi text-xl text-ivory font-medium">
                    {selectedModelDrive.name}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedModelDrive(null)}
                className="p-2 text-ivory/60 hover:text-gold cursor-pointer transition-colors"
                aria-label={t('dsh_ts_close')}
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
