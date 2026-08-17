'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldCheck,
  Camera,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  ScanFace,
  UserCheck,
  Sparkles,
  Lock,
  UploadCloud,
  FileText,
  Trash2,
  Video,
  AlertTriangle,
  Fingerprint,
} from 'lucide-react';
import { useAuthPortal } from '@/context/AuthPortalContext';

export interface DocumentUploadPayload {
  type: 'rg_cnh' | 'passaporte' | 'outro';
  fileName: string;
  fileSize: number;
  fileUrl: string;
}

export interface KYCVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onDocumentUpload?: (docData: DocumentUploadPayload) => void;
  claimedData?: {
    fullName?: string;
    cpf?: string;
    birthDate?: string;
    email?: string;
  };
}

export const KYCVerificationModal: React.FC<KYCVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onDocumentUpload,
  claimedData,
}) => {
  const [mounted, setMounted] = useState(false);
  const { currentUser, refreshData } = useAuthPortal();

  const [step, setStep] = useState<'intro' | 'document' | 'liveness' | 'processing' | 'approved' | 'rejected'>('intro');
  const [docType, setDocType] = useState<'cnh' | 'passaporte' | 'rg'>('cnh');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  
  // Estados da Câmera e Captura Real
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [livenessProgress, setLivenessProgress] = useState(0);
  const [scanPrompt, setScanPrompt] = useState('Olhe diretamente para a câmera...');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setStep('intro');
      setLivenessProgress(0);
      setIsScanning(false);
      setCameraActive(false);
      setCameraPermissionError(null);
      setErrorMsg(null);
      setVerificationResult(null);
    } else {
      stopCamera();
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((err) => {
        console.warn('Erro ao dar play no vídeo:', err);
      });
    }
  }, [cameraActive, step]);

  const handleFileSelect = (file: File) => {
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('O arquivo deve ter no máximo 25MB.');
      return;
    }

    setDocumentFile(file);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setDocumentPreview(optimizedDataUrl);
        } else {
          setDocumentPreview(dataUrl);
        }
      };
      img.onerror = () => {
        setDocumentPreview(dataUrl);
      };
      img.src = dataUrl;

      if (onDocumentUpload) {
        onDocumentUpload({
          type: docType === 'passaporte' ? 'passaporte' : 'rg_cnh',
          fileName: file.name,
          fileSize: file.size,
          fileUrl: dataUrl,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Solicitar acesso real à câmera do dispositivo
  const requestCameraAccess = async () => {
    setCameraPermissionError(null);
    setErrorMsg(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Seu navegador não possui suporte para acesso direto à câmera.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setCameraActive(true);

      startFacialScanRoutine();
    } catch (err: unknown) {
      console.error('Erro de permissão da câmera:', err);
      setCameraActive(false);
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('NotAllowedError') || msg.includes('Permission') || msg.includes('denied')) {
        setCameraPermissionError('Permissão da câmera foi negada. Clique no ícone de cadeado/câmera na barra do seu navegador e autorize o uso para continuar.');
      } else if (msg.includes('NotFoundError') || msg.includes('DevicesNotFoundError')) {
        setCameraPermissionError('Nenhuma câmera física foi detectada no seu dispositivo.');
      } else {
        setCameraPermissionError('Não foi possível ligar a câmera. Verifique se outro aplicativo está usando-a.');
      }
    }
  };

  // Rotina de Escaneamento e Captura Biométrica Real
  const startFacialScanRoutine = () => {
    setIsScanning(true);
    setLivenessProgress(0);
    setScanPrompt('Centralize seu rosto no círculo dourado...');

    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

    let prog = 0;
    scanIntervalRef.current = setInterval(() => {
      prog += 5;
      setLivenessProgress(prog);

      if (prog > 20 && prog <= 45) {
        setScanPrompt('Mantenha o olhar fixo para a lente...');
      } else if (prog > 45 && prog <= 75) {
        setScanPrompt('Lendo profundidade biométrica e traços faciais...');
      } else if (prog > 75 && prog < 100) {
        setScanPrompt('Capturando frame em alta definição para OCR e Face Match...');
      }

      if (prog >= 100) {
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        captureAndVerifyBiometrics();
      }
    }, 120);
  };

  // Captura o frame real da webcam usando um Canvas HTML5 e envia para a API
  const captureAndVerifyBiometrics = async () => {
    let capturedSelfieBase64 = '';

    if (videoRef.current && videoRef.current.videoWidth > 0) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(720, videoRef.current.videoWidth);
      canvas.height = Math.min(720, videoRef.current.videoHeight);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        capturedSelfieBase64 = canvas.toDataURL('image/jpeg', 0.85);
      }
    }

    if (!capturedSelfieBase64 && videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 640, 480);
        capturedSelfieBase64 = canvas.toDataURL('image/jpeg', 0.85);
      }
    }

    if (!capturedSelfieBase64 || capturedSelfieBase64.length < 500) {
      setErrorMsg('Não foi possível capturar a imagem da sua câmera ao vivo. Certifique-se de que a câmera está autorizada e ligada.');
      setStep('rejected');
      stopCamera();
      return;
    }

    stopCamera();
    setStep('processing');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch('/api/kyc/verify-document-and-face', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentBase64: documentPreview,
          liveSelfieBase64: capturedSelfieBase64,
          docType,
          claimedData: {
            fullName: claimedData?.fullName || currentUser?.name || 'Candidata',
            cpf: claimedData?.cpf || '000.000.000-00',
            birthDate: claimedData?.birthDate || '1998-05-14',
            email: claimedData?.email || currentUser?.email,
          },
          userId: currentUser?.id || 'new-creator',
        }),
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (data.approved) {
        setVerificationResult(data);
        setStep('approved');
        if (refreshData) refreshData();
        if (onSuccess) onSuccess();
      } else {
        setVerificationResult(data);
        setErrorMsg(data.reasons?.join(' ') || 'Inconsistência biométrica ou documental detectada.');
        setStep('rejected');
      }
    } catch (e: unknown) {
      clearTimeout(timeoutId);
      const msg = e instanceof Error && e.name === 'AbortError'
        ? 'Tempo limite de análise esgotado. Verifique sua conexão e tente novamente.'
        : e instanceof Error ? e.message : 'Erro durante o processamento do OCR e Face Match.';
      setErrorMsg(msg);
      setStep('rejected');
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsScanning(false);
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopCamera();
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-lg my-auto bg-[#0C0C0C] border border-[#C9A96B]/60 p-6 sm:p-8 shadow-[0_0_80px_rgba(0,0,0,0.95)] relative text-[#F7F3EC] space-y-6 rounded-sm animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar */}
        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="absolute top-4 right-4 text-ivory/50 hover:text-[#C9A96B] p-2 cursor-pointer transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho */}
        <div className="space-y-2 border-b border-white/10 pb-4 pr-8">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[#C9A96B]/10 border border-[#C9A96B]/30 text-[#C9A96B] text-[10px] uppercase font-mono tracking-widest font-semibold">
            <ScanFace className="w-3 h-3" />
            <span>Biometria & OCR Real · 18 U.S.C. § 2257</span>
          </div>
          <h2 className="font-serif-lumiardi text-2xl sm:text-3xl font-light text-ivory">
            Leitura de Documento & Face Match
          </h2>
          <p className="text-xs font-sans text-ivory/60">
            Auditoria antifraude com leitura de documento, verificação de maioridade (+18) e confronto biométrico.
          </p>
        </div>

        {/* ETAPA 1: Tipo de Documento */}
        {step === 'intro' && (
          <div className="space-y-5">
            <div className="p-4 bg-[#141414] border border-white/5 space-y-3 text-xs">
              <span className="text-ivory/90 font-semibold block uppercase tracking-wider text-[11px] text-[#C9A96B]">
                1. Selecione o documento oficial que você irá apresentar:
              </span>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cnh', label: 'CNH Digital' },
                  { id: 'passaporte', label: 'Passaporte' },
                  { id: 'rg', label: 'RG com Foto' },
                ].map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setDocType(doc.id as any)}
                    className={`py-3 px-2 text-center text-xs font-sans border transition-all cursor-pointer ${
                      docType === doc.id
                        ? 'border-[#C9A96B] bg-[#C9A96B]/15 text-ivory font-semibold'
                        : 'border-white/10 bg-[#090909] text-ivory/60 hover:border-white/20'
                    }`}
                  >
                    {doc.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 bg-white/[0.03] border border-white/5 space-y-1.5 text-xs text-ivory/70 font-sans leading-relaxed">
              <div className="flex items-center gap-2 text-gold font-medium">
                <Lock className="w-3.5 h-3.5" />
                <span>Proteção Criptografada e Anti-Vazamento</span>
              </div>
              <p className="text-[11px]">
                O motor executa OCR para extração de dados e compara o rosto da imagem com a câmera ao vivo, sem compartilhar seus dados com terceiros.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              onClick={() => setStep('document')}
              className="w-full py-3.5 bg-[#C9A96B] hover:bg-[#D4B87A] text-[#0B0B0B] text-xs font-sans uppercase tracking-[0.2em] font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Avançar para Envio do Documento →</span>
            </button>
          </div>
        )}

        {/* ETAPA 2: Upload do Documento */}
        {step === 'document' && (
          <div className="space-y-5">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            {!documentFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="p-8 border-2 border-dashed border-[#C9A96B]/50 hover:border-[#C9A96B] bg-[#121212] hover:bg-[#161616] text-center space-y-3 cursor-pointer transition-all rounded-xs"
              >
                <div className="w-12 h-12 bg-[#C9A96B]/15 text-[#C9A96B] rounded-full flex items-center justify-center mx-auto">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-ivory">
                    Clique para selecionar a foto nítida do seu <span className="text-[#C9A96B] uppercase">{docType}</span>
                  </p>
                  <p className="text-[11px] text-ivory/50">
                    O documento deve estar aberto, legível e sem reflexos (PNG, JPG máx. 25MB)
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-[#141414] border border-emerald-500/50 space-y-3 rounded-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Documento Carregado</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDocumentFile(null);
                      setDocumentPreview(null);
                    }}
                    className="text-ivory/40 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                    title="Remover e trocar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4 bg-[#090909] p-3 border border-white/10">
                  {documentPreview && (
                    <img
                      src={documentPreview}
                      alt="Preview do Documento"
                      className="w-16 h-16 object-cover border border-[#C9A96B]/50 rounded-xs shrink-0"
                    />
                  )}
                  <div className="overflow-hidden text-left space-y-1">
                    <p className="text-xs font-medium text-ivory truncate">{documentFile.name}</p>
                    <p className="text-[10px] text-ivory/50 font-mono">
                      {(documentFile.size / (1024 * 1024)).toFixed(2)} MB · {docType.toUpperCase()}
                    </p>
                    <span className="inline-block text-[9px] bg-emerald-950/60 text-emerald-300 px-2 py-0.5 border border-emerald-500/30 uppercase font-mono">
                      Pronto para Leitura OCR & Face Match
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] text-[#C9A96B] hover:underline cursor-pointer block text-center w-full pt-1"
                >
                  Trocar foto do documento
                </button>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('intro')}
                className="w-1/3 py-3 bg-white/5 hover:bg-white/10 text-ivory text-xs uppercase tracking-wider font-sans cursor-pointer transition-colors border border-white/10"
              >
                ← Voltar
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!documentFile) {
                    setErrorMsg('Anexe a foto do documento para prosseguir.');
                    return;
                  }
                  setStep('liveness');
                  requestCameraAccess();
                }}
                disabled={!documentFile}
                className="w-2/3 py-3 bg-[#C9A96B] hover:bg-[#D4B87A] text-[#0B0B0B] text-xs uppercase tracking-wider font-semibold font-sans flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                <span>Ir para Prova Facial ao Vivo →</span>
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 3: Prova de Vida e Face Match com Câmera Real */}
        {step === 'liveness' && (
          <div className="space-y-6 text-center">
            <div className="relative w-64 h-64 mx-auto rounded-full overflow-hidden border-4 border-[#C9A96B] shadow-[0_0_40px_rgba(201,169,107,0.35)] bg-neutral-950 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${
                  cameraActive ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-neutral-950 text-[#C9A96B] space-y-3">
                  <div className="w-16 h-16 rounded-full bg-[#C9A96B]/15 border border-[#C9A96B]/30 flex items-center justify-center">
                    <Video className="w-8 h-8 text-[#C9A96B] animate-pulse" />
                  </div>
                  <span className="text-[11px] font-sans font-medium text-ivory/80 leading-tight">
                    Câmera aguardando permissão
                  </span>
                </div>
              )}

              {cameraActive && (
                <>
                  <div className="absolute inset-4 border-2 border-dashed border-[#C9A96B]/70 rounded-full pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#C9A96B]/10 to-transparent animate-pulse pointer-events-none" />
                </>
              )}
            </div>

            {cameraPermissionError ? (
              <div className="p-4 bg-rose-950/60 border border-rose-500 text-left space-y-3 rounded-xs">
                <div className="flex items-start gap-2.5 text-rose-300 text-xs">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-rose-200/80 leading-relaxed font-sans text-[11px]">
                    {cameraPermissionError}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={requestCameraAccess}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold uppercase tracking-wider font-sans transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tentar Novamente</span>
                </button>
              </div>
            ) : cameraActive ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-ivory/80 px-4">
                  <span className="text-[#C9A96B] font-semibold">{scanPrompt}</span>
                  <span className="text-[#C9A96B] font-bold text-sm">{livenessProgress}%</span>
                </div>
                <div className="w-full h-2 bg-neutral-900 border border-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#C9A96B] to-emerald-400 transition-all duration-150"
                    style={{ width: `${livenessProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={requestCameraAccess}
                className="w-full py-4 bg-[#C9A96B] hover:bg-[#D4B87A] text-[#0B0B0B] text-xs uppercase tracking-[0.2em] font-bold font-sans flex items-center justify-center gap-2.5 cursor-pointer shadow-lg"
              >
                <Camera className="w-4 h-4" />
                <span>Ativar Câmera e Iniciar Análise</span>
              </button>
            )}
          </div>
        )}

        {/* ETAPA 4: Processando Análise de IA */}
        {step === 'processing' && (
          <div className="py-12 text-center space-y-4">
            <RefreshCw className="w-10 h-10 animate-spin text-[#C9A96B] mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-semibold uppercase tracking-wider text-ivory font-mono">
                Analisando Documento & Comparando Rosto...
              </p>
              <p className="text-[11px] text-ivory/60 font-sans">
                OCR de alta precisão, validação algorítmica de CPF e Face Match biométrico em execução.
              </p>
            </div>
          </div>
        )}

        {/* ETAPA 5: Reprovado / Inconsistência */}
        {step === 'rejected' && (
          <div className="py-6 text-center space-y-6">
            <div className="w-16 h-16 bg-rose-500/20 border border-rose-500 text-rose-400 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="font-serif-lumiardi text-2xl text-rose-400">
                Homologação Não Aprovada
              </h3>
              <p className="text-xs text-rose-200/80 max-w-sm mx-auto leading-relaxed bg-rose-950/40 p-3 border border-rose-500/30">
                {errorMsg || 'Inconsistência entre os dados do documento e a biometria capturada.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setStep('document');
                setErrorMsg(null);
              }}
              className="px-8 py-3.5 bg-white/10 text-ivory hover:bg-white/20 text-xs uppercase tracking-widest font-semibold transition-all cursor-pointer border border-white/20"
            >
              ← Tentar Enviar Documento Novamente
            </button>
          </div>
        )}

        {/* ETAPA 6: Aprovado com Sucesso & Resumo da Auditoria */}
        {step === 'approved' && (
          <div className="py-4 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <UserCheck className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="font-serif-lumiardi text-2xl text-ivory">
                Identidade & Maioridade (+18) Homologadas!
              </h3>
              <p className="text-xs text-ivory/70 max-w-sm mx-auto font-sans">
                Documento verificado por OCR e similaridade facial confirmada com sucesso.
              </p>
            </div>

            {/* Painel com Dados Reais Extraídos */}
            {verificationResult?.extractedData && (
              <div className="bg-[#141414] border border-[#C9A96B]/40 p-4 text-left space-y-2.5 text-xs">
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-ivory/50 uppercase font-mono text-[10px]">Nome Lido no Documento:</span>
                  <span className="text-ivory font-medium truncate max-w-[200px]">{verificationResult.extractedData.fullName}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-ivory/50 uppercase font-mono text-[10px]">CPF Validado:</span>
                  <span className="text-emerald-400 font-mono font-semibold">{verificationResult.extractedData.cpf}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-ivory/50 uppercase font-mono text-[10px]">Maioridade Legal (+18):</span>
                  <span className="text-emerald-400 font-bold">Aprovada ({verificationResult.extractedData.calculatedAge} anos)</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-ivory/50 uppercase font-mono text-[10px]">Face Match Score:</span>
                  <span className="text-[#C9A96B] font-mono font-bold">{verificationResult.faceMatch?.matchScore}% de Similaridade</span>
                </div>
                <div className="flex justify-between text-[10px] text-ivory/40 font-mono pt-1">
                  <span>Protocolo de Custódia:</span>
                  <span className="text-ivory/60">{verificationResult.compliance2257Reference}</span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
              }}
              className="w-full py-3.5 bg-[#C9A96B] text-[#0B0B0B] text-xs uppercase tracking-widest font-semibold hover:bg-[#D4B87A] transition-all cursor-pointer shadow-lg"
            >
              Concluir & Retornar ao Formulário ✓
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
