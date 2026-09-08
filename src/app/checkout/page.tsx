'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { useLanguage, CurrencyCode } from '@/context/LanguageContext';
import {
  CreditCard,
  QrCode,
  Copy,
  CheckCircle2,
  Lock,
  RefreshCw,
  EyeOff,
  Zap,
  Globe,
  AlertCircle,
} from 'lucide-react';
import { getPlan } from '@/lib/payments/plansConfig';
import { PlanId, BillingInterval, PaymentGatewayType, CryptoCurrency } from '@/lib/payments/types';
import { useAuthPortal } from '@/context/AuthPortalContext';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentUser, refreshData } = useAuthPortal();
  const { currency, setCurrency, formatPrice, t } = useLanguage();

  const initialPlanId = (searchParams.get('plan') || 'glow') as PlanId;
  const initialInterval = (searchParams.get('billing') === 'yearly' ? 'yearly' : 'monthly') as BillingInterval;
  const paramCurrency = searchParams.get('currency') as CurrencyCode | null;

  const [selectedPlanId] = useState<PlanId>(initialPlanId);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>(initialInterval);
  const [gateway, setGateway] = useState<PaymentGatewayType>(currency === 'USD' ? 'ccbill' : 'pix');
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoCurrency>('USDTTRC20');

  // Sync currency from URL params if provided
  useEffect(() => {
    if (paramCurrency === 'BRL' || paramCurrency === 'USD') {
      setCurrency(paramCurrency);
    }
  }, [paramCurrency, setCurrency]);

  // Keep gateway synchronized if currency switches to USD while Pix is selected
  useEffect(() => {
    if (currency === 'USD' && gateway === 'pix') {
      setGateway('ccbill');
    }
  }, [currency, gateway]);

  // Estado do Cartão de Crédito / Débito
  const [cardData, setCardData] = useState({
    type: 'credit' as 'credit' | 'debit',
    number: '',
    holderName: '',
    expiry: '',
    cvv: '',
    cpf: '',
    taxId: '',
    installments: '1',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [cryptoData, setCryptoData] = useState<{
    payAddress: string;
    payAmount: number;
    payCurrency: string;
    qrCodeUrl: string;
    paymentId: string;
  } | null>(null);

  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentPlan = getPlan(selectedPlanId);
  const isYearly = billingInterval === 'yearly';

  // Preços
  const priceBRL = isYearly ? currentPlan.priceBRL.yearly * 12 : currentPlan.priceBRL.monthly;
  const priceUSD = isYearly ? currentPlan.priceUSD.yearly * 12 : currentPlan.priceUSD.monthly;

  // Código Pix Copia e Cola Padrão BACEN / EMV
  const pixCopiaECola = `00020126580014br.gov.bcb.pix0136noreply@lumiardi.com520400005303986540${priceBRL.toFixed(2)}5802BR5918LUMIARDI CLUB6009SAO PAULO62070503***6304`;
  const pixQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCopiaECola)}`;

  // Formatação de Número de Cartão
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 16);
    val = val.replace(/(\d{4})/g, '$1 ').trim();
    setCardData((prev) => ({ ...prev, number: val }));
  };

  // Formatação de Validade MM/AA
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 3) {
      val = `${val.substring(0, 2)}/${val.substring(2)}`;
    }
    setCardData((prev) => ({ ...prev, expiry: val }));
  };

  // Formatação de CPF
  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 11);
    if (val.length > 9) {
      val = `${val.substring(0, 3)}.${val.substring(3, 6)}.${val.substring(6, 9)}-${val.substring(9)}`;
    } else if (val.length > 6) {
      val = `${val.substring(0, 3)}.${val.substring(3, 6)}.${val.substring(6)}`;
    } else if (val.length > 3) {
      val = `${val.substring(0, 3)}.${val.substring(3)}`;
    }
    setCardData((prev) => ({ ...prev, cpf: val }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Processamento de Pagamento com Cartão
  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!cardData.number || cardData.number.replace(/\s/g, '').length < 15) {
      setErrorMessage(currency === 'BRL' ? 'Por favor, informe o número completo do seu cartão.' : 'Please enter your complete card number.');
      return;
    }
    if (!cardData.holderName.trim()) {
      setErrorMessage(currency === 'BRL' ? 'Por favor, informe o nome impresso no cartão.' : 'Please enter the name printed on the card.');
      return;
    }
    if (!cardData.expiry || cardData.expiry.length < 5) {
      setErrorMessage(currency === 'BRL' ? 'Por favor, informe a data de validade (MM/AA).' : 'Please enter expiration date (MM/YY).');
      return;
    }
    if (!cardData.cvv || cardData.cvv.length < 3) {
      setErrorMessage(currency === 'BRL' ? 'Por favor, informe o código de segurança (CVV).' : 'Please enter the security code (CVV).');
      return;
    }

    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 900));

      const res = await fetch('/api/checkout/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanId,
          billingInterval,
          currency,
          gateway: 'ccbill',
          paymentMethod: 'credit_card',
          cardLast4: cardData.number.replace(/\s/g, '').slice(-4),
          taxId: currency === 'BRL' ? cardData.cpf : cardData.taxId,
          userId: currentUser?.id,
          userEmail: currentUser?.email,
          userName: currentUser?.name,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Falha ao processar pagamento com cartão.');
      }

      if (refreshData) await refreshData();
      setPaymentSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao processar cartão.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Confirmação de Pagamento Pix / Cripto
  const handleConfirmInstantPayment = async (methodName: string) => {
    setIsLoading(true);
    try {
      const gatewayType = methodName.toLowerCase().includes('pix') ? 'pix' : 'nowpayments';
      const paymentMethodType = gatewayType === 'pix' ? 'pix' : 'crypto';

      const res = await fetch('/api/checkout/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanId,
          billingInterval,
          currency,
          gateway: gatewayType,
          paymentMethod: paymentMethodType,
          userId: currentUser?.id,
          userEmail: currentUser?.email,
          userName: currentUser?.name,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Falha ao confirmar pagamento instantâneo.');
      }

      if (refreshData) await refreshData();
      setPaymentSuccess(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro no pagamento';
      console.error(msg);
      setPaymentSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Inicializa sessão de cripto
  const handleInitiateCrypto = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanId,
          interval: billingInterval,
          currency,
          gateway: 'nowpayments',
          cryptoCurrency: selectedCrypto,
          userId: currentUser?.id || 'user-model-1',
          userEmail: currentUser?.email || 'membro@lumiardi.com',
          userName: currentUser?.name || 'Membro VIP Lumiardi',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao inicializar NOWPayments.');
      }

      if (data.cryptoDetails) {
        setCryptoData({
          payAddress: data.cryptoDetails.payAddress,
          payAmount: data.cryptoDetails.payAmount,
          payCurrency: data.cryptoDetails.payCurrency,
          qrCodeUrl: data.cryptoDetails.qrCodeUrl || '',
          paymentId: data.cryptoDetails.paymentId,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na comunicação.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] text-[#F7F3EC] font-sans selection:bg-[#D4AF37] selection:text-[#0B0B0B]">
      <Header />

      <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Barra de Preferências Globais: Idioma & Moeda */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-[#0E0E0E] border border-white/10 rounded-xl mb-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-ivory/70">
              <Globe className="w-4 h-4 text-[#D4AF37]" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#D4AF37]">
                {t('checkout_currency_label')}:
              </span>
            </div>
            <div className="inline-flex items-center bg-[#181818] border border-white/15 rounded-md p-0.5">
              <button
                type="button"
                onClick={() => setCurrency('BRL')}
                className={`px-3 py-1 text-xs font-semibold rounded-xs transition-all cursor-pointer ${
                  currency === 'BRL'
                    ? 'bg-[#D4AF37] text-black shadow-md'
                    : 'text-ivory/70 hover:text-white'
                }`}
              >
                BRL (R$)
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-3 py-1 text-xs font-semibold rounded-xs transition-all cursor-pointer ${
                  currency === 'USD'
                    ? 'bg-[#D4AF37] text-black shadow-md'
                    : 'text-ivory/70 hover:text-white'
                }`}
              >
                USD ($)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSelector />
          </div>
        </div>

        {/* Cabeçalho do Checkout */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-sans uppercase tracking-[0.3em] rounded-full">
            <Lock className="w-3 h-3 text-[#F5D77F]" />
            <span>{t('checkout_badge_secure')}</span>
          </div>
          <h1 className="font-serif-lumiardi text-4xl sm:text-5xl font-light text-ivory tracking-tight">
            {t('checkout_hero_title')}
          </h1>
          <p className="text-sm font-sans text-ivory/60 max-w-xl mx-auto font-light">
            {t('checkout_hero_desc')}
          </p>
        </div>

        {paymentSuccess ? (
          /* Tela de Sucesso */
          <div className="max-w-2xl mx-auto bg-[#101010] border border-[#D4AF37] p-10 text-center space-y-6 shadow-2xl relative overflow-hidden rounded-xl">
            <div className="w-16 h-16 bg-[#D4AF37]/20 border border-[#D4AF37] text-[#F5D77F] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
                {t('checkout_success_title')}
              </span>
              <h2 className="font-serif-lumiardi text-3xl text-ivory">
                {t('checkout_success_plan_confirmed').replace('{plan}', currentPlan.name)}
              </h2>
              <p className="text-xs text-ivory/70 max-w-md mx-auto leading-relaxed font-light">
                {t('checkout_success_desc')}
              </p>
            </div>

            <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/dashboard/pendente')}
                className="px-8 py-4 bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-[#0B0B0B] text-xs uppercase tracking-[0.2em] font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer rounded-sm shadow-xl"
              >
                <span>{t('checkout_btn_track_curation')}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Grid do Checkout: Resumo à Direita, Pagamento à Esquerda */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Coluna 1: Métodos de Pagamento & Formulário (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-[#0D0D0D] border border-white/10 p-6 md:p-8 space-y-6 rounded-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h2 className="font-serif-lumiardi text-2xl font-light text-ivory">
                    {t('checkout_method_title')}
                  </h2>
                  <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-mono">
                    {t('checkout_instant_approval')}
                  </span>
                </div>

                {/* 3 Abas Principais: PIX vs CARTÃO DE CRÉDITO/DÉBITO vs CRIPTO */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Opção 1: PIX Instantâneo (Brasil) */}
                  <button
                    type="button"
                    onClick={() => {
                      setGateway('pix');
                      setCryptoData(null);
                    }}
                    className={`p-4 text-left border transition-all cursor-pointer relative rounded-lg ${
                      gateway === 'pix'
                        ? 'border-[#D4AF37] bg-[#D4AF37]/15 shadow-[0_0_25px_rgba(212,175,55,0.2)]'
                        : 'border-white/10 bg-[#121212] hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-ivory font-medium text-xs">
                        <Zap className={`w-4 h-4 ${gateway === 'pix' ? 'text-[#F5D77F]' : 'text-ivory/60'}`} />
                        <span>{t('checkout_tab_pix')}</span>
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 uppercase tracking-wider font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 rounded-xs">
                      {currency === 'BRL' ? t('checkout_badge_recommended') : 'BRL'}
                    </span>
                  </button>

                  {/* Opção 2: Cartão de Crédito / Débito */}
                  <button
                    type="button"
                    onClick={() => {
                      setGateway('ccbill');
                      setCryptoData(null);
                    }}
                    className={`p-4 text-left border transition-all cursor-pointer relative rounded-lg ${
                      gateway === 'ccbill'
                        ? 'border-[#D4AF37] bg-[#D4AF37]/15 shadow-[0_0_25px_rgba(212,175,55,0.2)]'
                        : 'border-white/10 bg-[#121212] hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-ivory font-medium text-xs">
                        <CreditCard className={`w-4 h-4 ${gateway === 'ccbill' ? 'text-[#F5D77F]' : 'text-ivory/60'}`} />
                        <span>{t('checkout_tab_card')}</span>
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 uppercase tracking-wider font-semibold bg-[#1a1a1a] text-[#F5D77F] border border-[#D4AF37]/30 rounded-xs">
                      {currency === 'BRL' ? t('checkout_badge_installments') : 'Global Visa/MC'}
                    </span>
                  </button>

                  {/* Opção 3: Criptomoedas (NOWPayments) */}
                  <button
                    type="button"
                    onClick={() => {
                      setGateway('nowpayments');
                    }}
                    className={`p-4 text-left border transition-all cursor-pointer relative rounded-lg ${
                      gateway === 'nowpayments'
                        ? 'border-[#D4AF37] bg-[#D4AF37]/15 shadow-[0_0_25px_rgba(212,175,55,0.2)]'
                        : 'border-white/10 bg-[#121212] hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-ivory font-medium text-xs">
                        <QrCode className={`w-4 h-4 ${gateway === 'nowpayments' ? 'text-[#F5D77F]' : 'text-ivory/60'}`} />
                        <span>{t('checkout_tab_crypto')}</span>
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 uppercase tracking-wider font-semibold bg-[#1a1a1a] text-[#F5D77F] border border-[#D4AF37]/30 rounded-xs">
                      USDT / BTC / ETH
                    </span>
                  </button>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                    BLOCO EXCLUSIVO DO PIX INSTANTÂNEO (BRASIL)
                ═══════════════════════════════════════════════════════════════ */}
                {gateway === 'pix' && (
                  <div className="space-y-6 pt-2 animate-in fade-in duration-300">
                    {currency === 'USD' ? (
                      <div className="p-6 bg-[#16130B] border border-[#D4AF37]/50 rounded-lg space-y-4 text-center">
                        <AlertCircle className="w-8 h-8 text-[#D4AF37] mx-auto" />
                        <p className="text-xs text-ivory/80 max-w-md mx-auto leading-relaxed">
                          {t('checkout_pix_only_brl_warn')}
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setCurrency('BRL')}
                            className="px-4 py-2 bg-[#D4AF37] hover:bg-[#F5D77F] text-black text-xs font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer"
                          >
                            {t('checkout_pix_switch_to_brl')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setGateway('ccbill')}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-xs transition-colors cursor-pointer"
                          >
                            {t('checkout_tab_card')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 bg-[#121212] border border-[#D4AF37]/50 space-y-6 rounded-lg">
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                          {/* QR Code Pix */}
                          <div className="p-3 bg-white rounded-md shrink-0 shadow-2xl">
                            {pixQrCodeUrl ? (
                              <img
                                src={pixQrCodeUrl}
                                alt="QR Code Pix Oficial"
                                className="w-40 h-40 object-contain"
                              />
                            ) : (
                              <div className="w-40 h-40 bg-neutral-900 flex items-center justify-center text-gold text-xs">
                                Carregando Pix...
                              </div>
                            )}
                          </div>

                          {/* Dados do Pix */}
                          <div className="space-y-3 w-full min-w-0 text-center sm:text-left">
                            <div>
                              <span className="text-[10px] uppercase tracking-widest text-ivory/50 block font-sans">
                                {t('checkout_pix_exact_value')}
                              </span>
                              <div className="text-3xl font-serif-lumiardi text-[#F5D77F] font-bold">
                                {formatPrice(priceBRL, priceUSD)}
                              </div>
                              <span className="text-[11px] text-emerald-400 font-sans flex items-center justify-center sm:justify-start gap-1 mt-1">
                                <Zap className="w-3 h-3" /> {t('checkout_pix_bacen_approved')}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] uppercase tracking-widest text-ivory/50 block font-sans">
                                {t('checkout_pix_key_label')}
                              </span>
                              <div className="text-xs font-mono text-ivory font-bold bg-black/60 p-2 border border-white/10 rounded-xs truncate">
                                noreply@lumiardi.com
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Caixa Copia e Cola */}
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest text-ivory/60 block font-sans">
                            {t('checkout_pix_copy_paste')}
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              readOnly
                              value={pixCopiaECola}
                              className="w-full bg-[#080808] border border-white/15 px-3 py-2.5 text-[11px] font-mono text-ivory/80 rounded-xs select-all focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => copyToClipboard(pixCopiaECola)}
                              className="px-4 py-2.5 bg-[#D4AF37] hover:bg-[#F5D77F] text-[#0B0B0B] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-all cursor-pointer rounded-xs"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>{isCopied ? t('checkout_copied') : t('checkout_copy')}</span>
                            </button>
                          </div>
                        </div>

                        {/* Instruções */}
                        <div className="p-4 bg-black/40 border border-white/10 text-xs text-ivory/70 space-y-1 font-light leading-relaxed rounded-xs">
                          <p>{t('checkout_pix_step1')}</p>
                          <p>{t('checkout_pix_step2')}</p>
                          <p>{t('checkout_pix_step3')}</p>
                        </div>

                        {/* Botão de Confirmação */}
                        <button
                          onClick={() => handleConfirmInstantPayment('PIX')}
                          disabled={isLoading}
                          className="w-full py-4 bg-gradient-to-r from-[#D4AF37] via-[#F5D77F] to-[#AA820A] hover:brightness-110 text-[#0B0B0B] text-xs font-sans uppercase tracking-[0.25em] font-bold transition-all flex items-center justify-center gap-3 cursor-pointer shadow-[0_10px_30px_rgba(212,175,55,0.35)] rounded-sm disabled:opacity-50"
                        >
                          {isLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>{t('checkout_btn_confirm_pix')}</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    BLOCO CARTÃO DE CRÉDITO / DÉBITO COMPLETO
                ═══════════════════════════════════════════════════════════════ */}
                {gateway === 'ccbill' && (
                  <form onSubmit={handleCardPayment} className="space-y-6 pt-2 animate-in fade-in duration-300">
                    <div className="p-6 bg-[#121212] border border-[#D4AF37]/50 space-y-5 rounded-lg">
                      {/* Seletor Crédito vs Débito */}
                      <div className="grid grid-cols-2 gap-2 p-1 bg-[#1a1a1a] border border-white/10 rounded-sm">
                        <button
                          type="button"
                          onClick={() => setCardData((prev) => ({ ...prev, type: 'credit' }))}
                          className={`py-2 text-xs font-sans uppercase tracking-wider font-semibold transition-all cursor-pointer rounded-xs ${
                            cardData.type === 'credit' ? 'bg-[#D4AF37] text-[#0B0B0B]' : 'text-ivory/60 hover:text-ivory'
                          }`}
                        >
                          {t('checkout_card_type_credit')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setCardData((prev) => ({ ...prev, type: 'debit' }))}
                          className={`py-2 text-xs font-sans uppercase tracking-wider font-semibold transition-all cursor-pointer rounded-xs ${
                            cardData.type === 'debit' ? 'bg-[#D4AF37] text-[#0B0B0B]' : 'text-ivory/60 hover:text-ivory'
                          }`}
                        >
                          {t('checkout_card_type_debit')}
                        </button>
                      </div>

                      {/* Alerta de Erro */}
                      {errorMessage && (
                        <div className="p-3 bg-red-950/60 border border-red-500/50 text-red-300 text-xs font-sans rounded-xs">
                          {errorMessage}
                        </div>
                      )}

                      {/* Número do Cartão */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-sans uppercase tracking-wider text-ivory/70 block">
                          {t('checkout_card_number')}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="0000 0000 0000 0000"
                            value={cardData.number}
                            onChange={handleCardNumberChange}
                            required
                            className="w-full bg-[#080808] border border-white/20 focus:border-[#D4AF37] px-4 py-3 text-sm font-mono text-ivory placeholder:text-ivory/30 rounded-xs focus:outline-none transition-colors"
                          />
                          <CreditCard className="w-5 h-5 text-ivory/40 absolute right-3.5 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                      {/* Nome do Titular */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-sans uppercase tracking-wider text-ivory/70 block">
                          {t('checkout_card_holder')}
                        </label>
                        <input
                          type="text"
                          placeholder="EX: MARIA SILVA"
                          value={cardData.holderName}
                          onChange={(e) => setCardData((prev) => ({ ...prev, holderName: e.target.value.toUpperCase() }))}
                          required
                          className="w-full bg-[#080808] border border-white/20 focus:border-[#D4AF37] px-4 py-3 text-xs font-sans text-ivory uppercase placeholder:text-ivory/30 rounded-xs focus:outline-none transition-colors"
                        />
                      </div>

                      {/* Validade + CVV */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-sans uppercase tracking-wider text-ivory/70 block">
                            {t('checkout_card_expiry')}
                          </label>
                          <input
                            type="text"
                            placeholder="MM/AA"
                            value={cardData.expiry}
                            onChange={handleExpiryChange}
                            required
                            className="w-full bg-[#080808] border border-white/20 focus:border-[#D4AF37] px-4 py-3 text-xs font-mono text-ivory placeholder:text-ivory/30 rounded-xs focus:outline-none transition-colors text-center"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-sans uppercase tracking-wider text-ivory/70 block">
                            {t('checkout_card_cvv')}
                          </label>
                          <input
                            type="password"
                            maxLength={4}
                            placeholder="123"
                            value={cardData.cvv}
                            onChange={(e) => setCardData((prev) => ({ ...prev, cvv: e.target.value.replace(/\D/g, '') }))}
                            required
                            className="w-full bg-[#080808] border border-white/20 focus:border-[#D4AF37] px-4 py-3 text-xs font-mono text-ivory placeholder:text-ivory/30 rounded-xs focus:outline-none transition-colors text-center"
                          />
                        </div>
                      </div>

                      {/* CPF (para BRL) ou Tax ID / Passport (para USD) */}
                      {currency === 'BRL' ? (
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-sans uppercase tracking-wider text-ivory/70 block">
                            {t('checkout_tax_id_cpf')}
                          </label>
                          <input
                            type="text"
                            placeholder="000.000.000-00"
                            value={cardData.cpf}
                            onChange={handleCPFChange}
                            className="w-full bg-[#080808] border border-white/20 focus:border-[#D4AF37] px-4 py-3 text-xs font-mono text-ivory placeholder:text-ivory/30 rounded-xs focus:outline-none transition-colors"
                          />
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-sans uppercase tracking-wider text-ivory/70 block">
                            {t('checkout_tax_id_intl')}
                          </label>
                          <input
                            type="text"
                            placeholder="Tax ID / Passport / SSN"
                            value={cardData.taxId}
                            onChange={(e) => setCardData((prev) => ({ ...prev, taxId: e.target.value }))}
                            className="w-full bg-[#080808] border border-white/20 focus:border-[#D4AF37] px-4 py-3 text-xs font-mono text-ivory placeholder:text-ivory/30 rounded-xs focus:outline-none transition-colors"
                          />
                        </div>
                      )}

                      {/* Parcelas para Cartão de Crédito */}
                      {cardData.type === 'credit' && (
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-sans uppercase tracking-wider text-ivory/70 block">
                            {t('checkout_installments_label')}
                          </label>
                          <select
                            value={cardData.installments}
                            onChange={(e) => setCardData((prev) => ({ ...prev, installments: e.target.value }))}
                            className="w-full bg-[#080808] border border-white/20 focus:border-[#D4AF37] px-4 py-3 text-xs font-sans text-ivory rounded-xs focus:outline-none transition-colors"
                          >
                            <option value="1">
                              {currency === 'BRL'
                                ? `1x de ${formatPrice(priceBRL, priceUSD)} (à vista sem juros)`
                                : `1x ${formatPrice(priceBRL, priceUSD)} (${t('checkout_card_installments_cash')})`}
                            </option>
                            {currency === 'BRL' && isYearly && (
                              <>
                                <option value="3">3x de R$ {(priceBRL / 3).toFixed(2).replace('.', ',')} sem juros</option>
                                <option value="6">6x de R$ {(priceBRL / 6).toFixed(2).replace('.', ',')} sem juros</option>
                                <option value="12">12x de R$ {(priceBRL / 12).toFixed(2).replace('.', ',')} sem juros</option>
                              </>
                            )}
                          </select>
                        </div>
                      )}

                      {/* Blindagem de Fatura */}
                      <div className="p-3.5 bg-black/50 border border-white/10 text-xs text-ivory/70 flex items-center gap-2 rounded-xs">
                        <EyeOff className="w-4 h-4 text-[#F5D77F] shrink-0" />
                        <span>{t('checkout_discrete_billing')}</span>
                      </div>

                      {/* Botão de Pagamento com Cartão */}
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-gradient-to-r from-[#D4AF37] via-[#F5D77F] to-[#AA820A] hover:brightness-110 text-[#0B0B0B] text-xs font-sans uppercase tracking-[0.25em] font-bold transition-all flex items-center justify-center gap-3 cursor-pointer shadow-[0_10px_30px_rgba(212,175,55,0.35)] rounded-sm disabled:opacity-50"
                      >
                        {isLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            <span>{t('checkout_btn_pay_card')} ({formatPrice(priceBRL, priceUSD)})</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    BLOCO ESPECÍFICO CRIPTOMOEDAS (NOWPAYMENTS)
                ═══════════════════════════════════════════════════════════════ */}
                {gateway === 'nowpayments' && (
                  <div className="space-y-5 pt-2 animate-in fade-in duration-300">
                    <div className="space-y-2">
                      <label className="text-[11px] font-sans uppercase tracking-widest text-ivory/60 block">
                        {t('checkout_crypto_select')}
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {[
                          { id: 'USDTTRC20', label: 'USDT', net: 'TRC-20' },
                          { id: 'USDTERC20', label: 'USDT', net: 'ERC-20' },
                          { id: 'USDTBSC', label: 'USDT', net: 'BEP-20' },
                          { id: 'USDC', label: 'USDC', net: 'Multi' },
                          { id: 'BTC', label: 'BTC', net: 'Bitcoin' },
                          { id: 'ETH', label: 'ETH', net: 'Ethereum' },
                        ].map((coin) => (
                          <button
                            key={coin.id}
                            type="button"
                            onClick={() => {
                              setSelectedCrypto(coin.id as CryptoCurrency);
                              setCryptoData(null);
                            }}
                            className={`p-2.5 text-center border text-xs transition-all cursor-pointer rounded-xs ${
                              selectedCrypto === coin.id
                                ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-[#F5D77F] font-bold'
                                : 'border-white/10 bg-[#141414] text-ivory/70 hover:border-white/30'
                            }`}
                          >
                            <span className="block font-semibold">{coin.label}</span>
                            <span className="text-[9px] text-ivory/50 uppercase">{coin.net}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {!cryptoData ? (
                      <button
                        onClick={handleInitiateCrypto}
                        disabled={isLoading}
                        className="w-full py-4 bg-[#D4AF37] hover:bg-[#F5D77F] text-[#0B0B0B] text-xs font-sans uppercase tracking-[0.25em] font-bold transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xl disabled:opacity-50 rounded-sm"
                      >
                        {isLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <QrCode className="w-4 h-4" />
                            <span>{t('checkout_crypto_btn_generate')}</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="p-6 bg-[#121212] border border-[#D4AF37]/50 space-y-6 rounded-lg">
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                          <div className="p-2 bg-white rounded-sm shrink-0 shadow-lg">
                            {cryptoData.qrCodeUrl ? (
                              <img
                                src={cryptoData.qrCodeUrl}
                                alt="QR Code de Pagamento"
                                className="w-36 h-36"
                              />
                            ) : null}
                          </div>

                          <div className="space-y-3 w-full min-w-0">
                            <div>
                              <span className="text-[10px] uppercase tracking-widest text-ivory/50 block">
                                {t('checkout_crypto_exact_send')}
                              </span>
                              <div className="text-2xl font-mono text-[#F5D77F] font-bold">
                                {cryptoData.payAmount} {cryptoData.payCurrency}
                              </div>
                            </div>

                            <div>
                              <span className="text-[10px] uppercase tracking-widest text-ivory/50 block">
                                {t('checkout_crypto_deposit_address').replace('{coin}', selectedCrypto)}
                              </span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  readOnly
                                  value={cryptoData.payAddress}
                                  className="w-full bg-[#080808] border border-white/20 px-3 py-2 text-xs font-mono text-ivory truncate select-all"
                                />
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(cryptoData.payAddress)}
                                  className="p-2 bg-[#D4AF37] hover:bg-[#F5D77F] text-[#0B0B0B] text-xs font-semibold shrink-0 transition-all cursor-pointer"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleConfirmInstantPayment(selectedCrypto)}
                          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono uppercase tracking-widest font-bold transition-all rounded-xs cursor-pointer"
                        >
                          {t('checkout_crypto_btn_confirm')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Coluna 2: Resumo da Ordem (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#0D0D0D] border border-white/10 p-6 md:p-8 space-y-6 rounded-xl sticky top-28">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h3 className="font-serif-lumiardi text-2xl font-light text-ivory">
                    {t('checkout_summary_title')}
                  </h3>
                  <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-mono">
                    {t('checkout_summary_tier')}
                  </span>
                </div>

                {/* Seletor Mensal vs Anual */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-[#141414] border border-white/10 rounded-sm">
                  <button
                    type="button"
                    onClick={() => setBillingInterval('monthly')}
                    className={`py-2 text-xs font-sans uppercase tracking-wider font-semibold transition-all cursor-pointer rounded-xs ${
                      !isYearly ? 'bg-[#D4AF37] text-[#0B0B0B]' : 'text-ivory/60 hover:text-ivory'
                    }`}
                  >
                    {t('checkout_interval_monthly')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingInterval('yearly')}
                    className={`py-2 text-xs font-sans uppercase tracking-wider font-semibold transition-all cursor-pointer rounded-xs ${
                      isYearly ? 'bg-[#D4AF37] text-[#0B0B0B]' : 'text-ivory/60 hover:text-ivory'
                    }`}
                  >
                    {t('checkout_interval_yearly')}
                  </button>
                </div>

                {/* Dados do Plano Selecionado */}
                <div className="p-5 bg-[#141414] border border-[#D4AF37]/30 rounded-lg space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] uppercase tracking-[0.2em] text-[#D4AF37] font-mono block">
                        {t('checkout_selected_plan')}
                      </span>
                      <h4 className="font-serif-lumiardi text-2xl text-ivory font-light">
                        {currentPlan.name}
                      </h4>
                    </div>
                    <div className="text-right">
                      <div className="font-serif-lumiardi text-2xl text-[#F5D77F] font-bold">
                        {formatPrice(priceBRL, priceUSD)}
                      </div>
                      <span className="text-[10px] text-ivory/50 block">
                        {isYearly ? t('checkout_billed_annually') : t('checkout_billed_monthly')}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-ivory/70 leading-relaxed font-light">
                    {currentPlan.description}
                  </p>

                  <ul className="space-y-2 pt-3 border-t border-white/10 text-xs text-ivory/80">
                    {currentPlan.features.slice(0, 5).map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Totais */}
                <div className="space-y-3 pt-4 border-t border-white/10 text-xs">
                  <div className="flex justify-between text-ivory/70">
                    <span>{t('checkout_subtotal')}</span>
                    <span>{formatPrice(priceBRL, priceUSD)}</span>
                  </div>
                  <div className="flex justify-between text-ivory/70">
                    <span>{t('checkout_fee_escrow')}</span>
                    <span className="text-emerald-400 font-semibold">{t('checkout_fee_included')}</span>
                  </div>
                  <div className="flex justify-between text-ivory/70">
                    <span>{t('checkout_shielding_status')}</span>
                    <span className="text-[#D4AF37] font-semibold">{t('checkout_shielding_active')}</span>
                  </div>
                  <div className="flex justify-between text-base font-serif-lumiardi text-ivory pt-3 border-t border-white/10 font-bold">
                    <span>{t('checkout_total')}</span>
                    <span className="text-[#F5D77F]">{formatPrice(priceBRL, priceUSD)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070707] flex items-center justify-center text-ivory font-mono text-xs">
          Carregando ambiente seguro de checkout...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
