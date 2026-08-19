'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  CheckCircle2,
  HardDrive,
  Search,
  ShieldCheck,
  Sparkles,
  X,
  CreditCard,
  QrCode,
  Copy,
  Check,
  ArrowRight,
  RefreshCw,
  Star,
  Building2,
  Lock,
} from 'lucide-react';
import { LUMIARDI_PLANS, getPlan } from '@/lib/payments/plansConfig';
import { PlanId, BillingInterval } from '@/lib/payments/types';
import { useLanguage } from '@/context/LanguageContext';

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlanId: string;
  userRole: 'criadora' | 'agencia';
  onSuccess: () => Promise<void>;
}

export const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({
  isOpen,
  onClose,
  currentPlanId,
  userRole,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const [interval, setInterval] = useState<BillingInterval>('monthly');

  // Planos disponíveis conforme o papel
  const availablePlanIds: PlanId[] =
    userRole === 'agencia' ? ['select', 'signature'] : ['glow', 'radiance', 'icon'];

  // Seleciona por padrão o plano superior ao atual
  const nextPlanId =
    availablePlanIds.find((id) => id !== currentPlanId && LUMIARDI_PLANS[id].priceBRL.monthly > (LUMIARDI_PLANS[currentPlanId as PlanId]?.priceBRL.monthly || 0)) ||
    (userRole === 'agencia' ? 'signature' : 'radiance');

  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>(nextPlanId);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'crypto'>('pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [step, setStep] = useState<'select' | 'pay' | 'success'>('select');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Dados do Cartão
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });

  const selectedPlan = getPlan(selectedPlanId);
  const isYearly = interval === 'yearly';
  const priceBRL = isYearly ? selectedPlan.priceBRL.yearly * 12 : selectedPlan.priceBRL.monthly;

  // Pix Dados
  const pixCopiaECola = `00020126580014br.gov.bcb.pix0136noreply@lumiardi.com520400005303986540${priceBRL.toFixed(2)}5802BR5918LUMIARDI CLUB6009SAO PAULO62070503***6304`;
  const pixQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixCopiaECola)}`;

  const handleCopyPix = () => {
    navigator.clipboard?.writeText(pixCopiaECola);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleConfirmUpgrade = async () => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // Simula validação de gateway de pagamento
      if (paymentMethod === 'card') {
        if (!cardData.number || !cardData.name || !cardData.expiry || !cardData.cvv) {
          throw new Error('Por favor, preencha todos os dados do cartão de crédito.');
        }
      }

      const res = await fetch('/api/billing/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanId,
          interval,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao processar upgrade.');
      }

      await onSuccess();
      setStep('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar o upgrade de plano.';
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseAll = () => {
    setStep('select');
    setErrorMsg(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-[#0D0D0D] border border-gold/50 p-6 md:p-8 max-w-3xl w-full text-ivory shadow-2xl space-y-6 relative rounded-sm my-8 max-h-[90vh] overflow-y-auto"
          >
            {/* Fechar */}
            <button
              onClick={handleCloseAll}
              className="absolute top-4 right-4 text-ivory/50 hover:text-gold transition-colors cursor-pointer p-1"
            >
              <X className="w-5 h-5" />
            </button>

            {/* ETAPA 1: SELEÇÃO DE PLANO */}
            {step === 'select' && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-gold/10 border border-gold/40 text-gold text-[10px] font-sans uppercase tracking-[0.25em] font-semibold">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Upgrade Instantâneo de Plano VIP</span>
                  </div>
                  <h3 className="font-serif-lumiardi text-2xl md:text-4xl font-light text-ivory">
                    Eleve o Nível da sua Carreira & Operação
                  </h3>
                  <p className="text-xs md:text-sm text-ivory/60 font-sans max-w-xl mx-auto leading-relaxed">
                    Aumente sua capacidade de armazenamento no Drive, amplie suas buscas de scouting e receba destaque exclusivo.
                  </p>
                </div>

                {/* Alternador Mensal / Anual */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setInterval('monthly')}
                    className={`px-4 py-2 text-xs font-sans uppercase tracking-wider transition-all cursor-pointer rounded-xs ${
                      interval === 'monthly'
                        ? 'bg-gold text-black-matte font-semibold shadow-md'
                        : 'text-ivory/60 hover:text-ivory bg-[#141414] border border-white/10'
                    }`}
                  >
                    Mensal
                  </button>
                  <button
                    onClick={() => setInterval('yearly')}
                    className={`px-4 py-2 text-xs font-sans uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 rounded-xs ${
                      interval === 'yearly'
                        ? 'bg-gold text-black-matte font-semibold shadow-md'
                        : 'text-ivory/60 hover:text-ivory bg-[#141414] border border-white/10'
                    }`}
                  >
                    <span>Anual</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500 text-black-matte font-bold rounded-xs">
                      Economize 20%
                    </span>
                  </button>
                </div>

                {/* Grade de Planos */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {availablePlanIds.map((pId) => {
                    const p = LUMIARDI_PLANS[pId];
                    const isCurrent = currentPlanId === pId;
                    const isSelected = selectedPlanId === pId;
                    const pPrice = isYearly ? p.priceBRL.yearly : p.priceBRL.monthly;

                    return (
                      <div
                        key={pId}
                        onClick={() => !isCurrent && setSelectedPlanId(pId)}
                        className={`p-5 rounded-xs border transition-all flex flex-col justify-between relative cursor-pointer ${
                          isCurrent
                            ? 'bg-[#121212] border-white/10 opacity-70 cursor-not-allowed'
                            : isSelected
                            ? 'bg-[#181818] border-gold shadow-[0_0_20px_rgba(201,169,107,0.15)] ring-1 ring-gold'
                            : 'bg-[#141414] border-white/10 hover:border-gold/40'
                        }`}
                      >
                        {p.badge && (
                          <div className="absolute -top-2.5 right-4 px-2 py-0.5 bg-gold text-black-matte text-[9px] font-sans font-bold uppercase tracking-wider">
                            {p.badge}
                          </div>
                        )}

                        <div className="space-y-3">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-ivory/50 font-mono">
                              {p.category === 'agencias' ? 'Plano Agência' : 'Plano Modelo'}
                            </span>
                            <h4 className="font-serif-lumiardi text-xl font-medium text-ivory">
                              {p.name}
                            </h4>
                          </div>

                          <div className="text-2xl font-serif-lumiardi text-gold">
                            R$ {pPrice.toFixed(2)}
                            <span className="text-[10px] text-ivory/50 font-sans ml-1">/mês</span>
                          </div>

                          <div className="pt-2 border-t border-white/10 space-y-2 text-[11px] font-sans text-ivory/70">
                            <div className="flex items-center gap-1.5 text-ivory">
                              <HardDrive className="w-3.5 h-3.5 text-gold shrink-0" />
                              <span>{p.limits.maxDriveStorageGB} GB de Drive</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-ivory">
                              <Search className="w-3.5 h-3.5 text-gold shrink-0" />
                              <span>{p.limits.maxScoutSearchesPerMonth === 'unlimited' ? 'Scout Ilimitado' : `${p.limits.maxScoutSearchesPerMonth} Buscas Scout/mês`}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-ivory/80">
                              <ShieldCheck className="w-3.5 h-3.5 text-gold shrink-0" />
                              <span>Blindagem & NDA</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-white/10">
                          {isCurrent ? (
                            <span className="block text-center text-xs font-sans uppercase font-bold text-ivory/40">
                              Plano Atual
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPlanId(pId);
                                setStep('pay');
                              }}
                              className={`w-full py-2 text-xs font-sans uppercase tracking-wider font-semibold transition-all rounded-xs cursor-pointer ${
                                isSelected
                                  ? 'bg-gold text-black-matte hover:bg-gold-light'
                                  : 'bg-white/5 text-ivory hover:bg-gold hover:text-black-matte border border-white/10'
                              }`}
                            >
                              Fazer Upgrade →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <span className="text-xs text-ivory/50 font-sans">
                    Plano selecionado: <strong className="text-gold">{selectedPlan.name}</strong> (R$ {priceBRL.toFixed(2)} / {isYearly ? 'ano' : 'mês'})
                  </span>
                  <button
                    onClick={() => setStep('pay')}
                    disabled={selectedPlanId === currentPlanId}
                    className="px-6 py-2.5 bg-gold hover:bg-gold-light text-black-matte font-semibold text-xs font-sans uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    <span>Prosseguir para Pagamento</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA 2: CHECKOUT & PAGAMENTO INSTANTÂNEO */}
            {step === 'pay' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-gold font-sans font-semibold">
                      Finalização do Upgrade
                    </span>
                    <h3 className="font-serif-lumiardi text-2xl font-light text-ivory">
                      Upgrade para Plano {selectedPlan.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => setStep('select')}
                    className="text-xs text-ivory/60 hover:text-gold font-sans underline cursor-pointer"
                  >
                    ← Trocar Plano
                  </button>
                </div>

                {/* Resumo Financeiro */}
                <div className="p-4 bg-[#141414] border border-gold/30 rounded-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs text-ivory/70 font-sans block">Total a Pagar Agora</span>
                    <span className="text-2xl font-serif-lumiardi text-gold font-bold">
                      R$ {priceBRL.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-ivory/50 font-sans ml-1">
                      ({isYearly ? 'Ciclo Anual com 20% OFF' : 'Ciclo Mensal'})
                    </span>
                  </div>
                  <div className="text-right text-xs font-sans text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Ativação Instantânea</span>
                  </div>
                </div>

                {/* Escolha do Método de Pagamento */}
                <div className="space-y-3">
                  <label className="block text-xs font-sans uppercase tracking-wider text-ivory/70">
                    Método de Pagamento
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('pix')}
                      className={`p-3 border rounded-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        paymentMethod === 'pix'
                          ? 'bg-gold/15 border-gold text-gold font-bold'
                          : 'bg-[#141414] border-white/10 text-ivory/60 hover:text-ivory'
                      }`}
                    >
                      <QrCode className="w-5 h-5" />
                      <span className="text-xs font-sans">Pix Instantâneo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 border rounded-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        paymentMethod === 'card'
                          ? 'bg-gold/15 border-gold text-gold font-bold'
                          : 'bg-[#141414] border-white/10 text-ivory/60 hover:text-ivory'
                      }`}
                    >
                      <CreditCard className="w-5 h-5" />
                      <span className="text-xs font-sans">Cartão de Crédito</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('crypto')}
                      className={`p-3 border rounded-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        paymentMethod === 'crypto'
                          ? 'bg-gold/15 border-gold text-gold font-bold'
                          : 'bg-[#141414] border-white/10 text-ivory/60 hover:text-ivory'
                      }`}
                    >
                      <Sparkles className="w-5 h-5" />
                      <span className="text-xs font-sans">Cripto (USDT)</span>
                    </button>
                  </div>
                </div>

                {/* Seção Pix */}
                {paymentMethod === 'pix' && (
                  <div className="p-5 bg-[#141414] border border-white/10 rounded-xs space-y-4 text-center">
                    <span className="text-xs font-sans text-ivory/80 block">
                      Escaneie o QR Code ou copie o código Pix para aprovação em tempo real:
                    </span>
                    <div className="w-44 h-44 mx-auto bg-white p-2 border-2 border-gold rounded-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={pixQrCodeUrl} alt="Pix QR Code" className="w-full h-full object-contain" />
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyPix}
                      className="px-4 py-2 bg-[#202020] hover:bg-[#2a2a2a] text-ivory border border-white/10 hover:border-gold text-xs font-sans flex items-center gap-2 mx-auto rounded-xs transition-colors cursor-pointer"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gold" />}
                      <span>{isCopied ? 'Chave Pix Copiada!' : 'Copiar Código Pix Copia e Cola'}</span>
                    </button>
                  </div>
                )}

                {/* Seção Cartão */}
                {paymentMethod === 'card' && (
                  <div className="p-5 bg-[#141414] border border-white/10 rounded-xs space-y-3">
                    <div>
                      <label className="block text-[11px] font-sans text-ivory/70 uppercase mb-1">
                        Número do Cartão
                      </label>
                      <input
                        type="text"
                        placeholder="•••• •••• •••• ••••"
                        value={cardData.number}
                        onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                        className="w-full bg-[#181818] border border-white/10 p-2.5 text-xs text-ivory focus:outline-none focus:border-gold font-sans rounded-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-sans text-ivory/70 uppercase mb-1">
                        Nome Impresso no Cartão
                      </label>
                      <input
                        type="text"
                        placeholder="NOME COMO NO CARTÃO"
                        value={cardData.name}
                        onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                        className="w-full bg-[#181818] border border-white/10 p-2.5 text-xs text-ivory focus:outline-none focus:border-gold font-sans rounded-xs uppercase"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-sans text-ivory/70 uppercase mb-1">
                          Validade (MM/AA)
                        </label>
                        <input
                          type="text"
                          placeholder="12/28"
                          value={cardData.expiry}
                          onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                          className="w-full bg-[#181818] border border-white/10 p-2.5 text-xs text-ivory focus:outline-none focus:border-gold font-sans rounded-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-sans text-ivory/70 uppercase mb-1">
                          CVV
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          placeholder="•••"
                          value={cardData.cvv}
                          onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                          className="w-full bg-[#181818] border border-white/10 p-2.5 text-xs text-ivory focus:outline-none focus:border-gold font-sans rounded-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Seção Cripto */}
                {paymentMethod === 'crypto' && (
                  <div className="p-5 bg-[#141414] border border-white/10 rounded-xs space-y-3 text-center">
                    <span className="text-xs font-sans text-ivory/80 block">
                      Transferência Segura USDT (TRC-20):
                    </span>
                    <div className="p-3 bg-[#181818] border border-gold/30 text-xs font-mono text-gold break-all rounded-xs">
                      TLUMiARdi9842XyZ10478aBcDeFgHiJkLmNo
                    </div>
                    <span className="text-[10px] text-ivory/50 font-sans block">
                      Validação automática na blockchain via NOWPayments
                    </span>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-3 bg-rose-950/60 border border-rose-600/50 text-rose-300 text-xs font-sans rounded-xs">
                    {errorMsg}
                  </div>
                )}

                {/* Botão de Finalização */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setStep('select')}
                    className="px-4 py-2.5 text-xs font-sans uppercase text-ivory/60 hover:text-ivory cursor-pointer"
                  >
                    Voltar
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmUpgrade}
                    disabled={isProcessing}
                    className="px-6 py-3 bg-gold hover:bg-gold-light text-black-matte font-semibold text-xs font-sans uppercase tracking-[0.2em] transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Processando & Ativando...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Confirmar & Ativar Upgrade Imediato</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA 3: SUCESSO & ATIVAÇÃO CONFIRMADA */}
            {step === 'success' && (
              <div className="py-8 text-center space-y-5 animate-in fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div className="space-y-2 max-w-md mx-auto">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-gold font-sans font-semibold">
                    Upgrade Concluído com Sucesso
                  </span>
                  <h3 className="font-serif-lumiardi text-3xl font-light text-ivory">
                    Bem-vindo(a) ao Plano {selectedPlan.name}!
                  </h3>
                  <p className="text-xs text-ivory/70 font-sans leading-relaxed">
                    Sua conta foi atualizada imediatamente. Todos os limites de armazenamento, propostas de scouting e recursos exclusivos do novo plano já estão disponíveis em todos os módulos.
                  </p>
                </div>

                <div className="p-4 bg-[#141414] border border-gold/30 rounded-xs max-w-sm mx-auto text-left space-y-2 text-xs font-sans">
                  <div className="flex justify-between">
                    <span className="text-ivory/60">Novo Armazenamento Drive:</span>
                    <strong className="text-gold">{selectedPlan.limits.maxDriveStorageGB} GB</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ivory/60">Consultas de Scouting:</span>
                    <strong className="text-gold">
                      {selectedPlan.limits.maxScoutSearchesPerMonth === 'unlimited' ? 'Ilimitadas' : `${selectedPlan.limits.maxScoutSearchesPerMonth} /mês`}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ivory/60">Recibo & Fatura Oficial:</span>
                    <span className="text-emerald-400 font-mono">Gerado ✓</span>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleCloseAll}
                    className="px-8 py-3 bg-gold hover:bg-gold-light text-black-matte font-semibold text-xs font-sans uppercase tracking-[0.2em] transition-all cursor-pointer shadow-lg rounded-xs"
                  >
                    Acessar Meu Painel Atualizado
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
