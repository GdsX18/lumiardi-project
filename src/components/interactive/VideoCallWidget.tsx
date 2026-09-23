'use client';

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
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
  MessageSquare,
  Maximize,
  Minimize,
  Copy,
  Check,
  Send,
  X,
  Lock,
  Plus,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

// Subcomponente de contagem isolado para eliminar re-renderizações cíclicas no vídeo
const CallTimer = memo(({ active }: { active: boolean }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!active) {
      setSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [active]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return <strong className="text-gold font-mono text-xs">{formatted}</strong>;
});
CallTimer.displayName = 'CallTimer';

// Configuração Obrigatória de STUN Servers (Travessia de NAT/Firewall)
const peerConnectionConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

export interface VideoCallWidgetProps {
  roomId?: string;
  autoStart?: boolean;
  isModal?: boolean;
  onClose?: () => void;
  counterpartyName?: string;
  counterpartyRole?: string;
}

export const VideoCallWidget: React.FC<VideoCallWidgetProps> = ({
  roomId: propRoomId,
  autoStart = false,
  isModal = false,
  onClose,
  counterpartyName: propCounterparty,
}) => {
  const { t } = useLanguage();
  const searchParams = useSearchParams();

  // Se veio via URL ou via Prop (sem mocks fictícios por padrão)
  const initialRoom = propRoomId || searchParams.get('room') || '';
  const [activeRoomId, setActiveRoomId] = useState<string>(initialRoom);
  const [joinInputId, setJoinInputId] = useState<string>('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  // Estados da Chamada em Direto
  const [inCall, setInCall] = useState<boolean>(Boolean(initialRoom || autoStart));
  const [isEnding, setIsEnding] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenShare, setScreenShare] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [swappedViews, setSwappedViews] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Tratamento de Permissões Negadas
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Interlocutor e WebRTC
  const [remoteParticipant, setRemoteParticipant] = useState<{ id: string; name: string } | null>(null);
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [dailyUrl, setDailyUrl] = useState<string | null>(null);
  const [iceConnectionState, setIceConnectionState] = useState<RTCIceConnectionState>('new');
  const [isPeerConnected, setIsPeerConnected] = useState<boolean>(false);

  // Refs de Negociação WebRTC
  const roleRef = useRef<'caller' | 'callee' | null>(null);
  const hasCreatedOfferRef = useRef<boolean>(false);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  // Chat interno durante a chamada
  const [inMeetingMessages, setInMeetingMessages] = useState<
    Array<{ id: string; sender: string; text: string; time: string; isMe: boolean }>
  >([]);
  const [chatInput, setChatInput] = useState('');
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Auto-ocultação da barra cinema
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs de Hardware e WebRTC
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const signalingPollRef = useRef<NodeJS.Timeout | null>(null);
  const participantIdRef = useRef<string>(`part-${Math.random().toString(36).substring(2, 8)}`);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null);

  // Trava de Scroll no body quando em modo Modal Portal
  useEffect(() => {
    if (isModal && inCall) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isModal, inCall]);

  // Listener de Fullscreen Nativo
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Limpeza Completa de Recursos de Mídia (Zero Memory Leaks)
  const stopAllMediaTracks = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      screenStreamRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      remoteStreamRef.current = null;
    }

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (screenVideoRef.current) screenVideoRef.current.srcObject = null;

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (signalingPollRef.current) {
      clearInterval(signalingPollRef.current);
      signalingPollRef.current = null;
    }

    roleRef.current = null;
    hasCreatedOfferRef.current = false;
    pendingCandidatesRef.current = [];
    setHasRemoteStream(false);
    setIsPeerConnected(false);
    setIceConnectionState('new');
  }, []);

  // Sincronização e Reprodução Segura de Mídia Remota
  useEffect(() => {
    if (remoteVideoRef.current && remoteStreamRef.current) {
      if (remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
      remoteVideoRef.current.muted = false;
      remoteVideoRef.current.volume = 1.0;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [hasRemoteStream, isPeerConnected, swappedViews]);

  // Sincronização do Feed Local
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      if (localVideoRef.current.srcObject !== localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      localVideoRef.current.muted = true;
      localVideoRef.current.play().catch(() => {});
    }
  }, [camOn, swappedViews, inCall]);

  // Auto-ocultação inteligente da barra de controles por inatividade do rato
  const triggerUserActivity = useCallback(() => {
    setControlsVisible(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    hideControlsTimeoutRef.current = setTimeout(() => {
      // Não oculta se o chat da reunião estiver aberto
      if (!showChat) {
        setControlsVisible(false);
      }
    }, 3500);
  }, [showChat]);

  // Inicialização e Captura Segura de Mídia Local
  const startCamera = useCallback(async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setPermissionError('Navegador não suporta captura de áudio/vídeo WebRTC.');
        return null;
      }

      setPermissionError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Adiciona faixas ao RTCPeerConnection se já existir
      if (peerConnectionRef.current) {
        stream.getTracks().forEach((track) => {
          peerConnectionRef.current?.addTrack(track, stream);
        });
      }

      return stream;
    } catch (err: unknown) {
      const e = err as { name?: string };
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setPermissionError(
          'Permissão de câmera ou microfone foi bloqueada. Desbloqueie o acesso no ícone de configurações/cadeado na barra do navegador e clique em Tentar Novamente.'
        );
      } else if (e.name === 'NotFoundError') {
        setPermissionError('Nenhuma câmera ou microfone detectado neste dispositivo.');
      } else {
        setPermissionError('Não foi possível inicializar dispositivo de mídia.');
      }
      return null;
    }
  }, []);

  // WebRTC PeerConnection & Sinalização Multi-Nó
  const initWebRTC = useCallback(
    async (roomId: string, currentLocalStream: MediaStream) => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      roleRef.current = null;
      hasCreatedOfferRef.current = false;
      pendingCandidatesRef.current = [];

      const pc = new RTCPeerConnection(peerConnectionConfig);
      peerConnectionRef.current = pc;

      // 1. Assegura que faixas locais capturadas sejam adicionadas antes de qualquer oferta
      currentLocalStream.getTracks().forEach((track) => {
        pc.addTrack(track, currentLocalStream);
      });

      // Helper seguro para envio de sinais WebRTC
      const sendSignal = async (type: 'offer' | 'answer' | 'candidate', data: unknown) => {
        try {
          await fetch('/api/meet/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'signal',
              roomId,
              participantId: participantIdRef.current,
              type,
              data,
            }),
          });
        } catch {
          // Silencioso em caso de oscilações breves
        }
      };

      // 2. Receptor de Stream Remoto (ontrack) com áudio e volume ativos
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          const stream = event.streams[0];
          remoteStreamRef.current = stream;
          setHasRemoteStream(true);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
            remoteVideoRef.current.muted = false;
            remoteVideoRef.current.volume = 1.0;
            remoteVideoRef.current.play().catch(() => {});
          }
        }
      };

      // 3. Envio de ICE Candidates ao outro participante
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal('candidate', event.candidate.toJSON ? event.candidate.toJSON() : event.candidate);
        }
      };

      // 4. Monitoramento da Conexão ICE e Transição de Estado
      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        setIceConnectionState(state);
        if (state === 'connected' || state === 'completed') {
          setIsPeerConnected(true);
        } else if (state === 'disconnected' || state === 'failed') {
          setIsPeerConnected(false);
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setIsPeerConnected(true);
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setIsPeerConnected(false);
        }
      };

      // 5. Registro na sala de sinalização
      try {
        const joinRes = await fetch('/api/meet/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'join',
            roomId,
            participantId: participantIdRef.current,
            participantName: 'Membro VIP Lumiardi',
          }),
        });

        if (joinRes.ok) {
          const joinData = await joinRes.json();
          roleRef.current = joinData.role;

          // Se já houver outro participante presente e este for caller, gera oferta imediatamente
          if (Array.isArray(joinData.participants)) {
            const other = joinData.participants.find(
              (p: { id: string; name: string }) => p.id !== participantIdRef.current
            );
            if (other) {
              setRemoteParticipant({ id: other.id, name: other.name });
              if (joinData.role === 'caller' && !hasCreatedOfferRef.current && pc.signalingState === 'stable') {
                hasCreatedOfferRef.current = true;
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                await sendSignal('offer', offer);
              }
            }
          }
        }
      } catch (joinErr) {
        console.warn('Erro ao ingressar na sala:', joinErr);
      }

      // 6. Polling estrito a cada 1 segundo (1000ms)
      if (signalingPollRef.current) clearInterval(signalingPollRef.current);

      const runPoll = async () => {
        if (peerConnectionRef.current !== pc || pc.connectionState === 'closed') return;

        try {
          const pollRes = await fetch('/api/meet/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'poll',
              roomId,
              participantId: participantIdRef.current,
            }),
          });

          if (!pollRes.ok) return;
          const pollData = await pollRes.json();

          // Sincroniza participantes ativos
          if (Array.isArray(pollData.participants)) {
            const other = pollData.participants.find(
              (p: { id: string; name: string }) => p.id !== participantIdRef.current
            );
            if (other) {
              setRemoteParticipant({ id: other.id, name: other.name });

              // Se sou Caller, Callee acabou de entrar e oferta ainda não foi criada:
              if (roleRef.current === 'caller' && !hasCreatedOfferRef.current && pc.signalingState === 'stable') {
                hasCreatedOfferRef.current = true;
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                await sendSignal('offer', offer);
              }
            } else {
              setRemoteParticipant(null);
            }
          }

          // Processa sinais recebidos (offer, answer, candidate)
          if (Array.isArray(pollData.signals)) {
            for (const sig of pollData.signals) {
              if (sig.type === 'offer' && pc.connectionState !== 'closed') {
                // Callee recebe a oferta
                await pc.setRemoteDescription(new RTCSessionDescription(sig.data));

                // Aplica candidatos ICE que estavam em buffer antes da oferta
                while (pendingCandidatesRef.current.length > 0) {
                  const cand = pendingCandidatesRef.current.shift();
                  if (cand) {
                    try {
                      await pc.addIceCandidate(new RTCIceCandidate(cand));
                    } catch (candErr) {
                      console.warn('Erro ao adicionar ICE candidate do buffer:', candErr);
                    }
                  }
                }

                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                await sendSignal('answer', answer);

              } else if (sig.type === 'answer' && pc.connectionState !== 'closed') {
                // Caller consome a resposta com setRemoteDescription
                if (pc.signalingState === 'have-local-offer') {
                  await pc.setRemoteDescription(new RTCSessionDescription(sig.data));

                  // Aplica candidatos ICE que estavam em buffer antes da resposta
                  while (pendingCandidatesRef.current.length > 0) {
                    const cand = pendingCandidatesRef.current.shift();
                    if (cand) {
                      try {
                        await pc.addIceCandidate(new RTCIceCandidate(cand));
                      } catch (candErr) {
                        console.warn('Erro ao adicionar ICE candidate do buffer:', candErr);
                      }
                    }
                  }
                }

              } else if (sig.type === 'candidate' && pc.connectionState !== 'closed') {
                if (pc.remoteDescription && pc.remoteDescription.type) {
                  try {
                    await pc.addIceCandidate(new RTCIceCandidate(sig.data));
                  } catch (e) {
                    console.warn('Erro ao aplicar ICE Candidate:', e);
                  }
                } else {
                  // Bufferiza se remoteDescription ainda não foi configurada
                  pendingCandidatesRef.current.push(sig.data);
                }
              }
            }
          }
        } catch {
          // Ignora falha de polling momentânea
        }
      };

      signalingPollRef.current = setInterval(runPoll, 1000);
    },
    []
  );

  // Inicialização quando a chamada é ativada
  useEffect(() => {
    let mounted = true;

    if (inCall && activeRoomId) {
      (async () => {
        const stream = await startCamera();
        if (mounted && stream) {
          await initWebRTC(activeRoomId, stream);
        }
      })();
    }

    return () => {
      mounted = false;
      stopAllMediaTracks();
    };
  }, [inCall, activeRoomId, startCamera, initWebRTC, stopAllMediaTracks]);

  // Criação Dinâmica e Instantânea de Nova Sala Efémera
  const handleCreateNewRoom = async () => {
    setIsCreatingRoom(true);
    try {
      const res = await fetch('/api/meet/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', participantId: participantIdRef.current }),
      });

      if (res.ok) {
        const data = await res.json();
        setActiveRoomId(data.roomId);
        if (data.dailyRoomUrl) {
          setDailyUrl(data.dailyRoomUrl);
        }
        if (typeof window !== 'undefined' && !isModal) {
          window.history.replaceState(null, '', `/dashboard/meet?room=${encodeURIComponent(data.roomId)}`);
        }
        setInCall(true);
      }
    } catch {
      setPermissionError('Falha de conexão ao criar sala de reunião.');
    } finally {
      setIsCreatingRoom(false);
    }
  };

  // Ingressar em Sala por Código
  const handleJoinExistingRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = joinInputId.trim().toUpperCase();
    if (!cleanId) return;

    setActiveRoomId(cleanId);
    if (typeof window !== 'undefined' && !isModal) {
      window.history.replaceState(null, '', `/dashboard/meet?room=${encodeURIComponent(cleanId)}`);
    }
    setInCall(true);
  };

  // Controles de Mídia: Microfone
  const toggleMic = () => {
    const nextState = !micOn;
    setMicOn(nextState);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = nextState;
      });
    }
  };

  // Controles de Mídia: Câmera
  const toggleCam = () => {
    const nextState = !camOn;
    setCamOn(nextState);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = nextState;
      });
    }
  };

  // Compartilhamento de Ecrã
  const toggleScreenShare = async () => {
    if (!screenShare) {
      try {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getDisplayMedia) {
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false,
          });

          screenStreamRef.current = stream;
          if (screenVideoRef.current) {
            screenVideoRef.current.srcObject = stream;
          }
          setScreenShare(true);

          // Ao encerrar compartilhamento pelo controle do navegador
          stream.getVideoTracks()[0].onended = () => {
            setScreenShare(false);
            if (screenStreamRef.current) {
              screenStreamRef.current.getTracks().forEach((t) => t.stop());
              screenStreamRef.current = null;
            }
          };
        }
      } catch {
        // Cancelado pelo usuário
      }
    } else {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setScreenShare(false);
    }
  };

  // Alternar Modo Tela Cheia
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen?.().catch(() => setIsFullscreen(false));
    }
  };

  // Copiar Link de Convite
  const handleCopyLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://lumiardi.com';
    const url = `${origin}/dashboard/meet?room=${encodeURIComponent(activeRoomId)}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Envio de Mensagens no Chat da Reunião
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'Você',
      text: chatInput.trim(),
      time: timeString,
      isMe: true,
    };

    setInMeetingMessages((prev) => [...prev, newMsg]);
    setChatInput('');
    setTimeout(() => {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  // Encerrar Chamada e Purgar Estados
  const handleEndCall = async () => {
    setIsEnding(true);
    stopAllMediaTracks();

    // Notifica o servidor para decrementar participantes ou destruir a sala se vazia
    try {
      if (activeRoomId) {
        await fetch('/api/meet/room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'leave',
            roomId: activeRoomId,
            participantId: participantIdRef.current,
          }),
        });
        await fetch('/api/meet/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'leave',
            roomId: activeRoomId,
            participantId: participantIdRef.current,
          }),
        });
      }
    } catch {
      // Ignora erro de rede ao sair
    }

    setInCall(false);
    setIsEnding(false);
    if (onClose) {
      onClose();
    }
  };

  // Estado Unificado de Conexão e Presença Remota
  const isCallConnected = Boolean(isPeerConnected || iceConnectionState === 'connected' || hasRemoteStream);

  // JSX do Widget
  const content = (
    <div
      ref={containerRef}
      onMouseMove={triggerUserActivity}
      onTouchStart={triggerUserActivity}
      className={`relative w-full bg-[#050505] text-ivory select-none overflow-hidden transition-all duration-300 font-sans ${
        isModal
          ? 'fixed inset-0 z-[80] h-screen w-screen flex flex-col justify-between rounded-none'
          : isFullscreen
          ? 'fixed inset-0 z-[9999] h-screen w-screen flex flex-col justify-between'
          : 'h-[calc(100vh-230px)] min-h-[580px] rounded-sm border border-gold/30 shadow-2xl flex flex-col justify-between'
      }`}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. CENÁRIO A: CHAMADA EM ANDAMENTO (CINEMA 1-ON-1 GRID)
         ───────────────────────────────────────────────────────────── */}
      {inCall ? (
        <div className="relative w-full h-full flex flex-col bg-black overflow-hidden">
          {/* Top Bar Minimalista Translúcida */}
          <div
            className={`absolute top-0 left-0 right-0 z-30 p-4 sm:p-5 flex items-center justify-between transition-opacity duration-300 pointer-events-auto bg-gradient-to-b from-black/80 via-black/40 to-transparent ${
              controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/40 flex items-center justify-center text-gold">
                <Shield className="w-4 h-4 text-gold" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif-lumiardi text-sm sm:text-base font-medium tracking-wide text-ivory">
                    Lumiardi Meet VIP
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="flex items-center gap-2 text-[11px] text-ivory/60 font-mono">
                  <span>Sala: <strong className="text-gold">{activeRoomId}</strong></span>
                  <span>·</span>
                  <CallTimer active={inCall} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-black/60 hover:bg-gold hover:text-black-matte border border-gold/40 text-gold text-xs font-medium rounded-full transition-all flex items-center gap-1.5 backdrop-blur-md cursor-pointer active:scale-95 shadow-lg"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copiedLink ? 'Link Copiado' : 'Copiar Convite'}</span>
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-2 bg-black/60 hover:bg-white/10 text-ivory/70 hover:text-gold border border-white/15 rounded-full transition-colors backdrop-blur-md cursor-pointer"
                title={isFullscreen ? 'Sair da Tela Cheia' : 'Modo Tela Cheia'}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>

              {isModal && onClose && (
                <button
                  onClick={handleEndCall}
                  className="p-2 bg-black/60 hover:bg-rose-500/30 text-ivory/70 hover:text-rose-400 border border-white/15 rounded-full transition-colors backdrop-blur-md cursor-pointer"
                  title="Fechar Janela"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Banner Discreto para Permissões Negadas */}
          {permissionError && (
            <div className="absolute top-16 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-xl z-40 bg-neutral-900/95 border border-gold/40 backdrop-blur-xl p-3 sm:p-4 rounded-sm shadow-2xl text-xs flex items-start gap-3 text-ivory animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="font-medium text-gold">{permissionError}</p>
                <p className="text-[11px] text-ivory/60">
                  Clique no ícone de cadeado na barra de endereço do navegador para permitir o uso da câmera e do microfone.
                </p>
              </div>
              <button
                onClick={startCamera}
                className="px-2.5 py-1 bg-gold text-black-matte text-[11px] font-semibold rounded-xs hover:bg-gold-light transition-colors shrink-0 cursor-pointer"
              >
                Tentar Novamente
              </button>
              <button
                onClick={() => setPermissionError(null)}
                className="text-ivory/40 hover:text-ivory p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* PALCO PRINCIPAL (INTERLOCUTOR OU TELA COMPARTILHADA) */}
          <div className="relative w-full h-full flex-1 bg-[#040404] flex items-center justify-center overflow-hidden">
            {dailyUrl ? (
              <iframe
                src={dailyUrl}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                className="w-full h-full border-0"
              />
            ) : screenShare ? (
              /* Transmissão de Ecrã */
              <div className="relative w-full h-full bg-black flex items-center justify-center">
                <video
                  ref={screenVideoRef}
                  autoPlay={true}
                  playsInline={true}
                  className="w-full h-full object-contain bg-black"
                />
                <div className="absolute top-20 left-6 bg-black/80 backdrop-blur-md px-3 py-1.5 text-xs text-gold border border-gold/40 flex items-center gap-2 rounded-full shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-gold animate-ping" />
                  <span className="text-[10px] uppercase font-mono tracking-wider">Apresentando Ecrã</span>
                </div>
              </div>
            ) : (
              <>
                {/* 1. VÍDEO DO INTERLOCUTOR REMOTO (Montado de forma permanente no DOM para reter mídia/áudio) */}
                <div
                  className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
                    isCallConnected && !swappedViews ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  <video
                    ref={remoteVideoRef}
                    autoPlay={true}
                    playsInline={true}
                    muted={false}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-20 left-6 bg-black/75 backdrop-blur-md px-3.5 py-1.5 text-xs text-ivory border border-white/10 rounded-full flex items-center gap-2 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-serif-lumiardi font-medium text-gold">
                      {remoteParticipant?.name || propCounterparty || 'Interlocutor VIP'}
                    </span>
                    <span className="text-[10px] text-ivory/50 font-mono">· HD E2E</span>
                  </div>
                </div>

                {/* 2. VÍDEO LOCAL NO PALCO PRINCIPAL (Quando o usuário inverteu a visão) */}
                <div
                  className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
                    isCallConnected && swappedViews ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  {camOn ? (
                    <video
                      ref={swappedViews ? localVideoRef : undefined}
                      autoPlay={true}
                      playsInline={true}
                      muted={true}
                      className="w-full h-full object-cover"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#101010] text-ivory/50">
                      <VideoOff className="w-8 h-8 text-rose-400 mb-2" />
                      <span className="text-xs">Sua câmera está desligada</span>
                    </div>
                  )}
                </div>

                {/* 3. LOUNGE DE ESPERA LUXO (Ocultado imediatamente assim que conectado) */}
                {!isCallConnected && (
                  <div className="relative w-full h-full bg-gradient-to-b from-[#090909] via-[#050505] to-black flex flex-col items-center justify-center text-center p-6 space-y-5 z-10">
                    <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/40 flex items-center justify-center text-gold relative shadow-2xl">
                      <span className="w-full h-full absolute rounded-full border border-gold/20 animate-ping opacity-60" />
                      <Shield className="w-8 h-8 text-gold" />
                    </div>

                    <div className="max-w-md space-y-2 z-10">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/10 border border-gold/30 rounded-full text-[10px] uppercase font-mono tracking-widest text-gold">
                        <Lock className="w-3 h-3 text-gold" />
                        <span>Criptografia Ponta-a-Ponta Ativa</span>
                      </div>
                      <h3 className="font-serif-lumiardi text-2xl sm:text-3xl font-light text-ivory">
                        Aguardando Interlocutor...
                      </h3>
                      <p className="text-xs text-ivory/60 font-sans leading-relaxed">
                        Sua conexão executiva está segura. Envie o link de acesso para o participante entrar diretamente na sala.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-2 z-10">
                      <button
                        onClick={handleCopyLink}
                        className="px-5 py-2.5 bg-gradient-to-r from-gold to-gold-light hover:brightness-110 text-black-matte font-semibold text-xs uppercase tracking-wider rounded-full shadow-lg shadow-gold/15 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                      >
                        {copiedLink ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedLink ? 'Link Copiado!' : 'Copiar Convite'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 4. PICTURE-IN-PICTURE (FEED LOCAL OU MINIATURA DO OUTRO PARTICIPANTE) */}
            <div
              onClick={() => setSwappedViews(!swappedViews)}
              className={`absolute bottom-24 right-5 sm:bottom-28 sm:right-8 w-36 sm:w-52 aspect-video bg-neutral-950/85 border border-gold/40 rounded-sm shadow-2xl backdrop-blur-md overflow-hidden cursor-pointer z-20 group transition-all duration-300 hover:scale-105 hover:border-gold ${
                showChat ? 'sm:right-[340px]' : ''
              }`}
              title="Clique para alternar visão do palco"
            >
              {!swappedViews ? (
                camOn ? (
                  <video
                    ref={!swappedViews ? localVideoRef : undefined}
                    autoPlay={true}
                    playsInline={true}
                    muted={true}
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#101010] text-ivory/50">
                    <VideoOff className="w-5 h-5 text-rose-400 mb-1" />
                    <span className="text-[9px]">Câmera Desligada</span>
                  </div>
                )
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#101010] text-ivory/70 p-2 text-center">
                  <span className="text-[10px] text-gold font-medium truncate max-w-full">
                    {remoteParticipant?.name || 'Interlocutor VIP'}
                  </span>
                  <span className="text-[8px] text-ivory/40">Palco Invertido</span>
                </div>
              )}

              <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between pointer-events-none text-[9px] font-mono">
                <span className="bg-black/80 px-1.5 py-0.5 rounded-xs text-gold border border-white/10">
                  {swappedViews ? 'Palco Invertido' : 'Você'}
                </span>
                <span className="p-1 bg-black/80 rounded-full border border-white/10">
                  {micOn ? (
                    <Mic className="w-2.5 h-2.5 text-emerald-400" />
                  ) : (
                    <MicOff className="w-2.5 h-2.5 text-rose-400" />
                  )}
                </span>
              </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────
                PAINEL LATERAL: CHAT DA REUNIÃO (GAVETA DESLIZANTE)
               ───────────────────────────────────────────────────────────── */}
            {showChat && (
              <div className="absolute top-0 bottom-0 right-0 w-80 sm:w-84 max-w-full bg-[#080808]/95 backdrop-blur-2xl border-l border-gold/30 p-4 flex flex-col justify-between z-30 animate-in fade-in slide-in-from-right duration-300">
                <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-gold" />
                    <span className="font-serif-lumiardi text-sm text-ivory font-medium">Chat da Sala</span>
                    <span className="text-[10px] font-mono text-gold bg-gold/10 px-1.5 py-0.5 rounded-full">
                      {inMeetingMessages.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowChat(false)}
                    className="p-1 text-ivory/50 hover:text-gold transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Lista de Mensagens */}
                <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1 text-xs">
                  {inMeetingMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 text-ivory/40 space-y-1">
                      <MessageSquare className="w-6 h-6 text-gold/30 mb-1" />
                      <p className="text-xs">Nenhuma mensagem no momento.</p>
                      <p className="text-[10px]">Envie mensagens instantâneas nesta chamada.</p>
                    </div>
                  ) : (
                    inMeetingMessages.map((m) => (
                      <div
                        key={m.id}
                        className={`p-2.5 rounded-xs leading-relaxed ${
                          m.isMe
                            ? 'bg-gold/15 border border-gold/30 ml-4 text-ivory'
                            : 'bg-[#151515] border border-white/10 mr-4 text-ivory/90'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1 text-[10px]">
                          <span className={`font-semibold ${m.isMe ? 'text-gold' : 'text-ivory'}`}>{m.sender}</span>
                          <span className="text-ivory/40">{m.time}</span>
                        </div>
                        <p className="text-xs">{m.text}</p>
                      </div>
                    ))
                  )}
                  <div ref={chatMessagesEndRef} />
                </div>

                {/* Input de Envio */}
                <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-white/10 shrink-0">
                  <input
                    type="text"
                    placeholder="Mensagem rápida..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 bg-[#141414] border border-white/15 focus:border-gold px-3 py-2 text-xs text-ivory outline-none rounded-xs placeholder:text-ivory/30"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-gold text-black-matte font-bold rounded-xs hover:bg-gold-light transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              BARRA DE CONTROLES FLUTUANTE MINIMALISTA (ESTILO CINEMA)
             ───────────────────────────────────────────────────────────── */}
          <div
            className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-30 transition-all duration-500 pointer-events-auto ${
              controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
            }`}
          >
            <div className="bg-black/65 backdrop-blur-2xl border border-gold/30 rounded-full px-4 sm:px-6 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.85)] flex items-center gap-3 sm:gap-4">
              {/* Microfone */}
              <button
                onClick={toggleMic}
                className={`p-3 rounded-full transition-all cursor-pointer border shadow-md active:scale-95 ${
                  micOn
                    ? 'bg-[#181818]/90 text-ivory hover:text-gold border-white/10 hover:border-gold/50'
                    : 'bg-rose-950/80 border-rose-500 text-rose-300'
                }`}
                title={micOn ? 'Desativar Microfone' : 'Ativar Microfone'}
              >
                {micOn ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4" />}
              </button>

              {/* Câmera */}
              <button
                onClick={toggleCam}
                className={`p-3 rounded-full transition-all cursor-pointer border shadow-md active:scale-95 ${
                  camOn
                    ? 'bg-[#181818]/90 text-ivory hover:text-gold border-white/10 hover:border-gold/50'
                    : 'bg-rose-950/80 border-rose-500 text-rose-300'
                }`}
                title={camOn ? 'Desligar Câmera' : 'Ligar Câmera'}
              >
                {camOn ? <VideoIcon className="w-4 h-4 text-emerald-400" /> : <VideoOff className="w-4 h-4" />}
              </button>

              {/* Compartilhamento de Ecrã */}
              <button
                onClick={toggleScreenShare}
                className={`p-3 rounded-full transition-all cursor-pointer border shadow-md active:scale-95 ${
                  screenShare
                    ? 'bg-gold text-black-matte border-gold font-bold shadow-gold/30'
                    : 'bg-[#181818]/90 text-ivory hover:text-gold border-white/10 hover:border-gold/50'
                }`}
                title={screenShare ? 'Interromper Apresentação' : 'Partilhar Ecrã'}
              >
                <MonitorUp className="w-4 h-4" />
              </button>

              {/* Chat Lateral */}
              <button
                onClick={() => {
                  setShowChat(!showChat);
                  setUnreadChatCount(0);
                }}
                className={`p-3 rounded-full transition-all cursor-pointer border shadow-md relative active:scale-95 ${
                  showChat
                    ? 'bg-gold text-black-matte border-gold font-bold shadow-gold/30'
                    : 'bg-[#181818]/90 text-ivory hover:text-gold border-white/10 hover:border-gold/50'
                }`}
                title="Abrir Chat da Reunião"
              >
                <MessageSquare className="w-4 h-4" />
                {unreadChatCount > 0 && !showChat && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold text-black-matte text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadChatCount}
                  </span>
                )}
              </button>

              {/* Encerrar Chamada */}
              <button
                onClick={handleEndCall}
                disabled={isEnding}
                className="p-3 bg-rose-600/85 hover:bg-rose-600 text-white rounded-full transition-all cursor-pointer border border-rose-500 shadow-lg shadow-rose-950/50 active:scale-95 ml-1"
                title="Encerrar Chamada"
              >
                <PhoneOff className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            2. CENÁRIO B: LOBBY EXECUTIVO MINIMALISTA (SEM MOCKS)
           ───────────────────────────────────────────────────────────── */
        <div className="w-full h-full flex flex-col items-center justify-center p-6 sm:p-12 text-center relative bg-gradient-to-b from-[#090909] to-[#040404]">
          {isModal && onClose && (
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-ivory/50 hover:text-gold transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="max-w-lg space-y-6">
            <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold mx-auto shadow-2xl">
              <VideoIcon className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/10 border border-gold/30 rounded-full text-[10px] uppercase font-mono tracking-widest text-gold">
                <Sparkles className="w-3 h-3 text-gold" />
                <span>Videoconferência Executiva VIP</span>
              </div>
              <h2 className="font-serif-lumiardi text-3xl sm:text-4xl font-light text-ivory">
                {t('dash_page_meet_title') || 'Lumiardi Meet'}
              </h2>
              <p className="text-xs sm:text-sm text-ivory/60 font-sans leading-relaxed">
                Ambiente de videoconferência privada criptografada E2E para alinhamentos contratuais, audições de casting e curadoria exclusiva.
              </p>
            </div>

            {/* Ações Rápidas do Lobby */}
            <div className="space-y-4 pt-4">
              <button
                onClick={handleCreateNewRoom}
                disabled={isCreatingRoom}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-gold to-gold-light hover:brightness-110 text-black-matte font-semibold text-xs uppercase tracking-wider rounded-full shadow-xl shadow-gold/15 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isCreatingRoom ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-black-matte" />
                    <span>Gerando Conexão Segura...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-black-matte" />
                    <span>Iniciar Nova Reunião VIP</span>
                  </>
                )}
              </button>

              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-white/10 w-full" />
                <span className="bg-[#070707] px-3 text-[11px] text-ivory/40 uppercase font-mono tracking-wider">
                  ou aceder por código
                </span>
              </div>

              <form onSubmit={handleJoinExistingRoom} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: LM-9A4B2C-VIP"
                  value={joinInputId}
                  onChange={(e) => setJoinInputId(e.target.value)}
                  className="flex-1 bg-[#121212] border border-white/15 focus:border-gold px-4 py-3 text-xs font-mono text-ivory outline-none rounded-full placeholder:text-ivory/30"
                />
                <button
                  type="submit"
                  disabled={!joinInputId.trim()}
                  className="px-5 py-3 bg-[#1c1c1c] hover:bg-gold hover:text-black-matte text-gold border border-gold/30 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                >
                  <span>Entrar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isModal && typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }

  return content;
};
