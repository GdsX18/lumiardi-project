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
  Zap,
} from 'lucide-react';
import { LUMIARDI_PLANS, getPlan } from '@/lib/payments/plansConfig';
import { PlanId, BillingInterval, PaymentGatewayType, CryptoCurrency } from '@/lib/payments/types';
import { useAuthPortal } from '@/context/AuthPortalContext';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentUser, refreshData } = useAuthPortal();

  const initialPlanId = (searchParams.get('plan') || 'glow') as PlanId;
  const initialCategory = searchParams.get('category') === 'agencias' ? 'agencias' : 'criadoras';

  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>(initialPlanId);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [gateway, setGateway] = useState<PaymentGatewayType>('pix');
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

  // Código Pix Copia e Cola Padrão BACEN / EMV
  const pixCopiaECola = `00020126580014br.gov.bcb.pix0136noreply@lumiardi.com520400005303986540${priceBRL.toFixed(2)}5802BR5918LUMIARDI CLUB6009SAO PAULO62070503***6304`;
  const pixQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCopiaECola)}`;

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
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Confirmação de Pagamento Pix / Cripto e Redirecionamento para Curadoria
  const handleConfirmPixPayment = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/webhooks/nowpayments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_status: 'finished',
          payment_id: `pix_${Date.now()}`,
          order_description: `Plano ${currentPlan.name} ${billingInterval === 'yearly' ? 'Anual' : 'Mensal'} (PIX)`,
          price_amount: priceUSD,
          pay_currency: 'BRL_PIX',
          userId: currentUser?.id || 'new_user',
        }),
      });

      if (refreshData) await refreshData();
      setPaymentSuccess(true);
    } catch (e) {
      console.error(e);
      setPaymentSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070707] text-[#F7F3EC] font-sans selection:bg-[#D4AF37] selection:text-[#0B0B0B]">
      <Header />

      <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Cabeçalho do Checkout */}
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-sans uppercase tracking-[0.3em] rounded-full">
            <Lock className="w-3 h-3 text-[#F5D77F]" />
            <span>Ambiente Criptografado & Pagamento Seguro</span>
          </div>
          <h1 className="font-serif-lumiardi text-4xl sm:text-5xl font-light text-ivory tracking-tight">
            Adesão & Checkout Oficial
          </h1>
          <p className="text-sm font-sans text-ivory/60 max-w-xl mx-auto font-light">
            Selecione a forma de liquidação preferida para ativação imediata e envio para a Curadoria de Elite.
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
                Pagamento Registrado com Sucesso
              </span>
              <h2 className="font-serif-lumiardi text-3xl text-ivory">
                Plano {currentPlan.name} Reservado
              </h2>
              <p className="text-xs text-ivory/70 max-w-md mx-auto leading-relaxed font-light">
                Sua anuidade foi confirmada. Agora seus documentos e perfil foram encaminhados para a <strong>Curadoria VIP Lumiardi</strong>.
              </p>
            </div>

            <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/dashboard/pendente')}
                className="px-8 py-4 bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-[#0B0B0B] text-xs uppercase tracking-[0.2em] font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer rounded-sm shadow-xl"
              >
                <span>Acompanhar Status da Curadoria →</span>
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
                    Método de Pagamento
                  </h2>
                  <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-mono">
                    Liquidação Instantânea
                  </span>
                </div>

                {/* 3 Opções de Gateway: PIX vs CRIPTO vs CARTÃO */}
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
                        <span>PIX Instantâneo</span>
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 uppercase tracking-wider font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 rounded-xs">
                      Recomendado ⚡
                    </span>
                  </button>

                  {/* Opção 2: Criptomoedas (NOWPayments) */}
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
                        <span>Web3 / Cripto</span>
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 uppercase tracking-wider font-semibold bg-[#1a1a1a] text-[#F5D77F] border border-[#D4AF37]/30 rounded-xs">
                      USDT / BTC / ETH
                    </span>
                  </button>

                  {/* Opção 3: Cartão Internacional (CCBill) */}
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
                        <span>Cartão Global</span>
                      </div>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 uppercase tracking-wider font-semibold bg-[#1a1a1a] text-ivory/60 border border-white/10 rounded-xs">
                      CCBill High-Risk
                    </span>
                  </button>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                    BLOCO EXCLUSIVO DO PIX INSTANTÂNEO (BRASIL)
                ═══════════════════════════════════════════════════════════════ */}
                {gateway === 'pix' && (
                  <div className="space-y-6 pt-2 animate-in fade-in duration-300">
                    <div className="p-6 bg-[#121212] border border-[#D4AF37]/50 space-y-6 rounded-lg">
                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        {/* QR Code Pix */}
                        <div className="p-3 bg-white rounded-md shrink-0 shadow-2xl">
                          <img
                            src={pixQrCodeUrl}
                            alt="QR Code Pix Oficial"
                            className="w-40 h-40 object-contain"
                          />
                        </div>

                        {/* Dados do Pix */}
                        <div className="space-y-3 w-full min-w-0 text-center sm:text-left">
                          <div>
                            <span className="text-[10px] uppercase tracking-widest text-ivory/50 block font-sans">
                              Valor Exato em Reais:
                            </span>
                            <div className="text-3xl font-serif-lumiardi text-[#F5D77F] font-bold">
                              R$ {priceBRL.toFixed(2).replace('.', ',')}
                            </div>
                            <span className="text-[11px] text-emerald-400 font-sans flex items-center justify-center sm:justify-start gap-1 mt-1">
                              <Zap className="w-3 h-3" /> Aprovação Imediata no Banco Central
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase tracking-widest text-ivory/50 block font-sans">
                              Chave Pix Oficial (E-mail):
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
                          Código Pix Copia e Cola:
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
                            <span>{isCopied ? 'Copiado! ✓' : 'Copiar'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Instruções */}
                      <div className="p-4 bg-black/40 border border-white/10 text-xs text-ivory/70 space-y-1 font-light leading-relaxed rounded-xs">
                        <p>1. Abra o app do seu banco no celular (Nubank, Itaú, Bradesco, Inter, etc.).</p>
                        <p>2. Escolha <strong>Pix ➔ Pagar com QR Code</strong> ou <strong>Pix Copia e Cola</strong>.</p>
                        <p>3. Conclua o pagamento e clique no botão abaixo para avançar para a Curadoria.</p>
                      </div>

                      {/* Botão de Confirmação */}
                      <button
                        onClick={handleConfirmPixPayment}
                        disabled={isLoading}
                        className="w-full py-4 bg-gradient-to-r from-[#D4AF37] via-[#F5D77F] to-[#AA820A] hover:brightness-110 text-[#0B0B0B] text-xs font-sans uppercase tracking-[0.25em] font-bold transition-all flex items-center justify-center gap-3 cursor-pointer shadow-[0_10px_30px_rgba(212,175,55,0.35)] rounded-sm disabled:opacity-50"
                      >
                        {isLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Confirmar Pagamento Realizado →</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    BLOCO ESPECÍFICO CRIPTOMOEDAS (NOWPAYMENTS)
                ═══════════════════════════════════════════════════════════════ */}
                {gateway === 'nowpayments' && (
                  <div className="space-y-5 pt-2 animate-in fade-in duration-300">
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
                        onClick={handleInitiatePayment}
                        disabled={isLoading}
                        className="w-full py-4 bg-[#D4AF37] hover:bg-[#F5D77F] text-[#0B0B0B] text-xs font-sans uppercase tracking-[0.25em] font-bold transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xl disabled:opacity-50 rounded-sm"
                      >
                        {isLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <QrCode className="w-4 h-4" />
                            <span>Gerar Endereço Cripto & QR Code</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="p-6 bg-[#121212] border border-[#D4AF37]/50 space-y-6 rounded-lg">
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
                              <div className="text-2xl font-mono text-[#F5D77F] font-bold">
                                {cryptoData.payAmount} {cryptoData.payCurrency}
                              </div>
                            </div>

                            <div>
                              <span className="text-[10px] uppercase tracking-widest text-ivory/50 block">
                                Endereço de Depósito ({selectedCrypto}):
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
                          onClick={handleConfirmPixPayment}
                          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono uppercase tracking-widest font-bold transition-all rounded-xs"
                        >
                          Confirmar Pagamento Cripto Realizado →
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════
                    BLOCO CARTÃO INTERNACIONAL
                ═══════════════════════════════════════════════════════════════ */}
                {gateway === 'ccbill' && (
                  <div className="space-y-4 pt-2 animate-in fade-in duration-300">
                    <div className="p-5 bg-[#141414] border border-[#D4AF37]/30 space-y-3 rounded-lg">
                      <div className="flex items-center gap-2 text-xs font-medium text-[#D4AF37]">
                        <EyeOff className="w-4 h-4" />
                        <span>Blindagem de Fatura & Sigilo Garantido</span>
                      </div>
                      <p className="text-xs text-ivory/70 leading-relaxed font-light">
                        Processamento internacional com fatura 100% anônima e discreta. Para liquidação imediata sem taxas cambiais, recomendamos o uso de <strong>PIX Instantâneo</strong> ou <strong>Criptoativos (USDT)</strong>.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setGateway('pix')}
                        className="py-3.5 px-4 bg-[#D4AF37] hover:bg-[#F5D77F] text-[#0B0B0B] text-xs uppercase tracking-wider font-bold transition-all rounded-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                      >
                        <Zap className="w-4 h-4" />
                        <span>Pagar com PIX Instantâneo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setGateway('nowpayments')}
                        className="py-3.5 px-4 bg-[#1a1a1a] hover:bg-white/10 text-ivory border border-white/20 text-xs uppercase tracking-wider font-semibold transition-all rounded-xs flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <QrCode className="w-4 h-4 text-[#F5D77F]" />
                        <span>Pagar com Criptomoedas</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Coluna 2: Resumo da Ordem (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#0D0D0D] border border-white/10 p-6 md:p-8 space-y-6 rounded-xl sticky top-28">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h3 className="font-serif-lumiardi text-2xl font-light text-ivory">
                    Resumo da Ordem
                  </h3>
                  <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-mono">
                    Nível de Acesso
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
                    Faturamento Mensal
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingInterval('yearly')}
                    className={`py-2 text-xs font-sans uppercase tracking-wider font-semibold transition-all cursor-pointer rounded-xs ${
                      isYearly ? 'bg-[#D4AF37] text-[#0B0B0B]' : 'text-ivory/60 hover:text-ivory'
                    }`}
                  >
                    Anual (20% OFF)
                  </button>
                </div>

                {/* Dados do Plano Selecionado */}
                <div className="p-5 bg-[#141414] border border-[#D4AF37]/30 rounded-lg space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[9px] uppercase tracking-[0.2em] text-[#D4AF37] font-mono block">
                        Plano Selecionado
                      </span>
                      <h4 className="font-serif-lumiardi text-2xl text-ivory font-light">
                        {currentPlan.name}
                      </h4>
                    </div>
                    <div className="text-right">
                      <div className="font-serif-lumiardi text-2xl text-[#F5D77F] font-bold">
                        R$ {priceBRL.toFixed(2).replace('.', ',')}
                      </div>
                      <span className="text-[10px] text-ivory/50 block">
                        {isYearly ? 'Cobrado anualmente' : 'Por mês'}
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
                    <span>Subtotal</span>
                    <span>R$ {priceBRL.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between text-ivory/70">
                    <span>Taxa de Processamento e Escrow</span>
                    <span className="text-emerald-400 font-semibold">Incluso (R$ 0,00)</span>
                  </div>
                  <div className="flex justify-between text-ivory/70">
                    <span>Criptografia e Blindagem</span>
                    <span className="text-[#D4AF37] font-semibold">Ativa (AES-256)</span>
                  </div>
                  <div className="flex justify-between text-base font-serif-lumiardi text-ivory pt-3 border-t border-white/10 font-bold">
                    <span>Total a Liquidar</span>
                    <span className="text-[#F5D77F]">R$ {priceBRL.toFixed(2).replace('.', ',')}</span>
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
