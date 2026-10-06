'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Building2, CheckCircle2, MessageSquare, Percent, RefreshCw, X, XCircle } from 'lucide-react';
import type { ScoutProposal } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { useAuthPortal } from '@/context/AuthPortalContext';
import { useLanguage } from '@/context/LanguageContext';
import { getDirectConversationId } from '@/lib/chatRoles';

/**
 * Propostas de agenciamento recebidas pela modelo (GET /api/scout/proposals?initiatedBy=agency).
 * O hook fica separado do painel para a página usar o mesmo contador real nos KPIs.
 */
export function useReceivedProposals(enabled: boolean) {
  const [proposals, setProposals] = useState<ScoutProposal[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/scout/proposals?initiatedBy=agency', { cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setProposals(Array.isArray(data.proposals) ? data.proposals : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) reload();
  }, [enabled, reload]);

  const pendingCount = proposals.filter((p) => p.status === 'sent').length;
  return { proposals, setProposals, loading, error, pendingCount, reload };
}

export type ReceivedProposalsState = ReturnType<typeof useReceivedProposals>;

type PendingAction = { id: string; action: 'accept' | 'decline' };

export const ReceivedProposalsPanel: React.FC<{ state: ReceivedProposalsState }> = ({ state }) => {
  const { proposals, setProposals, loading, error, pendingCount, reload } = state;
  const { refreshData } = useAuthPortal();
  const { t, tApiError, formatDate } = useLanguage();
  const [confirming, setConfirming] = useState<PendingAction | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  // Deep link da notificação: /dashboard?proposal=<id> destaca e rola até a proposta.
  // (A lista começa vazia, então ler a URL já no primeiro render não diverge do HTML do servidor.)
  const [highlightId] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('proposal')
  );
  const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map());

  useEffect(() => {
    if (!highlightId || loading) return;
    itemRefs.current.get(highlightId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightId, loading]);

  const respond = async ({ id, action }: PendingAction) => {
    const proposal = proposals.find((p) => p.id === id);
    if (!proposal) return;
    setSubmitting(id);
    setFeedback(null);
    try {
      const res = await fetch(`/api/scout/proposals/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFeedback({ ok: false, text: tApiError(data, 'api_err_generic') });
        // Proposta respondida em outra aba/dispositivo: sincroniza a lista
        if (data.code === 'proposal_closed') reload();
        return;
      }
      setProposals((prev) => prev.map((p) => (p.id === id && data.proposal ? data.proposal : p)));
      setFeedback({
        ok: true,
        text: t(action === 'accept' ? 'dsh_rp_accepted_ok' : 'dsh_rp_declined_ok').replace('{agency}', proposal.agencyName),
      });
      // Perfil passa a "representada": atualiza os dados da sessão (book, catálogo, drive)
      if (action === 'accept') refreshData();
    } catch {
      setFeedback({ ok: false, text: tApiError({ code: 'network' }, 'api_err_network') });
    } finally {
      setSubmitting(null);
      setConfirming(null);
    }
  };

  const statusBadge = (p: ScoutProposal) => {
    if (p.status === 'accepted') {
      return <Badge variant="gold">{t('dsh_rp_status_accepted')}</Badge>;
    }
    if (p.status === 'declined') {
      return <Badge variant="dark">{t('dsh_rp_status_declined')}</Badge>;
    }
    return <Badge variant="outline">{t('dsh_rp_status_sent')}</Badge>;
  };

  return (
    <section className="p-6 bg-[#0E0E0E] border border-white/10 space-y-5 rounded-sm" aria-labelledby="received-proposals-title">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gold" />
            <h3 id="received-proposals-title" className="font-serif-lumiardi text-2xl font-light text-ivory">
              {t('dsh_rp_title')}
            </h3>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 bg-gold text-black-matte text-[10px] font-sans font-bold rounded-full">
                {pendingCount}
              </span>
            )}
          </div>
          <p className="text-xs font-sans text-ivory/60 mt-1 max-w-2xl">{t('dsh_rp_subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={reload}
          disabled={loading}
          className="self-start sm:self-auto p-2 text-ivory/60 hover:text-gold border border-white/10 transition-colors cursor-pointer disabled:opacity-50"
          aria-label={t('dsh_ad_retry')}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {feedback && (
        <div
          role="status"
          className={`p-3 text-xs font-sans flex items-center justify-between gap-3 rounded-xs border ${
            feedback.ok
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-red-950/40 border-red-500/40 text-red-300'
          }`}
        >
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} className="cursor-pointer" aria-label={t('dsh_ts_close')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading && proposals.length === 0 ? (
        <div className="py-8 text-center text-xs font-sans text-ivory/40 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-gold" />
          <span>{t('dsh_ad_syncing')}</span>
        </div>
      ) : error ? (
        <div className="py-6 text-center space-y-3">
          <p className="text-xs font-sans text-red-300">{t('dsh_rp_load_failed')}</p>
          <button
            type="button"
            onClick={reload}
            className="px-4 py-2 bg-gold/10 hover:bg-gold text-gold hover:text-black-matte border border-gold/40 text-xs font-sans uppercase tracking-wider font-semibold transition-all cursor-pointer"
          >
            {t('dsh_ad_retry')}
          </button>
        </div>
      ) : proposals.length === 0 ? (
        <p className="py-6 text-center text-xs font-sans text-ivory/40 border border-dashed border-white/10 rounded-xs">
          {t('dsh_rp_empty')}
        </p>
      ) : (
        <ul className="space-y-3">
          {proposals.map((p) => {
            const isConfirming = confirming?.id === p.id;
            const isBusy = submitting === p.id;
            return (
              <li
                key={p.id}
                ref={(el) => {
                  if (el) itemRefs.current.set(p.id, el);
                  else itemRefs.current.delete(p.id);
                }}
                className={`p-4 bg-[#141414] border space-y-3 rounded-xs transition-colors ${
                  highlightId === p.id ? 'border-gold/70' : 'border-white/5'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-serif-lumiardi text-lg text-ivory font-medium block truncate">{p.agencyName}</span>
                    <span className="text-[10px] font-sans text-ivory/40 uppercase tracking-widest">
                      {formatDate(p.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-sans text-gold flex items-center gap-1">
                      <Percent className="w-3 h-3" />
                      {t('dsh_rp_commission')}: <strong>{p.proposedCommission}</strong>
                    </span>
                    {statusBadge(p)}
                  </div>
                </div>

                <p className="text-xs font-sans text-ivory/70 whitespace-pre-line line-clamp-4">&quot;{p.message}&quot;</p>

                {isConfirming ? (
                  <div className="p-3 bg-black/40 border border-gold/30 space-y-3 rounded-xs">
                    <p className="text-xs font-sans text-ivory/80">
                      {t(confirming.action === 'accept' ? 'dsh_rp_confirm_accept' : 'dsh_rp_confirm_decline').replace(
                        '{agency}',
                        p.agencyName
                      )}
                    </p>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirming(null)}
                        disabled={isBusy}
                        className="px-3 py-2 text-[11px] uppercase font-sans text-ivory/60 hover:text-ivory cursor-pointer"
                      >
                        {t('dsh_ts_cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={() => respond(confirming)}
                        disabled={isBusy}
                        className={`px-4 py-2 text-[11px] font-sans uppercase tracking-wider font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-wait ${
                          confirming.action === 'accept'
                            ? 'bg-gold hover:bg-gold-light text-black-matte'
                            : 'bg-red-900/60 hover:bg-red-800 text-red-100 border border-red-500/40'
                        }`}
                      >
                        {isBusy && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                        <span>{t(confirming.action === 'accept' ? 'dsh_rp_accept' : 'dsh_rp_decline')}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {p.status === 'sent' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setConfirming({ id: p.id, action: 'accept' })}
                          className="px-4 py-2 bg-gold hover:bg-gold-light text-black-matte text-[11px] font-sans uppercase tracking-wider font-semibold flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t('dsh_rp_accept')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirming({ id: p.id, action: 'decline' })}
                          className="px-4 py-2 bg-[#1A1A1A] hover:bg-red-950/60 text-ivory/80 hover:text-red-200 border border-white/10 text-[11px] font-sans uppercase tracking-wider font-semibold flex items-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{t('dsh_rp_decline')}</span>
                        </button>
                      </>
                    )}
                    <Link
                      href={`/dashboard/chat?conversationId=${encodeURIComponent(getDirectConversationId(p.agencyId, p.modelId))}`}
                      className="px-4 py-2 text-ivory/70 hover:text-gold text-[11px] font-sans uppercase tracking-wider font-semibold flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{t('dsh_rp_open_chat')}</span>
                    </Link>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
