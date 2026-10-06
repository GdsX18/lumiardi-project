'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  ShieldCheck,
  Send,
  Percent,
  MapPin,
  CheckCircle2,
  Clock,
  FileText,
  X,
  RefreshCw,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { Badge } from '@/components/ui/Badge';

export const AgencyDirectoryView: React.FC = () => {
  const { t, tApiError } = useLanguage();
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<any | null>(null);
  const [proposalSent, setProposalSent] = useState<string | null>(null);
  const [customPitch, setCustomPitch] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const fetchAgencies = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(false);
      const res = await fetch('/api/agencies');
      if (res.ok) {
        const data = await res.json();
        if (data.agencies) {
          // Normaliza formato para exibição — sem valores mockados
          const formatted = data.agencies.map((a: any) => ({
            id: a.id,
            name: a.basicInfo?.corporateName || a.name || '',
            image: a.image || '',
            commission: a.qualitative?.commissionRate || a.commission || null,
            // Rótulos padrão são traduzidos na renderização (sem localização fictícia)
            location: a.basicInfo?.address
              ? [a.basicInfo.address.city, a.basicInfo.address.state].filter(Boolean).join(', ')
              : '',
            specialty: Array.isArray(a.qualitative?.specialties)
              ? a.qualitative.specialties.join(', ')
              : a.qualitative?.category || '',
            verified: a.curationStatus === 'APROVADO',
            description: a.qualitative?.bio || a.description || '',
          }));
          setAgencies(formatted);
        }
      } else {
        setFetchError(true);
      }
    } catch (err) {
      console.error('Erro ao listar agências:', err);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgencies();
  }, [fetchAgencies]);

  const handleApply = (agency: any) => {
    setApplyError(null);
    setSelectedAgency(agency);
  };

  // Candidatura registrada no servidor: abre o canal canônico agência ↔ modelo e notifica a agência.
  // O sucesso só aparece quando a API confirma a gravação.
  const handleConfirmApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgency || isApplying) return;
    setIsApplying(true);
    setApplyError(null);
    try {
      const res = await fetch('/api/scout/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyId: selectedAgency.id, message: customPitch }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setApplyError(tApiError(errData, 'api_err_generic'));
        return;
      }
      setProposalSent(selectedAgency.name || t('dsh_ad_registered_agency'));
      setSelectedAgency(null);
      setCustomPitch('');
    } catch {
      setApplyError(tApiError({ code: 'network' }, 'api_err_network'));
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Barra de Contexto do Catálogo */}
      <div className="px-6 py-4 bg-[#0F0F0F] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="gold">{t('agency_verified_network')}</Badge>
          <span className="text-[11px] font-sans text-ivory/50 uppercase tracking-widest">
            {t('agency_audited_compliance')}
          </span>
        </div>

        <div className="p-2.5 bg-[#161616] border border-gold/30 text-xs font-sans text-gold flex items-center gap-2 rounded-sm shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-gold shrink-0" />
          <span>{t('dsh_ad_shielded_contracts')}</span>
        </div>
      </div>

      {proposalSent && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-sans flex items-center justify-between rounded-sm animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {t('dsh_ad_sent_a')} <strong>{proposalSent}</strong>{t('dsh_ad_sent_b')}
          </span>
          <button
            onClick={() => setProposalSent(null)}
            className="text-emerald-400 hover:text-white text-xs font-bold cursor-pointer"
          ><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Grid de Agências ou Estado Vazio */}
      {loading ? (
        <div className="p-12 text-center text-xs font-sans text-ivory/40 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-gold" />
          <span>{t('dsh_ad_syncing')}</span>
        </div>
      ) : fetchError ? (
        <div className="p-12 bg-[#0B0B0B] border border-dashed border-red-900/30 rounded-sm text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-red-950/30 border border-red-800/30 flex items-center justify-center text-red-400 mx-auto">
            <Building2 className="w-7 h-7" />
          </div>
          <div className="max-w-sm mx-auto space-y-1">
            <h4 className="font-serif-lumiardi text-lg font-light text-ivory/80">
              {t('dsh_ad_sync_failed')}
            </h4>
            <p className="text-xs text-ivory/40 font-sans leading-relaxed">
              {t('dsh_ad_sync_failed_desc')}
            </p>
          </div>
          <button
            onClick={fetchAgencies}
            className="mt-2 px-4 py-2 border border-white/10 text-xs font-sans text-ivory/60 hover:text-ivory hover:border-white/20 transition-colors rounded-xs flex items-center gap-1.5 mx-auto cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            {t('dsh_ad_retry')}
          </button>
        </div>
      ) : agencies.length === 0 ? (
        <div className="p-12 bg-[#0B0B0B] border border-dashed border-white/10 rounded-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold mx-auto">
            <Building2 className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h4 className="font-serif-lumiardi text-xl font-light text-ivory">
              {t('dsh_ad_empty_title')}
            </h4>
            <p className="text-xs text-ivory/50 font-sans leading-relaxed">
              {t('dsh_ad_empty_desc')}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agencies.map((agency) => (
            <div
              key={agency.id}
              className="bg-[#0E0E0E] border border-white/10 hover:border-gold/50 transition-all duration-300 flex flex-col justify-between p-6 space-y-6 group shadow-lg rounded-sm"
            >
              <div>
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="relative w-14 h-14 border border-gold/40 bg-black shrink-0 overflow-hidden rounded-xs flex items-center justify-center text-gold">
                    <Building2 className="w-7 h-7" />
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-sans text-ivory/40 block">
                      {t('agency_commission_rate')}
                    </span>
                    <span className={`font-serif-lumiardi text-2xl font-medium ${agency.commission ? 'text-gold' : 'text-ivory/40'}`}>
                      {agency.commission || t('dsh_ov_on_request')}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-serif-lumiardi text-xl font-medium text-ivory group-hover:text-gold transition-colors">
                      {agency.name || t('dsh_ad_registered_agency')}
                    </h3>
                    <ShieldCheck className="w-4 h-4 text-gold shrink-0" />
                  </div>

                  <p className="text-xs text-ivory/50 font-sans flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-bronze" />
                    <span>{agency.location || t('dsh_ad_brazil')}</span>
                  </p>

                  <p className="text-xs font-sans text-ivory/70 leading-relaxed pt-2">
                    {agency.description || t('dsh_ad_default_desc')}
                  </p>
                </div>

                {/* Tags de Especialidade */}
                <div className="mt-4 pt-3 border-t border-white/5 space-y-2 text-[11px] font-sans">
                  <div className="flex items-center justify-between text-ivory/60">
                    <span>{t('dsh_ad_specialty')}</span>
                    <span className="text-ivory font-medium text-right">{agency.specialty || t('dsh_ad_default_specialty')}</span>
                  </div>
                  <div className="flex items-center justify-between text-ivory/60">
                    <span>{t('dsh_ad_compliance')}</span>
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {t('dsh_ad_audited')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ação de Candidatura */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                <span className="text-[10px] font-sans text-emerald-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {t('dsh_ad_open_for_application')}
                </span>

                <button
                  onClick={() => handleApply(agency)}
                  className="px-4 py-2 bg-gold hover:bg-gold-light text-black-matte text-xs font-sans font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer rounded-xs"
                >
                  <Send className="w-3 h-3" />
                  <span>{t('dsh_ad_apply')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
              className="bg-[#0F0F0F] border border-gold/40 p-6 md:p-8 max-w-lg w-full text-ivory shadow-2xl space-y-6 relative rounded-sm"
            >
              <button
                onClick={() => setSelectedAgency(null)}
                className="absolute top-4 right-4 text-ivory/60 hover:text-gold cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-gold font-sans font-semibold">
                  {t('dsh_ad_direct_application')}
                </span>
                <h3 className="font-serif-lumiardi text-2xl font-light text-ivory mt-1">
                  {t('dsh_ad_send_portfolio_to').replace('{name}', selectedAgency.name || t('dsh_ad_registered_agency'))}
                </h3>
                <p className="text-xs text-ivory/60 font-sans mt-1">
                  {t('dsh_ad_modal_desc')}
                </p>
              </div>

              <form onSubmit={handleConfirmApplication} className="space-y-4">
                <div>
                  <label className="block text-xs font-sans text-ivory/80 uppercase tracking-wider mb-2">
                    {t('dsh_ad_pitch_label')}
                  </label>
                  <textarea
                    rows={4}
                    value={customPitch}
                    onChange={(e) => setCustomPitch(e.target.value)}
                    placeholder={t('dsh_ad_pitch_placeholder').replace('{name}', selectedAgency.name || t('dsh_ad_registered_agency'))}
                    className="w-full bg-[#181818] border border-white/10 p-3 text-xs text-ivory focus:outline-none focus:border-gold font-sans rounded-xs"
                    required
                  />
                </div>

                <div className="p-3 bg-[#141414] border border-white/5 text-[11px] font-sans text-ivory/70 space-y-1 rounded-xs">
                  <div className="flex items-center gap-1.5 text-gold font-medium">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{t('dsh_ad_items_included')}</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5 text-ivory/50 text-[10px]">
                    <li>{t('dsh_ad_item_book')}</li>
                    <li>{t('dsh_ad_item_showreel')}</li>
                    <li>{t('dsh_ad_item_specs')}</li>
                    <li>{t('dsh_ad_item_metrics')}</li>
                  </ul>
                </div>

                {applyError && (
                  <p role="alert" className="p-3 bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-sans rounded-xs">
                    {applyError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedAgency(null)}
                    className="px-4 py-2.5 text-xs uppercase font-sans text-ivory/60 hover:text-ivory cursor-pointer"
                  >
                    {t('dsh_ts_cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isApplying}
                    className="px-6 py-2.5 bg-gold hover:bg-gold-light text-black-matte font-semibold text-xs font-sans uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-md rounded-xs disabled:opacity-60 disabled:cursor-wait"
                  >
                    {isApplying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{t('dsh_ad_transmit')}</span>
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
