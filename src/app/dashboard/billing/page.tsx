'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import {
  CreditCard,
  ShieldCheck,
  Download,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Zap,
  HardDrive,
  Search,
  DollarSign,
  ArrowUpRight,
  Receipt,
  Building2,
  FileText,
  Calendar,
  Crown,
  RotateCcw,
} from 'lucide-react';
import { useAuthPortal } from '@/context/AuthPortalContext';
import { useLanguage } from '@/context/LanguageContext';
import { CancelSubscriptionModal } from '@/components/dashboard/CancelSubscriptionModal';
import { UpgradePlanModal } from '@/components/dashboard/UpgradePlanModal';

export default function BillingPortalPage() {
  const { currentUser, role, refreshData } = useAuthPortal();
  const { t } = useLanguage();

  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [payoutSummary, setPayoutSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Estados dos Modais
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'warn'; msg: string } | null>(null);

  const fetchBillingData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [subRes, invRes, payRes] = await Promise.all([
        fetch('/api/billing/subscription'),
        fetch('/api/billing/invoices'),
        fetch('/api/billing/payouts'),
      ]);

      if (subRes.ok) {
        const subJson = await subRes.json();
        setSubscriptionData(subJson);
      }

      if (invRes.ok) {
        const invJson = await invRes.json();
        setInvoices(invJson.invoices || []);
      }

      if (payRes.ok) {
        const payJson = await payRes.json();
        setPayouts(payJson.payouts || []);
        setPayoutSummary(payJson.summary || null);
      }
    } catch (e) {
      console.error('Erro ao buscar dados de faturamento:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  // Ação de Cancelamento Real no Backend
  const handleConfirmCancel = async () => {
    try {
      const res = await fetch('/api/billing/subscription/cancel', { method: 'POST' });
      const json = await res.json();
      if (res.ok) {
        setActionFeedback({
          type: 'warn',
          msg: json.message || 'Sua assinatura foi programada para cancelamento ao fim do ciclo atual. Seu acesso VIP continua 100% ativo até a data de expiração.',
        });
        await fetchBillingData();
      } else {
        throw new Error(json.error || 'Erro ao cancelar');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Falha ao programar cancelamento.';
      setActionFeedback({ type: 'warn', msg });
    }
  };

  // Ação de Reativação da Assinatura
  const handleReactivateSubscription = async () => {
    setIsReactivating(true);
    try {
      const res = await fetch('/api/billing/subscription/reactivate', { method: 'POST' });
      const json = await res.json();
      if (res.ok) {
        setActionFeedback({
          type: 'success',
          msg: json.message || 'Sua assinatura foi reativada com sucesso! A renovação automática foi restabelecida.',
        });
        await fetchBillingData();
      } else {
        throw new Error(json.error || 'Erro ao reativar');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Falha ao reativar assinatura.';
      setActionFeedback({ type: 'warn', msg });
    } finally {
      setIsReactivating(false);
    }
  };

  // Callback de Upgrade Concluído
  const handleUpgradeSuccess = async () => {
    await fetchBillingData();
    if (refreshData) await refreshData();
  };

  const sub = subscriptionData?.subscription;
  const plan = subscriptionData?.plan;
  const metrics = subscriptionData?.usageMetrics;

  const formattedPeriodEnd = sub?.currentPeriodEnd
    ? new Date(sub.currentPeriodEnd).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : 'Em 30 dias';

  return (
    <DashboardLayout
      pageTitle={t('billing_portal_title') || 'Portal de Faturamento & Assinaturas'}
      pageSubtitle={t('billing_portal_subtitle') || 'Gestão de planos VIP, limites operacionais de cota, histórico de faturas e repasses.'}
    >
      {isLoading ? (
        <div className="py-24 text-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin text-[#C9A96B] mx-auto" />
          <p className="text-xs uppercase tracking-widest text-ivory/60 font-mono">
            Carregando dados financeiros seguros...
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Mensagens de Feedback */}
          {actionFeedback && (
            <div
              className={`p-4 text-xs flex items-center justify-between rounded-xs animate-in fade-in ${
                actionFeedback.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/60 border border-amber-500/40 text-amber-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {actionFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span>{actionFeedback.msg}</span>
              </div>
              <button
                onClick={() => setActionFeedback(null)}
                className="text-[10px] uppercase font-bold hover:underline cursor-pointer ml-4"
              >
                Dispensar
              </button>
            </div>
          )}

          {/* Banner de Cancelamento Agendado (Garantia de Uso até o Final do Mês) */}
          {sub?.cancelAtPeriodEnd && (
            <div className="p-5 bg-gradient-to-r from-amber-950/40 to-[#141414] border-2 border-amber-500/50 rounded-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <Calendar className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-xs font-sans uppercase tracking-wider font-bold text-amber-300 block">
                    Cancelamento Programado — Acesso VIP 100% Ativo até {formattedPeriodEnd}
                  </span>
                  <p className="text-xs text-ivory/80 font-sans leading-relaxed">
                    Você continuará aproveitando todos os recursos do <strong>Plano {plan?.name}</strong> (Drive {metrics?.driveStorageTotalGB || 5} GB, Chat e Scouting) até o final do período que já foi pago. Nenhuma nova cobrança será realizada.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReactivateSubscription}
                disabled={isReactivating}
                className="px-5 py-2.5 bg-gold hover:bg-gold-light text-black-matte font-semibold text-xs font-sans uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md shrink-0 disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isReactivating ? 'animate-spin' : ''}`} />
                <span>{isReactivating ? 'Reativando...' : 'Reativar Renovação Automática'}</span>
              </button>
            </div>
          )}

          {/* Seção 1: Status da Assinatura Atual & Cotas de Tier */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Card Principal do Plano (7 Cols) */}
            <div className="lg:col-span-7 bg-[#0E0E0E] border border-[#C9A96B]/40 p-8 relative overflow-hidden space-y-6 rounded-sm">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#C9A96B]/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[#C9A96B] font-semibold">
                    {t('billing_current_plan') || 'Plano Ativo'}
                  </span>
                  <h2 className="font-serif-lumiardi text-3xl font-light text-ivory mt-1">
                    {plan?.name || 'Membro Lumiardi'}
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  {sub?.cancelAtPeriodEnd ? (
                    <span className="px-3 py-1 bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] uppercase tracking-widest font-semibold flex items-center gap-1.5 rounded-xs">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      Expira em {formattedPeriodEnd}
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] uppercase tracking-widest font-semibold flex items-center gap-1.5 rounded-xs">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Status: Ativo & Renovando
                    </span>
                  )}
                </div>
              </div>

              {/* Detalhes de Cobrança */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 bg-[#141414] border border-white/5 space-y-1 rounded-xs">
                  <span className="text-[10px] uppercase tracking-wider text-ivory/50 block font-sans">
                    Valor Recorrente
                  </span>
                  <div className="text-xl font-serif-lumiardi text-[#C9A96B] font-medium">
                    {sub?.currency === 'USD' ? '$' : 'R$'} {Number(sub?.amount || 0).toFixed(2)}
                    <span className="text-[10px] text-ivory/50 font-sans ml-1">
                      /{sub?.billingInterval === 'yearly' ? 'ano' : 'mês'}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-[#141414] border border-white/5 space-y-1 rounded-xs">
                  <span className="text-[10px] uppercase tracking-wider text-ivory/50 block font-sans">
                    {sub?.cancelAtPeriodEnd ? 'Término do Ciclo' : 'Próxima Renovação'}
                  </span>
                  <div className="text-sm font-sans text-ivory font-medium pt-1">
                    {formattedPeriodEnd}
                  </div>
                </div>

                <div className="p-4 bg-[#141414] border border-white/5 space-y-1 rounded-xs">
                  <span className="text-[10px] uppercase tracking-wider text-ivory/50 block font-sans">
                    Provedor / Gateway
                  </span>
                  <div className="text-sm font-sans text-ivory font-medium pt-1 uppercase flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-[#C9A96B]" />
                    <span>{sub?.gateway === 'nowpayments' ? 'NOWPayments (Crypto)' : 'CCBill / Pix'}</span>
                  </div>
                </div>
              </div>

              {/* Botões de Ação do Plano */}
              <div className="pt-4 border-t border-white/10 flex flex-wrap gap-4 items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="px-5 py-2.5 bg-[#C9A96B] hover:bg-[#D4B87A] text-[#0B0B0B] text-xs font-sans uppercase tracking-[0.2em] font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-md rounded-xs hover:brightness-110"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Fazer Upgrade de Plano</span>
                </button>

                {!sub?.cancelAtPeriodEnd ? (
                  <button
                    type="button"
                    onClick={() => setIsCancelModalOpen(true)}
                    className="px-4 py-2 bg-transparent hover:bg-rose-500/10 text-ivory/50 hover:text-rose-400 border border-transparent hover:border-rose-500/20 text-xs font-sans uppercase tracking-wider transition-all cursor-pointer rounded-xs"
                  >
                    Cancelar Assinatura
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleReactivateSubscription}
                    disabled={isReactivating}
                    className="px-4 py-2 bg-transparent hover:bg-gold/10 text-gold border border-gold/40 text-xs font-sans uppercase tracking-wider transition-all cursor-pointer rounded-xs"
                  >
                    {isReactivating ? 'Reativando...' : 'Reativar Assinatura'}
                  </button>
                )}
              </div>
            </div>

            {/* Medidores de Uso e Limites do Tier (5 Cols) */}
            <div className="lg:col-span-5 bg-[#0E0E0E] border border-white/10 p-8 space-y-6 rounded-sm">
              <div className="border-b border-white/10 pb-4">
                <h3 className="font-serif-lumiardi text-2xl font-light text-ivory">
                  Cotas & Recursos do Tier
                </h3>
                <span className="text-[10px] uppercase tracking-widest text-ivory/50 font-sans">
                  Limites do Plano {plan?.name}
                </span>
              </div>

              <div className="space-y-5">
                {/* Armazenamento Lumiardi Drive */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-sans">
                    <span className="flex items-center gap-2 text-ivory/80">
                      <HardDrive className="w-3.5 h-3.5 text-[#C9A96B]" />
                      <span>Armazenamento Drive</span>
                    </span>
                    <span className="text-ivory font-mono font-medium">
                      {(metrics?.driveStorageUsedGB ?? 0).toFixed(2)} GB / {metrics?.driveStorageTotalGB || 5} GB
                    </span>
                  </div>
                  <div className="w-full bg-[#181818] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#C9A96B] h-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          (((metrics?.driveStorageUsedGB ?? 0)) / (metrics?.driveStorageTotalGB || 5)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Talent Scout ou Propostas */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-sans">
                    <span className="flex items-center gap-2 text-ivory/80">
                      <Search className="w-3.5 h-3.5 text-[#C9A96B]" />
                      <span>Consultas de Scouting</span>
                    </span>
                    <span className="text-ivory font-mono font-medium">
                      {metrics?.scoutSearchesUsed ?? 0} / {metrics?.scoutSearchesTotal === 'unlimited' ? 'Ilimitado' : metrics?.scoutSearchesTotal || 10}
                    </span>
                  </div>
                  <div className="w-full bg-[#181818] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          metrics?.scoutSearchesTotal === 'unlimited'
                            ? 100
                            : (((metrics?.scoutSearchesUsed ?? 0)) / (Number(metrics?.scoutSearchesTotal) || 10)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Proteção e Benefícios */}
                <div className="pt-3 border-t border-white/10 space-y-2 text-xs font-sans text-ivory/70">
                  <div className="flex items-center gap-2 text-ivory/90">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A96B]" />
                    <span>Marca d'água Dinâmica Tokenizada Ativa</span>
                  </div>
                  <div className="flex items-center gap-2 text-ivory/90">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A96B]" />
                    <span>Blindagem Jurídica & Modelos de NDA Inclusos</span>
                  </div>
                  {plan?.limits?.priorityPlacement === 'exclusive' && (
                    <div className="flex items-center gap-2 text-gold font-medium">
                      <Crown className="w-3.5 h-3.5 text-gold" />
                      <span>Destaque Exclusivo no Topo do Scouting</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Histórico de Faturas e Recibos Fiscais */}
          <div className="bg-[#0E0E0E] border border-white/10 p-8 space-y-6 rounded-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="font-serif-lumiardi text-2xl font-light text-ivory">
                  Faturas & Comprovantes Fiscais
                </h3>
                <p className="text-xs font-sans text-ivory/60 mt-1">
                  Recibos oficiais de quitação gerados com hash de integridade e prontos para download.
                </p>
              </div>

              <span className="text-xs font-mono text-[#C9A96B]">
                {invoices.length} Documentos Emitidos
              </span>
            </div>

            {invoices.length === 0 ? (
              <div className="p-8 text-center text-ivory/40 text-xs font-sans">
                Nenhuma fatura registrada no momento.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[650px]">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] uppercase font-sans tracking-widest text-ivory/50">
                      <th className="py-3 px-4">Documento</th>
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Descrição</th>
                      <th className="py-3 px-4">Valor</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Recibo Oficial</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-sans divide-y divide-white/5">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-4 font-mono text-ivory font-medium">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-4 px-4 text-ivory/70">
                          {new Date(inv.paidAt || inv.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-4 px-4 text-ivory/80">
                          {inv.billingReason}
                        </td>
                        <td className="py-4 px-4 font-mono text-[#C9A96B] font-semibold">
                          {inv.currency === 'USD' ? '$' : 'R$'} {Number(inv.amount).toFixed(2)}
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 text-[10px] uppercase font-semibold border border-emerald-500/30 rounded-xs">
                            Liquidado
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <a
                            href={`/api/billing/invoices/${inv.id}/download`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-[#C9A96B] text-ivory hover:text-[#0B0B0B] border border-white/10 hover:border-[#C9A96B] text-[11px] uppercase tracking-wider font-semibold transition-all rounded-xs"
                          >
                            <Download className="w-3 h-3" />
                            <span>Baixar PDF</span>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Cancelamento */}
      <CancelSubscriptionModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        planName={plan?.name || 'Membro Lumiardi'}
        currentPeriodEnd={sub?.currentPeriodEnd || ''}
        storageGB={metrics?.driveStorageTotalGB || 5}
      />

      {/* Modal de Upgrade de Plano Instantâneo */}
      <UpgradePlanModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        currentPlanId={sub?.planId || (role === 'agencia' ? 'select' : 'glow')}
        userRole={role === 'agencia' ? 'agencia' : 'criadora'}
        onSuccess={handleUpgradeSuccess}
      />
    </DashboardLayout>
  );
}
