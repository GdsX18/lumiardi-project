'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshCw,
} from 'lucide-react';
import { useAuthPortal } from '@/context/AuthPortalContext';
import { useLanguage } from '@/context/LanguageContext';
import { Badge } from '@/components/ui/Badge';

export const AgencyDirectoryView: React.FC = () => {
  const { activeCreator } = useAuthPortal();
  const { t } = useLanguage();
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgency, setSelectedAgency] = useState<any | null>(null);
  const [proposalSent, setProposalSent] = useState<string | null>(null);
  const [customPitch, setCustomPitch] = useState('');

  const fetchAgencies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/agencies');
      if (res.ok) {
        const data = await res.json();
        if (data.agencies) {
          // Normaliza formato para exibição
          const formatted = data.agencies.map((a: any) => ({
            id: a.id,
            name: a.basicInfo?.corporateName || a.name || 'Agência Cadastrada',
            image: a.image || '',
            commission: a.qualitative?.commissionRate || a.commission || '20%',
            location: a.basicInfo?.address
              ? `${a.basicInfo.address.city || 'São Paulo'}, ${a.basicInfo.address.state || 'SP'}`
              : 'Brasil',
            specialty: Array.isArray(a.qualitative?.specialties)
              ? a.qualitative.specialties.join(', ')
              : a.qualitative?.category || 'Casting & Gestão de Modelos',
            verified: a.curationStatus === 'APROVADO',
            description: a.qualitative?.bio || a.description || 'Agência de gestão e casting de talentos homologada na rede Lumiardi.',
            contractStatus: 'Disponível para Candidatura',
          }));
          setAgencies(formatted);
        }
      }
    } catch (err) {
      console.error('Erro ao listar agências:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgencies();
  }, [fetchAgencies]);

  const handleApply = (agency: any) => {
    setSelectedAgency(agency);
  };

  const handleConfirmApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgency) return;
    setProposalSent(selectedAgency.name || selectedAgency.id);
    setSelectedAgency(null);
    setCustomPitch('');
  };

  return (
    <div className="space-y-8">
      {/* Top Banner do Catálogo de Agências */}
      <div className="p-6 md:p-8 bg-[#0F0F0F] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="gold">{t('agency_verified_network') || 'REDE VERIFICADA'}</Badge>
            <span className="text-[10px] font-sans text-ivory/50 uppercase tracking-widest">
              {t('agency_audited_compliance') || 'Apenas Agências Auditadas com Compliance Ativo'}
            </span>
          </div>
          <h2 className="font-serif-lumiardi text-2xl md:text-4xl font-light text-ivory">
            {t('agency_catalog_title') || 'Agências de Gestão Parceiras'}
          </h2>
          <p className="text-xs md:text-sm font-sans text-ivory/60 mt-1 max-w-2xl">
            Explore agências parceiras, analise percentuais de comissão e envie seu portfólio diretamente para diretores de casting com um clique.
          </p>
        </div>

        <div className="p-3 bg-[#161616] border border-gold/30 text-xs font-sans text-gold flex items-center gap-2 rounded-sm">
          <ShieldCheck className="w-4 h-4 text-gold shrink-0" />
          <span>Contratos Blindados pela Plataforma Lumiardi</span>
        </div>
      </div>

      {proposalSent && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-sans flex items-center justify-between rounded-sm animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Candidatura e Portfólio enviados com sucesso para a diretoria da agência <strong>{proposalSent}</strong>! Eles entrarão em contato via Chat Criptografado.
          </span>
          <button
            onClick={() => setProposalSent(null)}
            className="text-emerald-400 hover:text-white text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Grid de Agências ou Estado Vazio */}
      {loading ? (
        <div className="p-12 text-center text-xs font-sans text-ivory/40 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-gold" />
          <span>Sincronizando agências ativas na rede...</span>
        </div>
      ) : agencies.length === 0 ? (
        <div className="p-12 bg-[#0B0B0B] border border-dashed border-white/10 rounded-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold mx-auto">
            <Building2 className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h4 className="font-serif-lumiardi text-xl font-light text-ivory">
              Nenhuma Agência Parceira Registrada no Momento
            </h4>
            <p className="text-xs text-ivory/50 font-sans leading-relaxed">
              As agências parceiras passam por auditoria e validação jurídica contínua pela Mesa de Curadoria. Assim que novas agências forem homologadas, elas aparecerão aqui automaticamente.
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
                  className="px-4 py-2 bg-gold hover:bg-gold-light text-black-matte text-xs font-sans font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer rounded-xs"
                >
                  <Send className="w-3 h-3" />
                  <span>Candidatar</span>
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
                    placeholder={`Ex: Olá equipe ${selectedAgency.name}, tenho interesse em trabalhar com campanhas internacionais...`}
                    className="w-full bg-[#181818] border border-white/10 p-3 text-xs text-ivory focus:outline-none focus:border-gold font-sans rounded-xs"
                    required
                  />
                </div>

                <div className="p-3 bg-[#141414] border border-white/5 text-[11px] font-sans text-ivory/70 space-y-1 rounded-xs">
                  <div className="flex items-center gap-1.5 text-gold font-medium">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Itens incluídos no envio:</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5 text-ivory/50 text-[10px]">
                    <li>Book com ensaios oficiais cadastrados no seu perfil</li>
                    <li>Showreel de vídeo (se cadastrado)</li>
                    <li>Ficha técnica com biometria e medidas corporais</li>
                    <li>Métricas de conversão e dados de contato</li>
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
                    className="px-6 py-2.5 bg-gold hover:bg-gold-light text-black-matte font-semibold text-xs font-sans uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-md rounded-xs"
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
