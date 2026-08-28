'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Smartphone,
  Copy,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  KeyRound,
} from 'lucide-react';

export interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (secret: string) => void;
}

export const TwoFactorModal: React.FC<TwoFactorModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<'loading' | 'qrcode' | 'success'>('loading');
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [currentOtp, setCurrentOtp] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetch2FASecret = async () => {
    setStep('loading');
    setErrorMessage(null);
    setImageError(false);
    try {
      const res = await fetch('/api/auth/2fa/generate', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSecret(data.secret);
        setQrCodeUrl(data.qrCodeUrl);
        setCurrentOtp(data.currentOtp || '');
        setStep('qrcode');
      } else {
        throw new Error(data.error || 'Erro ao gerar segredo 2FA');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Falha ao conectar com o serviço de segurança.');
      setStep('qrcode');
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetch2FASecret();
      setTokenInput('');
    }
  }, [isOpen]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.length !== 6) {
      setErrorMessage('Digite o código de 6 dígitos completo.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput, secret }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStep('success');
        if (onSuccess) {
          onSuccess(secret);
        }
      } else {
        throw new Error(data.error || 'Código incorreto ou expirado.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Código inválido. Verifique o horário do seu celular.');
    } finally {
      setIsVerifying(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleAutoFillTest = async () => {
    try {
      const res = await fetch('/api/auth/2fa/generate', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSecret(data.secret);
        setQrCodeUrl(data.qrCodeUrl);
        setCurrentOtp(data.currentOtp || '');
        setTokenInput(data.currentOtp || '');
      }
    } catch {
      if (currentOtp) setTokenInput(currentOtp);
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg my-auto bg-[#0C0C0C] border border-[#C9A96B]/60 p-4 sm:p-8 shadow-[0_0_80px_rgba(0,0,0,0.95)] relative text-[#F7F3EC] space-y-4 sm:space-y-6 rounded-sm animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-ivory/50 hover:text-[#C9A96B] p-2 cursor-pointer transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho */}
        <div className="space-y-2 border-b border-white/10 pb-4 pr-8">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[#C9A96B]/10 border border-[#C9A96B]/30 text-[#C9A96B] text-[10px] uppercase font-mono tracking-widest font-semibold">
            <KeyRound className="w-3 h-3 shrink-0" />
            <span>Autenticação em Dois Fatores (2FA)</span>
          </div>
          <h2 className="font-serif-lumiardi text-xl sm:text-2xl md:text-3xl font-light text-ivory">
            Blindagem de Acesso da Conta
          </h2>
          <p className="text-xs font-sans text-ivory/60">
            Proteja sua conta contra invasões usando o Google Authenticator ou Authy.
          </p>
        </div>

        {step === 'loading' && (
          <div className="py-12 text-center space-y-3">
            <RefreshCw className="w-7 h-7 animate-spin text-[#C9A96B] mx-auto" />
            <p className="text-xs uppercase tracking-widest text-ivory/60 font-mono">
              Gerando chave criptográfica exclusiva...
            </p>
          </div>
        )}

        {step === 'qrcode' && (
          <div className="space-y-6">
            {/* Etapa 1: QR Code & Chave Manual */}
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-[#141414] border border-white/10 rounded-xs">
              <div className="p-2.5 bg-white rounded-xs shrink-0 shadow-lg flex items-center justify-center">
                {!imageError && qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="QR Code 2FA"
                    className="w-28 h-28 sm:w-32 sm:h-32 block object-contain"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-28 h-28 sm:w-32 sm:h-32 bg-neutral-900 text-[#C9A96B] flex flex-col items-center justify-center p-2 text-center text-[10px] border border-[#C9A96B]/30">
                    <KeyRound className="w-6 h-6 mb-1 text-[#C9A96B]" />
                    <span className="font-mono text-[9px] uppercase">Chave:</span>
                    <span className="font-mono font-bold text-[9px] truncate max-w-[100px]">
                      {secret.substring(0, 8)}...
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-xs font-sans w-full min-w-0">
                <span className="font-semibold text-ivory flex items-center gap-1.5 text-xs text-[#C9A96B]">
                  <Smartphone className="w-4 h-4" />
                  <span>Passo 1: Escaneie o QR Code</span>
                </span>
                <p className="text-ivory/70 text-[11px] leading-relaxed">
                  No app <strong>Google Authenticator</strong>, toque em <strong>+</strong> e escaneie o código.
                </p>

                <div className="pt-1">
                  <span className="text-[10px] text-ivory/50 uppercase block font-mono">
                    Ou copie o código manual:
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <code className="text-[10px] font-mono text-[#C9A96B] bg-[#070707] px-2 py-1 border border-white/10 select-all truncate max-w-[160px]">
                      {secret}
                    </code>
                    <button
                      type="button"
                      onClick={copySecret}
                      className="px-2 py-1 bg-white/5 hover:bg-[#C9A96B] text-ivory hover:text-black border border-white/10 text-[10px] transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                      title="Copiar Chave"
                    >
                      {isCopied ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Etapa 2: Confirmação do Código de 6 Dígitos */}
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-wider text-ivory/70 font-semibold block">
                    Passo 2: Digite o código de 6 dígitos:
                  </label>

                  {currentOtp && (
                    <button
                      type="button"
                      onClick={handleAutoFillTest}
                      className="text-[11px] text-[#C9A96B] hover:text-[#D4B87A] underline flex items-center gap-1 cursor-pointer font-mono"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>Preencher código teste ({currentOtp})</span>
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  maxLength={6}
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full bg-[#070707] border border-white/20 focus:border-[#C9A96B] text-center text-2xl font-mono tracking-[0.4em] py-2.5 text-ivory focus:outline-hidden"
                  autoFocus
                />
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifying || tokenInput.length !== 6}
                className="w-full py-3.5 bg-[#C9A96B] hover:bg-[#D4B87A] text-[#0B0B0B] text-xs font-sans uppercase tracking-[0.2em] font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                {isVerifying ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Validar & Ativar Blindagem 2FA</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {step === 'success' && (
          <div className="py-6 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="font-serif-lumiardi text-2xl text-ivory">
                2FA Ativado com Sucesso!
              </h3>
              <p className="text-xs text-ivory/70 max-w-sm mx-auto leading-relaxed">
                A partir de agora, sua conta está blindada com autenticação de dois fatores.
              </p>
            </div>

            <button
              onClick={onClose}
              className="px-6 py-3 bg-[#C9A96B] text-[#0B0B0B] text-xs uppercase tracking-widest font-semibold hover:bg-[#D4B87A] transition-all cursor-pointer"
            >
              Concluir & Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return modalContent;
};
