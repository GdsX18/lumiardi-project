'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useAuthPortal } from '@/context/AuthPortalContext';
import Link from 'next/link';

export default function BillingPortalPage() {
  const { currentUser, role } = useAuthPortal();
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [payoutSummary, setPayoutSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);

  const fetchBillingData = async () => {
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
  };

  useEffect(() => {
    fetchBillingData();
  }, []);

  const handleCancelSubscription = async () => {
    if (!confirm('Deseja realmente programar o cancelamento da sua assinatura ao fim do período atual?')) {
      return;
    }

    setIsCanceling(true);
    try {
      const res = await fetch('/api/billing/subscription/cancel', { method: 'POST' });
      const json = await res.json();
      if (res.ok) {
        setCancelMessage(json.message);
        fetchBillingData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCanceling(false);
    }
  };

  const sub = subscriptionData?.subscription;
  const plan = subscriptionData?.plan;
  const metrics = subscriptionData?.usageMetrics;

  return (
    <DashboardLayout
      pageTitle="Portal de Faturamento & Assinaturas"
      pageSubtitle="Gestão de planos VIP, limites operacionais de cota, histórico de faturas e repasses."
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
          {cancelMessage && (
            <div className="p-4 bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{cancelMessage}</span>
              </div>
              <button
                onClick={() => setCancelMessage(null)}
                className="text-[10px] uppercase font-bold text-amber-400 hover:underline"
              >
                Dispensar
              </button>
            </div>
          )}

          {/* Seção 1: Status da Assinatura Atual & Cotas de Tier */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Card Principal do Plano (7 Cols) */}
            <div className="lg:col-span-7 bg-[#0E0E0E] border border-[#C9A96B]/40 p-8 relative overflow-hidden space-y-6">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#C9A96B]/5 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[#C9A96B] font-semibold">
                    Plano Ativo
                  </span>
                  <h2 className="font-serif-lumiardi text-3xl font-light text-ivory mt-1">
                    {plan?.name || 'Membro Lumiardi'}
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] uppercase tracking-widest font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {sub?.cancelAtPeriodEnd ? 'Cancelamento no Fim do Ciclo' : 'Status: Ativo'}
                  </span>
                </div>
              </div>

              {/* Detalhes de Cobrança */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 bg-[#141414] border border-white/5 space-y-1">
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

                <div className="p-4 bg-[#141414] border border-white/5 space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-ivory/50 block font-sans">
                    Próxima Renovação
                  </span>
                  <div className="text-sm font-sans text-ivory font-medium pt-1">
                    {sub?.currentPeriodEnd
                      ? new Date(sub.currentPeriodEnd).toLocaleDateString('pt-BR')
                      : 'Em 30 dias'}
                  </div>
                </div>

                <div className="p-4 bg-[#141414] border border-white/5 space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-ivory/50 block font-sans">
                    Provedor / Gateway
                  </span>
                  <div className="text-sm font-sans text-ivory font-medium pt-1 uppercase flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-[#C9A96B]" />
                    <span>{sub?.gateway === 'nowpayments' ? 'NOWPayments (Crypto)' : 'CCBill (Fiat)'}</span>
                  </div>
                </div>
              </div>

              {/* Botões de Ação do Plano */}
              <div className="pt-4 border-t border-white/10 flex flex-wrap gap-4 items-center justify-between">
                <Link
                  href="/planos"
                  className="px-5 py-2.5 bg-[#C9A96B] hover:bg-[#D4B87A] text-[#0B0B0B] text-xs font-sans uppercase tracking-[0.2em] font-semibold transition-all flex items-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Fazer Upgrade de Plano</span>
                </Link>

                {!sub?.cancelAtPeriodEnd && (
                  <button
                    onClick={handleCancelSubscription}
                    disabled={isCanceling}
                    className="px-4 py-2 bg-transparent hover:bg-rose-500/10 text-ivory/50 hover:text-rose-400 border border-transparent hover:border-rose-500/20 text-xs font-sans uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isCanceling ? 'Processando...' : 'Cancelar Assinatura'}
                  </button>
                )}
              </div>
            </div>

            {/* Medidores de Uso e Limites do Tier (5 Cols) */}
            <div className="lg:col-span-5 bg-[#0E0E0E] border border-white/10 p-8 space-y-6">
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
                      {metrics?.driveStorageUsedGB || 3.8} GB / {metrics?.driveStorageTotalGB || 25} GB
                    </span>
                  </div>
                  <div className="w-full bg-[#181818] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#C9A96B] h-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          ((metrics?.driveStorageUsedGB || 3.8) / (metrics?.driveStorageTotalGB || 25)) * 100
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
                      {metrics?.scoutSearchesUsed || 12} / {metrics?.scoutSearchesTotal === 'unlimited' ? 'Ilimitado' : metrics?.scoutSearchesTotal || 50}
                    </span>
                  </div>
                  <div className="w-full bg-[#181818] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all"
                      style={{ width: '24%' }}
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
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Histórico de Faturas e Recibos Fiscais */}
          <div className="bg-[#0E0E0E] border border-white/10 p-8 space-y-6">
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
                          <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 text-[10px] uppercase font-semibold border border-emerald-500/30">
                            Liquidado
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <a
                            href={`/api/billing/invoices/${inv.id}/download`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-[#C9A96B] text-ivory hover:text-[#0B0B0B] border border-white/10 hover:border-[#C9A96B] text-[11px] uppercase tracking-wider font-semibold transition-all"
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

          {/* Seção 3: Extrato de Repasses & Payouts (Campanhas e Comissões) */}
          <div className="bg-[#0E0E0E] border border-white/10 p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="font-serif-lumiardi text-2xl font-light text-ivory">
                  Extrato de Repasses & Payouts (Escrow Shield)
                </h3>
                <p className="text-xs font-sans text-ivory/60 mt-1">
                  Distribuição de faturamento de campanhas e liquidações protegidas.
                </p>
              </div>

              {payoutSummary && (
                <div className="flex items-center gap-4 text-xs font-sans">
                  <div className="p-2.5 bg-[#141414] border border-white/10">
                    <span className="text-[10px] text-ivory/50 block uppercase">Total Repassado:</span>
                    <strong className="text-emerald-400 font-mono">
                      R$ {Number(payoutSummary.totalPaid || 0).toFixed(2)}
                    </strong>
                  </div>
                </div>
              )}
            </div>

            {payouts.length === 0 ? (
              <div className="p-8 text-center text-ivory/40 text-xs font-sans">
                Nenhum repasse de campanha registrado neste ciclo.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[650px]">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] uppercase font-sans tracking-widest text-ivory/50">
                      <th className="py-3 px-4">Referência</th>
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Campanha / Descrição</th>
                      <th className="py-3 px-4">Método</th>
                      <th className="py-3 px-4">Valor Líquido</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-sans divide-y divide-white/5">
                    {payouts.map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-4 font-mono text-ivory">
                          {p.gatewayReference || p.id}
                        </td>
                        <td className="py-4 px-4 text-ivory/70">
                          {new Date(p.paidAt || p.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-4 px-4 text-ivory/80">
                          {p.description}
                        </td>
                        <td className="py-4 px-4 uppercase text-[11px] font-mono text-ivory/70">
                          {p.payoutMethod}
                        </td>
                        <td className="py-4 px-4 font-mono text-emerald-400 font-semibold">
                          {p.currency === 'USD' ? '$' : 'R$'} {Number(p.amount).toFixed(2)}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2 py-0.5 text-[10px] uppercase font-semibold border ${
                              p.status === 'paid'
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {p.status === 'paid' ? 'Depositado ✓' : 'Em Processamento'}
                          </span>
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
    </DashboardLayout>
  );
}
