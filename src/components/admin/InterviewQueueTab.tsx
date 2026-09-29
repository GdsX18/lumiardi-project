'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  MessageCircle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  Video,
  ShieldCheck,
  User,
  AlertCircle,
} from 'lucide-react';
import { CurationInterview, CurationRole } from '@/types';

interface InterviewQueueTabProps {
  currentCuratorRole?: CurationRole;
  onRefreshMetrics?: () => void;
}

export function InterviewQueueTab({
  currentCuratorRole = 'admin',
  onRefreshMetrics,
}: InterviewQueueTabProps) {
  const [interviews, setInterviews] = useState<CurationInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('aguardando_reuniao');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal de Recusa
  const [rejectingItem, setRejectingItem] = useState<CurationInterview | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const canDecide = currentCuratorRole !== 'curador_junior';

  const loadInterviews = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/api/admin/interviews${statusFilter ? `?status=${statusFilter}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setInterviews(data.interviews || []);
      }
    } catch (e) {
      console.error('Erro ao carregar entrevistas:', e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadInterviews();
  }, [loadInterviews]);

  const handleApprove = async (item: CurationInterview) => {
    if (!canDecide) return;
    setProcessingId(item.id);
    try {
      const res = await fetch(`/api/admin/applications/${item.userId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APROVADA_PAGAMENTO' }),
      });

      if (res.ok) {
        setActionSuccess(`Candidata ${item.fullName} aprovada para pagamento com sucesso!`);
        setTimeout(() => setActionSuccess(null), 4000);
        await loadInterviews();
        if (onRefreshMetrics) onRefreshMetrics();
      }
    } catch (err) {
      console.error('Erro ao aprovar para pagamento:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectingItem || !rejectReason.trim()) return;
    setProcessingId(rejectingItem.id);
    try {
      const res = await fetch(`/api/admin/applications/${rejectingItem.userId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'REJEITADO',
          rejectionReason: rejectReason.trim(),
        }),
      });

      if (res.ok) {
        setActionSuccess(`Candidatura de ${rejectingItem.fullName} encerrada com justificativa protocolada.`);
        setRejectingItem(null);
        setRejectReason('');
        setTimeout(() => setActionSuccess(null), 4000);
        await loadInterviews();
        if (onRefreshMetrics) onRefreshMetrics();
      }
    } catch (err) {
      console.error('Erro ao recusar candidatura:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredInterviews = interviews.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.fullName.toLowerCase().includes(term) ||
      (item.artisticName && item.artisticName.toLowerCase().includes(term)) ||
      item.email.toLowerCase().includes(term) ||
      item.whatsapp.includes(term)
    );
  });

  const generateWhatsAppLink = (item: CurationInterview) => {
    const rawNumber = item.whatsapp.replace(/\D/g, '');
    const cleanNumber = rawNumber.startsWith('55') ? rawNumber : `55${rawNumber}`;
    const candidateName = item.artisticName || item.fullName;
    const dateFormatted = item.interviewDate.split('-').reverse().join('/');
    const text = encodeURIComponent(
      `Olá, ${candidateName}! Aqui é da Mesa de Curadoria Oficial da Lumiardi.\n\nConfirmamos a sua entrevista de curadoria prévia para hoje (${dateFormatted}) às ${item.interviewTime} (Horário de Brasília).\n\nAcesse a sala segura do Google Meet pelo link abaixo:\nhttps://meet.google.com/new\n\nAguardamos você para iniciarmos a reunião!`
    );
    return `https://wa.me/${cleanNumber}?text=${text}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-[#111111] border border-white/10 rounded-lg">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou WhatsApp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#1A1A1A] border border-white/10 focus:border-[#D4AF37] text-xs text-ivory placeholder:text-ivory/40 rounded-xs focus:outline-none"
            />
            <Search className="w-4 h-4 text-ivory/40 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[#1A1A1A] border border-white/10 rounded-xs p-0.5">
            <button
              type="button"
              onClick={() => setStatusFilter('aguardando_reuniao')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xs transition-all cursor-pointer ${
                statusFilter === 'aguardando_reuniao'
                  ? 'bg-[#D4AF37] text-[#0B0B0B]'
                  : 'text-ivory/60 hover:text-white'
              }`}
            >
              Aguardando Reunião
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('aprovada')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xs transition-all cursor-pointer ${
                statusFilter === 'aprovada'
                  ? 'bg-[#D4AF37] text-[#0B0B0B]'
                  : 'text-ivory/60 hover:text-white'
              }`}
            >
              Aprovadas para Pagamento
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xs transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-[#D4AF37] text-[#0B0B0B]'
                  : 'text-ivory/60 hover:text-white'
              }`}
            >
              Todas
            </button>
          </div>

          <button
            type="button"
            onClick={loadInterviews}
            disabled={loading}
            className="p-2 bg-[#1A1A1A] border border-white/10 hover:border-white/20 text-ivory/70 hover:text-white rounded-xs transition-colors cursor-pointer"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Alerta de Ação Bem Sucedida */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/50 text-emerald-400 text-xs font-sans rounded-xs flex items-center gap-2 animate-in fade-in duration-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Lista de Entrevistas */}
      {loading ? (
        <div className="p-12 text-center text-ivory/50 font-mono text-xs space-y-3 bg-[#111] border border-white/10 rounded-lg">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#D4AF37]" />
          <p>Carregando fila de entrevistas de curadoria...</p>
        </div>
      ) : filteredInterviews.length === 0 ? (
        <div className="p-12 text-center text-ivory/50 font-sans text-xs bg-[#111] border border-white/10 rounded-lg space-y-2">
          <Calendar className="w-8 h-8 mx-auto text-ivory/30" />
          <p className="text-sm font-serif-lumiardi text-ivory">Nenhuma entrevista encontrada nesta categoria</p>
          <p className="text-ivory/40">Todas as candidatas foram atendidas ou não há agendamentos pendentes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredInterviews.map((item) => {
            const isPending = item.status === 'aguardando_reuniao';
            const isApproved = item.status === 'aprovada';
            const isRejected = item.status === 'recusada';
            const dateFormatted = item.interviewDate.split('-').reverse().join('/');

            return (
              <div
                key={item.id}
                className="p-5 bg-[#0F0F0F] border border-white/10 hover:border-[#D4AF37]/50 rounded-lg transition-all space-y-4 shadow-lg"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  {/* Foto & Identificação */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-neutral-900 border border-[#D4AF37]/40 shrink-0 flex items-center justify-center">
                      {item.photoUrl ? (
                        <img
                          src={item.photoUrl}
                          alt={item.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-[#D4AF37]" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif-lumiardi text-lg text-ivory font-medium">
                          {item.artisticName || item.fullName}
                        </h4>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-[#D4AF37]/10 text-[#F5D77F] border border-[#D4AF37]/30 rounded-xs">
                          PLANO {item.planId.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-ivory/60 font-sans">
                        Nome Civil: <strong className="text-ivory/80 font-normal">{item.fullName}</strong> · {item.email}
                      </p>
                    </div>
                  </div>

                  {/* Badge de Status */}
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span
                      className={`text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-xs border font-semibold ${
                        isPending
                          ? 'bg-amber-950/50 text-amber-400 border-amber-500/40'
                          : isApproved
                          ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/40'
                          : 'bg-red-950/50 text-red-400 border-red-500/40'
                      }`}
                    >
                      {isPending ? 'Aguardando Reunião' : isApproved ? 'Aprovada p/ Pagamento' : 'Recusada'}
                    </span>
                  </div>
                </div>

                {/* Dados da Reunião */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-black/40 p-3.5 rounded-xs border border-white/5 font-sans">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-[#D4AF37] shrink-0" />
                    <div>
                      <span className="text-[10px] text-ivory/40 uppercase block">Data Agendada</span>
                      <span className="font-mono text-ivory font-medium">{dateFormatted}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-[#D4AF37] shrink-0" />
                    <div>
                      <span className="text-[10px] text-ivory/40 uppercase block">Horário Marcado</span>
                      <span className="font-mono text-ivory font-medium">{item.interviewTime} (Brasília)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-ivory/40 uppercase block">WhatsApp</span>
                      <span className="font-mono text-emerald-400 font-semibold">{item.whatsapp}</span>
                    </div>
                  </div>
                </div>

                {/* Barra de Ações Operacionais */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    {/* Botão de Atalho WhatsApp */}
                    <a
                      href={generateWhatsAppLink(item)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-[#25D366] text-xs font-bold uppercase tracking-wider rounded-xs transition-all flex items-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Abrir WhatsApp & Enviar Meet</span>
                    </a>
                  </div>

                  {/* Ações de Decisão da Curadoria */}
                  {canDecide && (
                    <div className="flex items-center gap-2">
                      {isPending && (
                        <>
                          <button
                            type="button"
                            disabled={processingId === item.id}
                            onClick={() => handleApprove(item)}
                            className="px-4 py-2 bg-[#D4AF37] hover:bg-[#F5D77F] text-[#0B0B0B] text-xs font-bold uppercase tracking-wider rounded-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Aprovar para Pagamento</span>
                          </button>

                          <button
                            type="button"
                            disabled={processingId === item.id}
                            onClick={() => setRejectingItem(item)}
                            className="px-4 py-2 bg-white/5 hover:bg-red-950/40 border border-white/10 hover:border-red-500/40 text-ivory/70 hover:text-red-400 text-xs font-bold uppercase tracking-wider rounded-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Recusar</span>
                          </button>
                        </>
                      )}

                      {isApproved && (
                        <span className="text-[11px] text-emerald-400/80 font-mono flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Homologada no Checkout
                        </span>
                      )}

                      {isRejected && (
                        <span className="text-[11px] text-red-400/80 font-mono flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Rejeição protocolada
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Recusa de Candidatura */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-white/20 p-6 max-w-lg w-full rounded-lg space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-red-400 border-b border-white/10 pb-3">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-serif-lumiardi text-lg text-ivory">Recusar Candidatura</h3>
            </div>

            <p className="text-xs text-ivory/70 leading-relaxed font-sans">
              Você está recusando a candidatura de <strong>{rejectingItem.fullName}</strong>. Por favor, forneça uma justificativa formal que será arquivada e registrada no dossiê de compliance da candidata.
            </p>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-ivory/60 mb-1 font-mono">
                Justificativa Formal Obrigatória
              </label>
              <textarea
                rows={4}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ex: Não comparecimento à entrevista no horário agendado / Desconformidade com os critérios editoriais e termos de imagem da plataforma."
                className="w-full p-3 bg-black/60 border border-white/20 focus:border-red-500 text-xs text-ivory placeholder:text-ivory/30 rounded-xs focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectingItem(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 border border-white/10 text-xs uppercase font-semibold text-ivory/60 hover:text-white rounded-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!rejectReason.trim() || processingId === rejectingItem.id}
                onClick={handleRejectConfirm}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-xs transition-all disabled:opacity-50"
              >
                {processingId === rejectingItem.id ? 'Processando...' : 'Confirmar Recusa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
