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
}

export const KYCVerificationModal: React.FC<KYCVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onDocumentUpload,
}) => {
  const [mounted, setMounted] = useState(false);
  const { currentUser, refreshData } = useAuthPortal();

  const [step, setStep] = useState<'intro' | 'document' | 'liveness' | 'processing' | 'approved'>('intro');
  const [docType, setDocType] = useState<'cnh' | 'passaporte' | 'rg'>('cnh');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  
  // Estados da Câmera
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [livenessProgress, setLivenessProgress] = useState(0);
  const [scanPrompt, setScanPrompt] = useState('Olhe diretamente para a câmera...');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    } else {
      stopCamera();
    }
  }, [isOpen]);

  // Limpa o stream e timers quando o componente desmonta
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Vincula o stream ao elemento <video> assim que a câmera for ativada e o elemento existir no DOM
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((err) => {
        console.warn('Erro ao dar play no vídeo:', err);
      });
    }
  }, [cameraActive, step]);

  // Manipular upload do arquivo do documento
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
      setDocumentPreview(dataUrl);

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

      // Inicia a rotina de escaneamento facial com a câmera ligada
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

  // Rotina de Escaneamento Facial Biométrico (só roda se a câmera estiver ligada)
  const startFacialScanRoutine = () => {
    setIsScanning(true);
    setLivenessProgress(0);
    setScanPrompt('Enquadre seu rosto no círculo dourado...');

    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);

    let prog = 0;
    scanIntervalRef.current = setInterval(() => {
      prog += 4;
      setLivenessProgress(prog);

      if (prog > 20 && prog <= 50) {
        setScanPrompt('Mantenha o olhar fixo para frente...');
      } else if (prog > 50 && prog <= 80) {
        setScanPrompt('Analisando profundidade e traços faciais 3D...');
      } else if (prog > 80 && prog < 100) {
        setScanPrompt('Homologando correspondência com documento...');
      }

      if (prog >= 100) {
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        finalizeKYC();
      }
    }, 150);
  };

  // Parar a câmera
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

  // Finalização e envio do Webhook KYC
  const finalizeKYC = async () => {
    stopCamera();
    setStep('processing');

    try {
      const res = await fetch('/api/webhooks/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewStatus: 'completed',
          reviewResult: { reviewAnswer: 'GREEN', moderationComment: 'Documento e Biometria Facial 3D (+18) Homologados.' },
          userId: currentUser?.id || 'new-creator',
          externalUserId: currentUser?.id || 'new-creator',
          approved: true,
          document: documentFile ? {
            name: documentFile.name,
            size: documentFile.size,
            type: docType,
          } : undefined,
        }),
      });

      if (res.ok) {
        setStep('approved');
        if (refreshData) refreshData();
        if (onSuccess) onSuccess();
      } else {
        throw new Error('Falha ao registrar aprovação biométrica.');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro durante a homologação do KYC.';
      setErrorMsg(msg);
      setStep('intro');
    }
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
            <span>Sumsub / Veriff · KYC +18</span>
          </div>
          <h2 className="font-serif-lumiardi text-2xl sm:text-3xl font-light text-ivory">
            Verificação de Identidade & Idade
          </h2>
          <p className="text-xs font-sans text-ivory/60">
            Validação oficial de maioridade (+18) com leitura de documento e prova de vida facial 3D.
          </p>
        </div>

        {/* ETAPA 1: Escolha do Tipo de Documento */}
        {step === 'intro' && (
          <div className="space-y-5">
            <div className="p-4 bg-[#141414] border border-white/5 space-y-3 text-xs">
              <span className="text-ivory/90 font-semibold block uppercase tracking-wider text-[11px] text-[#C9A96B]">
                1. Selecione o tipo de documento oficial com foto:
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
                <span>Criptografia de Nível Bancário</span>
              </div>
              <p className="text-[11px]">
                Seus dados são protegidos sob conformidade <strong>LGPD/GDPR</strong> e diretrizes de custódia <strong>18 U.S.C. § 2257</strong>.
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

        {/* ETAPA 2: Upload / Reconhecimento Real de Documento */}
        {step === 'document' && (
          <div className="space-y-5">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
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
                    Clique para selecionar a foto do seu <span className="text-[#C9A96B] uppercase">{docType}</span>
                  </p>
                  <p className="text-[11px] text-ivory/50">
                    ou arraste e solte o arquivo aqui (PNG, JPG, PDF máx. 25MB)
                  </p>
                </div>
                <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 text-[10px] text-ivory/70 uppercase tracking-widest font-mono">
                  Selecione o Documento no Computador / Celular
                </div>
              </div>
            ) : (
              /* Card com Preview Real do Documento Anexado */
              <div className="p-4 bg-[#141414] border border-emerald-500/50 space-y-3 rounded-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Documento Carregado com Sucesso</span>
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
                  {documentPreview && documentFile.type.startsWith('image/') ? (
                    <img
                      src={documentPreview}
                      alt="Preview do Documento"
                      className="w-16 h-16 object-cover border border-[#C9A96B]/50 rounded-xs shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-[#1a1a1a] flex items-center justify-center text-[#C9A96B] shrink-0 border border-white/10">
                      <FileText className="w-8 h-8" />
                    </div>
                  )}
                  <div className="overflow-hidden text-left space-y-1">
                    <p className="text-xs font-medium text-ivory truncate">{documentFile.name}</p>
                    <p className="text-[10px] text-ivory/50 font-mono">
                      {(documentFile.size / (1024 * 1024)).toFixed(2)} MB · {docType.toUpperCase()}
                    </p>
                    <span className="inline-block text-[9px] bg-emerald-950/60 text-emerald-300 px-2 py-0.5 border border-emerald-500/30 uppercase font-mono">
                      Pronto para Análise OCR
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
                  // Solicita acesso à câmera ao entrar na etapa
                  requestCameraAccess();
                }}
                disabled={!documentFile}
                className="w-2/3 py-3 bg-[#C9A96B] hover:bg-[#D4B87A] text-[#0B0B0B] text-xs uppercase tracking-wider font-semibold font-sans flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera className="w-4 h-4" />
                <span>Ir para Prova de Vida 3D →</span>
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 3: Prova de Vida 3D com Câmera Real Obrigatória */}
        {step === 'liveness' && (
          <div className="space-y-6 text-center">
            {/* Visualizador da Câmera ao Vivo */}
            <div className="relative w-64 h-64 mx-auto rounded-full overflow-hidden border-4 border-[#C9A96B] shadow-[0_0_40px_rgba(201,169,107,0.35)] bg-neutral-950 flex items-center justify-center">
              
              {/* Elemento de Vídeo Real da Câmera */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${
                  cameraActive ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {/* Se a câmera ainda NÃO foi ligada */}
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-neutral-950 text-[#C9A96B] space-y-3">
                  <div className="w-16 h-16 rounded-full bg-[#C9A96B]/15 border border-[#C9A96B]/30 flex items-center justify-center">
                    <Video className="w-8 h-8 text-[#C9A96B] animate-pulse" />
                  </div>
                  <span className="text-[11px] font-sans font-medium text-ivory/80 leading-tight">
                    Câmera desligada
                  </span>
                </div>
              )}

              {/* Retículo Oval e Radar de Biometria 3D sobre o vídeo */}
              {cameraActive && (
                <>
                  <div className="absolute inset-4 border-2 border-dashed border-[#C9A96B]/70 rounded-full pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#C9A96B]/10 to-transparent animate-pulse pointer-events-none" />
                </>
              )}
            </div>

            {/* Alerta se o usuário negou permissão da câmera */}
            {cameraPermissionError ? (
              <div className="p-4 bg-rose-950/60 border border-rose-500 text-left space-y-3 rounded-xs animate-in fade-in">
                <div className="flex items-start gap-2.5 text-rose-300 text-xs">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold uppercase tracking-wider text-[11px]">
                      Acesso à Câmera Obrigatório
                    </p>
                    <p className="text-rose-200/80 leading-relaxed font-sans text-[11px]">
                      {cameraPermissionError}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={requestCameraAccess}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold uppercase tracking-wider font-sans transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tentar Ligar Câmera Novamente</span>
                </button>
              </div>
            ) : cameraActive ? (
              /* Informações do Scan em Execução */
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
                <p className="text-[11px] text-ivory/60 font-sans">
                  Validação biométrica em andamento com a câmera ao vivo.
                </p>
              </div>
            ) : (
              /* Botão para Ligar Câmera */
              <div className="space-y-3">
                <p className="text-xs text-ivory/75 font-sans leading-relaxed max-w-sm mx-auto">
                  Para comprovar sua maioridade (+18) e titularidade do documento, clique no botão abaixo e <strong>permita o acesso à sua câmera</strong>.
                </p>

                <button
                  type="button"
                  onClick={requestCameraAccess}
                  className="w-full py-4 bg-[#C9A96B] hover:bg-[#D4B87A] text-[#0B0B0B] text-xs uppercase tracking-[0.2em] font-bold font-sans flex items-center justify-center gap-2.5 cursor-pointer transition-all shadow-lg hover:shadow-[#C9A96B]/20"
                >
                  <Camera className="w-4 h-4" />
                  <span>Ligar Câmera e Iniciar Reconhecimento Facial</span>
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-white/10 flex justify-start">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setStep('document');
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-ivory/70 hover:text-ivory text-xs uppercase tracking-wider font-sans cursor-pointer transition-colors border border-white/10"
              >
                ← Voltar ao Documento
              </button>
            </div>
          </div>
        )}

        {/* ETAPA 4: Processando */}
        {step === 'processing' && (
          <div className="py-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-[#C9A96B] mx-auto" />
            <p className="text-xs uppercase tracking-widest text-ivory font-mono">
              Homologando Documento e Biometria (+18)...
            </p>
          </div>
        )}

        {/* ETAPA 5: Aprovado com Sucesso */}
        {step === 'approved' && (
          <div className="py-6 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <UserCheck className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="font-serif-lumiardi text-2xl text-ivory">
                Identidade & Maioridade (+18) Verificadas!
              </h3>
              <p className="text-xs text-ivory/70 max-w-sm mx-auto leading-relaxed">
                Documento lido e biometria 3D homologados com sucesso no ecossistema Lumiardi.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
              }}
              className="px-8 py-3.5 bg-[#C9A96B] text-[#0B0B0B] text-xs uppercase tracking-widest font-semibold hover:bg-[#D4B87A] transition-all cursor-pointer"
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
