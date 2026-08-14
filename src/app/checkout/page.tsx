'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import {
  ShieldCheck,
  CreditCard,
  QrCode,
  Copy,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  ExternalLink,
  RefreshCw,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { LUMIARDI_PLANS, getPlan } from '@/lib/payments/plansConfig';
import { PlanId, BillingInterval, PaymentGatewayType, CryptoCurrency } from '@/lib/payments/types';
import { useAuthPortal } from '@/context/AuthPortalContext';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentUser } = useAuthPortal();

  const initialPlanId = (searchParams.get('plan') || 'radiance') as PlanId;
  const initialCategory = searchParams.get('category') === 'agencias' ? 'agencias' : 'criadoras';

  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>(initialPlanId);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [gateway, setGateway] = useState<PaymentGatewayType>('ccbill');
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoCurrency>('USDTTRC20');

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

  // Cálculo de Preços
  const priceBRL = isYearly ? currentPlan.priceBRL.yearly * 12 : currentPlan.priceBRL.monthly;
  const priceUSD = isYearly ? currentPlan.priceUSD.yearly * 12 : currentPlan.priceUSD.monthly;

  // Inicializa sessão de checkout
  const handleInitiatePayment = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanId,
          interval: billingInterval,
          gateway,
          cryptoCurrency: selectedCrypto,
          userId: currentUser?.id || 'user-model-1',
          userEmail: currentUser?.email || 'membro@lumiardi.com',
          userName: currentUser?.name || 'Membro VIP Lumiardi',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao inicializar o gateway de pagamento.');
      }

      if (gateway === 'ccbill' && data.redirectUrl) {
        // Redireciona para o FlexForms CCBill em ambiente de produção ou abre em nova aba
        window.location.href = data.redirectUrl;
      } else if (gateway === 'nowpayments' && data.cryptoDetails) {
        setCryptoData({
          payAddress: data.cryptoDetails.payAddress,
          payAmount: data.cryptoDetails.payAmount,
          payCurrency: data.cryptoDetails.payCurrency,
          qrCodeUrl: data.cryptoDetails.qrCodeUrl || '',
          paymentId: data.cryptoDetails.paymentId,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na comunicação com o gateway.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Simulação de confirmação instantânea para visualização do usuário
  const handleSimulateConfirmation = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/webhooks/nowpayments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_status: 'finished',
          payment_id: cryptoData?.paymentId || `pay_${Date.now()}`,
          order_description: `Plano ${currentPlan.name} ${billingInterval === 'yearly' ? 'Anual' : 'Mensal'}`,
          price_amount: priceUSD,
          pay_currency: selectedCrypto,
          pay_address: cryptoData?.payAddress,
          userId: currentUser?.id || 'user-model-1',
        }),
      });

      setPaymentSuccess(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] text-[#F7F3EC] font-sans selection:bg-[#C9A96B] selection:text-[#0B0B0B]">
      <Header />

      <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Cabeçalho do Checkout */}
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C9A96B]/10 border border-[#C9A96B]/30 text-[#C9A96B] text-[10px] font-sans uppercase tracking-[0.3em]">
            <Lock className="w-3 h-3" />
            <span>Ambiente Blindado & Criptografia Militar AES-256</span>
          </div>
          <h1 className="font-serif-lumiardi text-4xl sm:text-5xl font-light text-ivory tracking-tight">
            Checkout de Alta Performance
          </h1>
          <p className="text-sm font-sans text-ivory/60 max-w-xl mx-auto font-light">
            Selecione a forma de liquidação preferida para ativação imediata do seu status VIP.
          </p>
        </div>

        {paymentSuccess ? (
          /* Tela de Sucesso */
          <div className="max-w-2xl mx-auto bg-[#101010] border border-[#C9A96B] p-10 text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 bg-[#C9A96B]/20 border border-[#C9A96B] text-[#C9A96B] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#C9A96B] font-semibold">
                Transação Confirmada com Sucesso
              </span>
              <h2 className="font-serif-lumiardi text-3xl text-ivory">
                Bem-vindo ao Nível {currentPlan.name}
              </h2>
              <p className="text-xs text-ivory/70 max-w-md mx-auto leading-relaxed">
                Sua credencial exclusiva foi ativada. Suas cotas de armazenamento, visibilidade e ferramentas corporativas já estão liberadas no painel.
              </p>
            </div>

            <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/dashboard/billing')}
                className="px-6 py-3.5 bg-[#C9A96B] text-[#0B0B0B] text-xs uppercase tracking-[0.2em] font-semibold hover:bg-[#D4B87A] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Acessar Portal de Faturamento</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3.5 bg-transparent border border-white/20 text-ivory/80 text-xs uppercase tracking-[0.2em] font-medium hover:border-[#C9A96B] hover:text-[#C9A96B] transition-all"
              >
                <span>Ir para o Dashboard</span>
              </button>
            </div>
          </div>
        ) : (
          /* Grid do Checkout: Resumo à Direita, Pagamento à Esquerda */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Coluna 1: Métodos de Pagamento & Formulário (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Seletor de Gateway (CCBill vs NOWPayments) */}
              <div className="bg-[#0D0D0D] border border-white/10 p-6 md:p-8 space-y-6 rounded-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h2 className="font-serif-lumiardi text-2xl font-light text-ivory">
                    Método de Liquidação
                  </h2>
                  <span className="text-[10px] uppercase tracking-widest text-[#C9A96B] font-mono">
                    Multi-Gateway Ativo
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Opção 1: Cartão de Crédito (CCBill) */}
                  <button
                    type="button"
                    onClick={() => {
                      setGateway('ccbill');
                      setCryptoData(null);
                    }}
                    className={`p-5 text-left border transition-all cursor-pointer relative ${
                      gateway === 'ccbill'
                        ? 'border-[#C9A96B] bg-[#C9A96B]/10 shadow-[0_0_20px_rgba(201,169,107,0.15)]'
                        : 'border-white/10 bg-[#121212] hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5 text-ivory font-medium text-sm">
                        <CreditCard className={`w-5 h-5 ${gateway === 'ccbill' ? 'text-[#C9A96B]' : 'text-ivory/60'}`} />
                        <span>Cartão Internacional</span>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 uppercase tracking-wider font-semibold bg-[#1a1a1a] text-[#C9A96B] border border-[#C9A96B]/30">
                        CCBill High-Risk
                      </span>
                    </div>
                    <p className="text-[11px] text-ivory/60 font-sans leading-relaxed">
                      Processamento seguro com fatura discreta. Aceita Visa, MasterCard, JCB e Discover.
                    </p>
                  </button>

                  {/* Opção 2: Criptomoedas (NOWPayments) */}
                  <button
                    type="button"
                    onClick={() => setGateway('nowpayments')}
                    className={`p-5 text-left border transition-all cursor-pointer relative ${
                      gateway === 'nowpayments'
                        ? 'border-[#C9A96B] bg-[#C9A96B]/10 shadow-[0_0_20px_rgba(201,169,107,0.15)]'
                        : 'border-white/10 bg-[#121212] hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5 text-ivory font-medium text-sm">
                        <QrCode className={`w-5 h-5 ${gateway === 'nowpayments' ? 'text-[#C9A96B]' : 'text-ivory/60'}`} />
                        <span>Web3 / Cripto Instant</span>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 uppercase tracking-wider font-semibold bg-[#1a1a1a] text-emerald-400 border border-emerald-500/30">
                        NOWPayments
                      </span>
                    </div>
                    <p className="text-[11px] text-ivory/60 font-sans leading-relaxed">
                      Liquidação anônima e sem custódia via USDT (TRC20/ERC20/BSC), USDC, BTC ou ETH.
                    </p>
                  </button>
                </div>

                {/* Bloco Específico CCBill */}
                {gateway === 'ccbill' && (
                  <div className="space-y-4 pt-2">
                    <div className="p-4 bg-[#141414] border border-white/10 space-y-2 rounded-xs">
                      <div className="flex items-center gap-2 text-xs font-medium text-[#C9A96B]">
                        <EyeOff className="w-4 h-4" />
                        <span>Blindagem de Fatura & Sigilo Garantido</span>
                      </div>
                      <p className="text-xs text-ivory/70 leading-relaxed">
                        Na sua fatura do cartão constará apenas a descrição neutra e discreta{' '}
                        <strong className="text-ivory">"LMI*BILLING SERVICES"</strong> ou{' '}
                        <strong className="text-ivory">"CCBILL.COM"</strong>, preservando total confidencialidade.
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-ivory/50 pt-2">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        3D Secure 2.0
                      </span>
                      <span className="flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-[#C9A96B]" />
                        PCI-DSS Nível 1
                      </span>
                      <span className="flex items-center gap-1">
                        <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                        Rebill Automático Flexível
                      </span>
                    </div>

                    <button
                      onClick={handleInitiatePayment}
                      disabled={isLoading}
                      className="w-full py-4 bg-[#C9A96B] hover:bg-[#D4B87A] text-[#0B0B0B] text-xs font-sans uppercase tracking-[0.25em] font-semibold transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xl disabled:opacity-50"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>Prosseguir para Checkout Seguro CCBill</span>
                          <ExternalLink className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Bloco Específico NOWPayments */}
                {gateway === 'nowpayments' && (
                  <div className="space-y-5 pt-2">
                    {/* Seletor de Criptoativo */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-sans uppercase tracking-widest text-ivory/60 block">
                        Selecione o Criptoativo / Rede:
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
                            className={`p-2.5 text-center border text-xs transition-all cursor-pointer ${
                              selectedCrypto === coin.id
                                ? 'border-[#C9A96B] bg-[#C9A96B]/20 text-[#C9A96B] font-bold'
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
                        onClick={handleInitiatePayment}
                        disabled={isLoading}
                        className="w-full py-4 bg-[#C9A96B] hover:bg-[#D4B87A] text-[#0B0B0B] text-xs font-sans uppercase tracking-[0.25em] font-semibold transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xl disabled:opacity-50"
                      >
                        {isLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <QrCode className="w-4 h-4" />
                            <span>Gerar Endereço de Pagamento & QR Code</span>
                          </>
                        )}
                      </button>
                    ) : (
                      /* Painel do Endereço Cripto e QR Code */
                      <div className="p-6 bg-[#121212] border border-[#C9A96B]/50 space-y-6">
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                          <div className="p-2 bg-white rounded-sm shrink-0 shadow-lg">
                            <img
                              src={cryptoData.qrCodeUrl}
                              alt="QR Code de Pagamento"
                              className="w-36 h-36"
                            />
                          </div>

                          <div className="space-y-3 w-full min-w-0">
                            <div>
                              <span className="text-[10px] uppercase tracking-widest text-ivory/50 block">
                                Valor Exato a Enviar:
                              </span>
                              <div className="text-2xl font-mono text-[#C9A96B] font-bold">
                                {cryptoData.payAmount} {cryptoData.payCurrency}
                              </div>
                            </div>

                            <div>
                              <span className="text-[10px] uppercase tracking-widest text-ivory/50 block">
                                Endereço de Depósito ({selectedCrypto}):
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="text"
                                  readOnly
                                  value={cryptoData.payAddress}
                                  className="w-full bg-[#090909] border border-white/15 px-3 py-2 text-xs font-mono text-ivory select-all focus:outline-hidden"
                                />
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(cryptoData.payAddress)}
                                  className="p-2 bg-[#C9A96B]/20 hover:bg-[#C9A96B] text-[#C9A96B] hover:text-[#0B0B0B] border border-[#C9A96B]/40 transition-all cursor-pointer shrink-0"
                                  title="Copiar Endereço"
                                >
                                  {isCopied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-2 text-xs text-amber-300">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Aguardando confirmações na blockchain...</span>
                          </div>

                          <button
                            onClick={handleSimulateConfirmation}
                            disabled={isLoading}
                            className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/40 text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer"
                          >
                            <span>Confirmar Pagamento</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {errorMessage && (
                  <div className="p-4 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Coluna 2: Resumo do Pedido & Seleção de Plano (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#0D0D0D] border border-white/10 p-6 md:p-8 space-y-6 rounded-xs">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h2 className="font-serif-lumiardi text-2xl font-light text-ivory">
                    Resumo da Ordem
                  </h2>
                  <span className="text-[10px] uppercase tracking-widest text-ivory/50 font-sans">
                    Nível de Acesso
                  </span>
                </div>

                {/* Seletor de Intervalo (Mensal vs Anual) */}
                <div className="flex items-center justify-between bg-[#141414] p-1.5 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setBillingInterval('monthly')}
                    className={`flex-1 py-2 text-xs uppercase tracking-wider font-medium transition-all cursor-pointer ${
                      billingInterval === 'monthly'
                        ? 'bg-[#C9A96B] text-[#0B0B0B] font-semibold'
                        : 'text-ivory/60 hover:text-ivory'
                    }`}
                  >
                    Faturamento Mensal
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingInterval('yearly')}
                    className={`flex-1 py-2 text-xs uppercase tracking-wider font-medium transition-all cursor-pointer relative ${
                      billingInterval === 'yearly'
                        ? 'bg-[#C9A96B] text-[#0B0B0B] font-semibold'
                        : 'text-ivory/60 hover:text-ivory'
                    }`}
                  >
                    Anual (20% OFF)
                  </button>
                </div>

                {/* Card do Plano Selecionado */}
                <div className="p-5 bg-[#121212] border border-[#C9A96B]/40 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-[#C9A96B] font-semibold">
                        {currentPlan.category === 'criadoras' ? 'Plano para Criadora' : 'Plano Corporativo'}
                      </span>
                      <h3 className="font-serif-lumiardi text-3xl font-normal text-ivory">
                        {currentPlan.name}
                      </h3>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-serif-lumiardi text-[#C9A96B]">
                        {gateway === 'ccbill'
                          ? `R$ ${priceBRL.toFixed(2)}`
                          : `$ ${priceUSD.toFixed(2)}`}
                      </div>
                      <span className="text-[10px] text-ivory/50 font-sans block">
                        {isYearly ? 'Cobrado anualmente' : 'Por mês'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-ivory/70 leading-relaxed">
                    {currentPlan.description}
                  </p>

                  <ul className="space-y-2 pt-3 border-t border-white/10 text-xs text-ivory/80 font-sans">
                    {currentPlan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A96B] shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Discriminativo Financeiro */}
                <div className="space-y-3 pt-2 text-xs font-sans border-t border-white/10">
                  <div className="flex justify-between text-ivory/70">
                    <span>Subtotal</span>
                    <span>
                      {gateway === 'ccbill'
                        ? `R$ ${priceBRL.toFixed(2)}`
                        : `$ ${priceUSD.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-ivory/70">
                    <span>Taxa de Processamento e Escrow</span>
                    <span className="text-emerald-400">Incluso (R$ 0,00)</span>
                  </div>
                  <div className="flex justify-between text-ivory/70">
                    <span>Criptografia e Blindagem</span>
                    <span className="text-[#C9A96B]">Ativa (AES-256)</span>
                  </div>
                  <div className="flex justify-between text-base font-serif-lumiardi text-ivory pt-3 border-t border-white/15">
                    <span>Total a Liquidar</span>
                    <span className="text-[#C9A96B] text-xl font-bold">
                      {gateway === 'ccbill'
                        ? `R$ ${priceBRL.toFixed(2)}`
                        : `$ ${priceUSD.toFixed(2)}`}
                    </span>
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
        <div className="min-h-screen bg-[#070707] text-[#F7F3EC] flex items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-[#C9A96B] font-mono">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Inicializando Checkout Lumiardi...</span>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
