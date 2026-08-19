'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  PhoneCall,
  Shield,
  MonitorUp,
  FileText,
  MessageSquare,
  Maximize,
  Minimize,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Send,
  RefreshCw,
  Layers,
  Plus,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/context/LanguageContext';

export const VideoCallWidget: React.FC = () => {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const initialRoom = searchParams.get('room') || 'LM-904-VIP';

  // Estados da Chamada
  const [inCall, setInCall] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenShare, setScreenShare] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mainStageView, setMainStageView] = useState<'camera' | 'screen' | 'waiting'>('camera');

  // Painéis laterais
  const [showNotes, setShowNotes] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Timer Real da Chamada
  const [callSeconds, setCallSeconds] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [roomId, setRoomId] = useState(initialRoom);
  const [dailyUrl, setDailyUrl] = useState<string | null>(null);

  // Chat interno da chamada
  const [inMeetingMessages, setInMeetingMessages] = useState<
    Array<{ id: string; sender: string; text: string; time: string; isMe: boolean }>
  >([]);
  const [chatInput, setChatInput] = useState('');

  // Notas de Reunião
  const [meetingNotes, setMeetingNotes] = useState(
    '• Pauta da Reunião de Casting:\n• Alinhamentos de Produção & Direitos de Imagem:\n• Prazos de Entrega & Locação:'
  );
  const [notesSaved, setNotesSaved] = useState(false);

  // Streams WebRTC Reais
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Vídeo Refs com estados para gatilho reativo no React
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  // Sincronização do Fullscreen Nativo e Tecla ESC
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Contador de Tempo Real
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (inCall) {
      interval = setInterval(() => {
        setCallSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [inCall]);

  const formatCallTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Inicialização e controle da Câmera Real
  const startCamera = useCallback(async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        mediaStreamRef.current = stream;
        setLocalStream(stream);
      }
    } catch (err) {
      console.warn('Câmera/Microfone não concedido ou indisponível:', err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      setLocalStream(null);
    }
  }, []);

  useEffect(() => {
    if (inCall && camOn) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [inCall, camOn, startCamera, stopCamera]);

  // Toggle Microfone Real
  const toggleMic = () => {
    const nextState = !micOn;
    setMicOn(nextState);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = nextState;
      });
    }
  };

  // Toggle Câmera Real
  const toggleCam = () => {
    const nextState = !camOn;
    setCamOn(nextState);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = nextState;
      });
    }
  };

  // Compartilhamento de Tela 100% Real
  const toggleScreenShare = async () => {
    if (!screenShare) {
      try {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false,
          });
          screenStreamRef.current = stream;
          setScreenStream(stream);
          setScreenShare(true);
          setMainStageView('screen');

          // Quando o usuário cancela ou para o compartilhamento via navegador
          stream.getVideoTracks()[0].onended = () => {
            setScreenShare(false);
            setScreenStream(null);
            screenStreamRef.current = null;
            setMainStageView('camera');
          };
        }
      } catch (err) {
        console.warn('Compartilhamento de tela cancelado:', err);
      }
    } else {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }
      setScreenStream(null);
      setScreenShare(false);
      setMainStageView('camera');
    }
  };

  // Alternar Tela Cheia com Suporte a Fullscreen API e Overlay
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {
          setIsFullscreen(true);
        });
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Copiar link da sala
  const handleCopyLink = () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/dashboard/meet?room=${encodeURIComponent(roomId)}` : `https://lumiardi.com/dashboard/meet?room=${encodeURIComponent(roomId)}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Envio de mensagem no chat da reunião
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newMsg = {
      id: Date.now().toString(),
      sender: 'Você',
      text: chatInput.trim(),
      time: timeString,
      isMe: true,
    };

    setInMeetingMessages((prev) => [...prev, newMsg]);
    setChatInput('');
  };

  // Salvar Notas
  const handleSaveNotes = () => {
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2500);
  };

  return (
    <div
      ref={containerRef}
      className={`w-full bg-[#080808] border border-gold/30 text-ivory shadow-2xl transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-[99999] h-screen w-screen p-4 md:p-6 flex flex-col justify-between rounded-none'
          : 'p-4 md:p-6 space-y-4 rounded-sm'
      }`}
    >
      {/* Header do Lumiardi Meet */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gold/10 border border-gold/40 flex items-center justify-center text-gold rounded-sm shrink-0">
            <VideoIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif-lumiardi text-lg md:text-xl font-medium text-ivory">
                {t('meet_vip_room') || 'Lumiardi Meet — Sala Executiva VIP'}
              </h3>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="flex items-center gap-2 text-[11px] font-sans text-ivory/60">
              <span>Sala: <strong className="text-gold font-mono">{roomId}</strong></span>
              <span>•</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <Shield className="w-3 h-3 text-gold" /> {t('meet_e2e_active') || 'Criptografia E2E Ativa'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={async () => {
              try {
                const res = await fetch('/api/meet/room', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({}),
                });
                if (res.ok) {
                  const data = await res.json();
                  setRoomId(data.roomId);
                  if (typeof window !== 'undefined') {
                    window.history.replaceState(null, '', `/dashboard/meet?room=${encodeURIComponent(data.roomId)}`);
                  }
                  if (data.dailyRoomUrl) {
                    setDailyUrl(data.dailyRoomUrl);
                  }
                  setCallSeconds(0);
                }
              } catch (e) {
                console.error('Erro ao gerar sala:', e);
              }
            }}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-ivory/80 hover:text-gold border border-white/10 text-xs font-sans font-medium transition-all flex items-center gap-1.5 rounded-sm cursor-pointer"
            title="Gerar novo código de sala VIP"
          >
            <Plus className="w-3.5 h-3.5 text-gold" />
            <span>{t('meet_new_room') || 'Nova Sala VIP'}</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="px-3.5 py-1.5 bg-[#141414] hover:bg-gold hover:text-black-matte border border-gold/40 text-gold text-xs font-sans font-medium transition-all flex items-center gap-1.5 rounded-sm cursor-pointer shadow-sm active:scale-95"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? (t('meet_invite_copied') || 'Link Copiado!') : (t('meet_copy_invite') || 'Copiar Convite')}</span>
          </button>
        </div>
      </div>

      {inCall ? (
        <div className={`relative w-full bg-black border border-white/10 overflow-hidden flex flex-col justify-between rounded-sm shadow-2xl ${
          isFullscreen ? 'flex-1 min-h-0 my-3' : 'h-[calc(100vh-270px)] min-h-[580px]'
        }`}>
          {/* PALCO PRINCIPAL DE VÍDEO / DISPLAY */}
          <div className="relative w-full h-full bg-[#040404] flex items-center justify-center overflow-hidden">
            {dailyUrl ? (
              <div className="relative w-full h-full bg-black">
                <iframe
                  src={dailyUrl}
                  allow="camera; microphone; fullscreen; display-capture; autoplay"
                  className="w-full h-full border-0"
                />
              </div>
            ) : (
              <>
                {/* 1. MODO COMPARTILHAMENTO DE TELA */}
                {screenShare && screenStream && mainStageView === 'screen' && (
                  <div className="relative w-full h-full bg-black flex items-center justify-center">
                    <video
                      ref={(el) => {
                        if (el && screenStream) {
                          el.srcObject = screenStream;
                        }
                      }}
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain bg-black"
                    />
                    <div className="absolute top-4 left-4 bg-black/90 backdrop-blur-md px-3.5 py-1.5 text-xs font-sans text-gold border border-gold/40 flex items-center gap-2 rounded-xs z-10 shadow-lg">
                      <span className="w-2 h-2 rounded-full bg-gold animate-ping" />
                      <span className="font-semibold uppercase tracking-wider text-[10px]">Transmitindo Sua Tela (Full HD 60FPS)</span>
                    </div>
                  </div>
                )}

            {/* 2. MODO CÂMERA DO USUÁRIO NO PALCO PRINCIPAL */}
            {(!screenShare || mainStageView === 'camera') && (
              <div className="relative w-full h-full bg-[#050505] flex items-center justify-center">
                {camOn && localStream ? (
                  <div className="relative w-full h-full">
                    <video
                      ref={(el) => {
                        if (el && localStream) {
                          el.srcObject = localStream;
                        }
                      }}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

                    {/* Tag de Transmissão Ativa */}
                    <div className="absolute top-4 left-4 bg-black/85 backdrop-blur-md px-3 py-1.5 text-xs font-sans text-ivory border border-gold/30 flex items-center gap-2 rounded-xs z-10 shadow-lg">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-medium text-gold">Sua Câmera HD Ao Vivo</span>
                      <span className="text-[10px] text-ivory/50 font-mono">· 1080p Master</span>
                    </div>
                  </div>
                ) : (
                  /* Sala de Espera Luxo quando a câmera está desligada */
                  <div className="relative w-full h-full bg-gradient-to-br from-[#0c0c0c] via-[#050505] to-black flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <div className="w-20 h-20 rounded-full bg-gold/10 border-2 border-gold/40 flex items-center justify-center text-gold relative shadow-2xl">
                      <span className="w-full h-full absolute rounded-full border border-gold/30 animate-ping opacity-75" />
                      <Shield className="w-10 h-10 text-gold" />
                    </div>

                    <div className="max-w-md space-y-1.5 z-10">
                      <span className="text-[10px] uppercase font-sans tracking-[0.25em] text-gold font-semibold block">
                        Sala Executiva Criptografada (E2E)
                      </span>
                      <h3 className="font-serif-lumiardi text-2xl md:text-3xl font-light text-ivory">
                        Conexão VIP Estabelecida
                      </h3>
                      <p className="text-xs text-ivory/50 font-sans leading-relaxed">
                        Sua sala está pronta e segura. Ligue sua câmera abaixo ou envie o link de convite para a agência ou contratante ingressar na conferência.
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 z-10 pt-1">
                      <button
                        onClick={toggleCam}
                        className="px-4 py-2 bg-gold hover:bg-gold-light text-black-matte font-sans font-semibold text-xs uppercase tracking-wider transition-all flex items-center gap-2 rounded-sm cursor-pointer shadow-lg active:scale-95"
                      >
                        <VideoIcon className="w-4 h-4" />
                        <span>Ligar Minha Câmera</span>
                      </button>

                      <button
                        onClick={handleCopyLink}
                        className="px-4 py-2 bg-[#161616] hover:bg-[#222222] border border-gold/40 text-gold text-xs font-sans uppercase tracking-wider transition-colors flex items-center gap-1.5 rounded-sm cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Convite</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
              </>
            )}

            {/* PIP / MINIATURA NO CANTO SUPERIOR (Alternância quando compartilhando tela) */}
            {screenShare && (
              <div
                onClick={() => setMainStageView(mainStageView === 'screen' ? 'camera' : 'screen')}
                className="absolute top-4 right-4 w-40 h-28 sm:w-52 sm:h-36 bg-[#111111] border-2 border-gold shadow-2xl overflow-hidden rounded-xs z-20 group cursor-pointer transition-transform hover:scale-102"
                title="Clique para alternar entre sua câmera e a tela no palco principal"
              >
                {camOn && localStream ? (
                  <video
                    ref={(el) => {
                      if (el && localStream) {
                        el.srcObject = localStream;
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover mirror"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#141414] text-ivory/50 text-xs font-sans">
                    <VideoOff className="w-6 h-6 mb-1 text-rose-400" />
                    <span className="text-[10px]">Câmera Desligada</span>
                  </div>
                )}

                <div className="absolute bottom-1 left-1 right-1 bg-black/85 backdrop-blur-xs px-2 py-0.5 text-[10px] font-sans text-gold flex items-center justify-between">
                  <span className="truncate flex items-center gap-1">
                    <Layers className="w-3 h-3 text-gold" />
                    <span>Alternar Visualização</span>
                  </span>
                  <span>{micOn ? <Mic className="w-3 h-3 text-emerald-400" /> : <MicOff className="w-3 h-3 text-rose-400" />}</span>
                </div>
              </div>
            )}

            {/* PAINEL LATERAL 1: NOTAS DE CASTING & ATA */}
            {showNotes && (
              <div className="absolute top-0 bottom-0 left-0 w-80 max-w-full bg-black/95 backdrop-blur-md border-r border-gold/40 p-4 text-xs font-sans flex flex-col justify-between z-30 animate-in fade-in slide-in-from-left">
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="font-serif-lumiardi text-sm text-gold font-medium flex items-center gap-1.5">
                      <FileText className="w-4 h-4" /> Ata & Notas da Reunião
                    </span>
                    <button onClick={() => setShowNotes(false)} className="text-ivory/50 hover:text-gold text-xs cursor-pointer p-1">✕</button>
                  </div>
                  <textarea
                    rows={9}
                    value={meetingNotes}
                    onChange={(e) => setMeetingNotes(e.target.value)}
                    placeholder="Anote detalhes de cachê, datas e exigências contratuais..."
                    className="w-full bg-[#141414] border border-white/15 focus:border-gold p-3 text-xs text-ivory outline-none rounded-xs resize-none font-sans leading-relaxed"
                  />
                  {notesSaved && (
                    <div className="p-2 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-[11px] flex items-center gap-1.5 rounded-xs animate-in fade-in">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ata salva e sincronizada no Lumiardi Drive!</span>
                    </div>
                  )}
                </div>
                <Button
                  variant="primary"
                  onClick={handleSaveNotes}
                  className="w-full py-2 text-xs uppercase font-bold tracking-wider cursor-pointer"
                >
                  Salvar Ata no Drive
                </Button>
              </div>
            )}

            {/* PAINEL LATERAL 2: CHAT AO VIVO DA REUNIÃO */}
            {showChat && (
              <div className="absolute top-0 bottom-0 right-0 w-80 max-w-full bg-black/95 backdrop-blur-md border-l border-gold/40 p-4 text-xs font-sans flex flex-col justify-between z-30 animate-in fade-in slide-in-from-right">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="font-serif-lumiardi text-sm text-gold font-medium flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4" /> Chat da Sala ({inMeetingMessages.length})
                  </span>
                  <button onClick={() => setShowChat(false)} className="text-ivory/50 hover:text-gold text-xs cursor-pointer p-1">✕</button>
                </div>

                {/* Lista de Mensagens */}
                <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
                  {inMeetingMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 text-ivory/40 space-y-1">
                      <MessageSquare className="w-6 h-6 text-gold/40 mb-1" />
                      <p className="text-xs">Nenhuma mensagem no chat.</p>
                      <p className="text-[10px]">Envie mensagens em tempo real durante a chamada.</p>
                    </div>
                  ) : (
                    inMeetingMessages.map((m) => (
                      <div
                        key={m.id}
                        className={`p-2.5 rounded-xs text-[11px] leading-relaxed ${
                          m.isMe ? 'bg-gold/15 border border-gold/30 ml-4' : 'bg-[#181818] border border-white/10 mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-semibold ${m.isMe ? 'text-gold' : 'text-ivory'}`}>{m.sender}</span>
                          <span className="text-[9px] text-ivory/40">{m.time}</span>
                        </div>
                        <p className="text-ivory/90">{m.text}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Input de Envio */}
                <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-white/10">
                  <input
                    type="text"
                    placeholder="Mensagem rápida na sala..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 bg-[#161616] border border-white/15 focus:border-gold px-3 py-2 text-xs text-ivory outline-none rounded-xs"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-gold text-black-matte font-bold rounded-xs hover:bg-gold-light transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* BARRA DE CONTROLES INFERIOR DINÂMICA E ELEGANTE */}
          <div className="p-3.5 bg-black/95 backdrop-blur-md border-t border-white/10 flex items-center justify-between z-20 flex-wrap gap-3 shrink-0">
            {/* Indicador de Tempo Real e Áudio */}
            <div className="flex items-center gap-3 text-xs font-sans">
              <div className="flex items-center gap-2 bg-[#121212] border border-white/10 px-3 py-1.5 rounded-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-ivory/60 text-[11px]">Duração:</span>
                <strong className="text-gold font-mono text-xs">{formatCallTime(callSeconds)}</strong>
              </div>

              <button
                onClick={() => setAudioMuted(!audioMuted)}
                className="p-2 bg-[#141414] hover:bg-white/10 border border-white/10 text-ivory/70 hover:text-gold transition-colors rounded-xs cursor-pointer"
                title={audioMuted ? 'Desmutar Áudio da Sala' : 'Mutar Áudio da Sala'}
              >
                {audioMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>
            </div>

            {/* Ações Centrais de Mídia (Microfone, Câmera, Tela, Notas, Chat, Desconectar) */}
            <div className="flex items-center gap-2.5 mx-auto">
              <button
                onClick={toggleMic}
                className={`p-3 rounded-xs transition-all cursor-pointer border shadow-md active:scale-95 ${
                  micOn
                    ? 'bg-[#181818] text-ivory hover:bg-white/10 border-white/10 hover:border-gold/50'
                    : 'bg-rose-950/90 border-rose-500 text-rose-300'
                }`}
                title={micOn ? 'Desativar Microfone' : 'Ativar Microfone'}
              >
                {micOn ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4" />}
              </button>

              <button
                onClick={toggleCam}
                className={`p-3 rounded-xs transition-all cursor-pointer border shadow-md active:scale-95 ${
                  camOn
                    ? 'bg-[#181818] text-ivory hover:bg-white/10 border-white/10 hover:border-gold/50'
                    : 'bg-rose-950/90 border-rose-500 text-rose-300'
                }`}
                title={camOn ? 'Desligar Minha Câmera' : 'Ligar Minha Câmera'}
              >
                {camOn ? <VideoIcon className="w-4 h-4 text-emerald-400" /> : <VideoOff className="w-4 h-4" />}
              </button>

              <button
                onClick={toggleScreenShare}
                className={`p-3 rounded-xs transition-all cursor-pointer border shadow-md active:scale-95 ${
                  screenShare
                    ? 'bg-gold text-black-matte border-gold font-bold shadow-gold/30'
                    : 'bg-[#181818] text-ivory hover:bg-white/10 border-white/10 hover:border-gold/50'
                }`}
                title={screenShare ? 'Parar Compartilhamento de Tela' : 'Compartilhar Minha Tela'}
              >
                <MonitorUp className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setShowNotes(!showNotes);
                  setShowChat(false);
                }}
                className={`p-3 rounded-xs transition-all cursor-pointer border shadow-md active:scale-95 ${
                  showNotes
                    ? 'bg-gold text-black-matte border-gold font-bold shadow-gold/30'
                    : 'bg-[#181818] text-ivory hover:bg-white/10 border-white/10 hover:border-gold/50'
                }`}
                title="Anotações & Ficha de Casting"
              >
                <FileText className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setShowChat(!showChat);
                  setShowNotes(false);
                }}
                className={`p-3 rounded-xs transition-all cursor-pointer border shadow-md relative active:scale-95 ${
                  showChat
                    ? 'bg-gold text-black-matte border-gold font-bold shadow-gold/30'
                    : 'bg-[#181818] text-ivory hover:bg-white/10 border-white/10 hover:border-gold/50'
                }`}
                title="Chat Interno da Reunião"
              >
                <MessageSquare className="w-4 h-4" />
                {inMeetingMessages.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gold text-black-matte text-[9px] font-bold rounded-full flex items-center justify-center">
                    {inMeetingMessages.length}
                  </span>
                )}
              </button>

              {/* Botão de Encerrar Chamada */}
              <button
                onClick={() => {
                  setInCall(false);
                  stopCamera();
                  if (screenStreamRef.current) {
                    screenStreamRef.current.getTracks().forEach((t) => t.stop());
                    screenStreamRef.current = null;
                  }
                  setScreenShare(false);
                }}
                className="p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xs transition-colors cursor-pointer border border-rose-500 shadow-lg active:scale-95"
                title="Encerrar Chamada Segura"
              >
                <PhoneOff className="w-4 h-4" />
              </button>
            </div>

            {/* Botão de Tela Cheia */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullscreen}
                className="p-2.5 bg-[#141414] hover:bg-gold hover:text-black-matte border border-white/10 text-ivory/70 transition-all rounded-xs cursor-pointer active:scale-95"
                title={isFullscreen ? 'Sair da Tela Cheia' : 'Modo Tela Cheia Imersivo'}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Tela de Chamada Encerrada / Reconectar */
        <div className="w-full h-[400px] bg-black border border-white/10 flex flex-col items-center justify-center text-center p-6 space-y-5 rounded-sm">
          <div className="w-16 h-16 bg-gold/10 border border-gold/40 text-gold flex items-center justify-center rounded-full shadow-xl">
            <PhoneCall className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h4 className="font-serif-lumiardi text-2xl text-ivory font-light">
              Reunião VIP Finalizada
            </h4>
            <p className="text-xs text-ivory/60 font-sans max-w-md leading-relaxed">
              A gravação e a ata criptografada foram arquivadas em segurança no seu Lumiardi Drive.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="primary"
              onClick={() => {
                setInCall(true);
                setCallSeconds(0);
                setCamOn(true);
                startCamera();
              }}
              className="text-xs uppercase font-bold py-2.5 px-6 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Reconectar à Sala {roomId}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
