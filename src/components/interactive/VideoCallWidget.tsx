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
  LayoutGrid,
  Square,
  User,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuthPortal } from '@/context/AuthPortalContext';

import {
  Room as LiveKitRoom,
  RoomEvent,
  Track,
  RemoteTrack,
  RemoteParticipant as LiveKitRemoteParticipant,
  VideoPresets,
  ScreenSharePresets,
} from 'livekit-client';

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

// Configuração de STUN + TURN Servers (Travessia de NAT Restrito / CGNAT para fallback)
const peerConnectionConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:openrelay.metered.ca:80' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
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
  const { currentUser, activeCreator, activeAgency } = useAuthPortal();
  const searchParams = useSearchParams();

  // Sala ativa
  const initialRoom = propRoomId || searchParams.get('room') || '';
  const [activeRoomId, setActiveRoomId] = useState<string>(initialRoom);
  const [joinInputId, setJoinInputId] = useState<string>('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  // Estados da Chamada
  const [inCall, setInCall] = useState<boolean>(Boolean(initialRoom || autoStart));
  const [isEnding, setIsEnding] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenShare, setScreenShare] = useState(false);
  const [hasRemoteScreenShare, setHasRemoteScreenShare] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [swappedViews, setSwappedViews] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'spotlight'>('grid');

  // Tratamento de Permissões Negadas
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Interlocutor e Streams
  const [remoteParticipant, setRemoteParticipant] = useState<{ id: string; name: string } | null>(null);
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [dailyUrl, setDailyUrl] = useState<string | null>(null);
  const [iceConnectionState, setIceConnectionState] = useState<RTCIceConnectionState>('new');
  const [isPeerConnected, setIsPeerConnected] = useState<boolean>(false);

  // Refs de Negociação WebRTC & LiveKit
  const isPeerConnectedRef = useRef<boolean>(false);
  const hasRemoteStreamRef = useRef<boolean>(false);
  const livekitRoomRef = useRef<LiveKitRoom | null>(null);
  const roleRef = useRef<'caller' | 'callee' | null>(null);
  const hasCreatedOfferRef = useRef<boolean>(false);
  const lastOfferTimeRef = useRef<number>(0);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteScreenTrackRef = useRef<RemoteTrack | null>(null);

  // Chat interno durante a chamada
  const [inMeetingMessages, setInMeetingMessages] = useState<
    Array<{ id: string; sender: string; text: string; time: string; isMe: boolean }>
  >([]);
  const [chatInput, setChatInput] = useState('');
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Refs de Hardware e Vídeo
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteScreenVideoRef = useRef<HTMLVideoElement | null>(null);

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

  // Notificação de saída instantânea ao fechar ou atualizar aba
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeRoomId && participantIdRef.current) {
        const payload = JSON.stringify({
          action: 'leave',
          roomId: activeRoomId,
          participantId: participantIdRef.current,
        });
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          navigator.sendBeacon('/api/meet/signal', payload);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, [activeRoomId]);

  // Limpeza Completa de Recursos de Mídia (Zero Memory Leaks)
  const stopAllMediaTracks = useCallback(() => {
    if (livekitRoomRef.current) {
      livekitRoomRef.current.disconnect().catch(() => {});
      livekitRoomRef.current = null;
    }
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
    if (remoteScreenVideoRef.current) remoteScreenVideoRef.current.srcObject = null;

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
    lastOfferTimeRef.current = 0;
    pendingCandidatesRef.current = [];
    remoteScreenTrackRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setHasRemoteStream(false);
    setHasRemoteScreenShare(false);
    setScreenShare(false);
    setIsPeerConnected(false);
    setIceConnectionState('new');
  }, []);

  // Callback Refs para garantir reconexão automática e reprodução ao trocar de tela / layout
  const localVideoCallbackRef = useCallback((el: HTMLVideoElement | null) => {
    localVideoRef.current = el;
    if (el) {
      if (livekitRoomRef.current) {
        const vidPub = Array.from(livekitRoomRef.current.localParticipant.videoTrackPublications.values()).find(
          (p) => p.source === Track.Source.Camera && p.track
        );
        if (vidPub?.track) {
          vidPub.track.attach(el);
          el.muted = true;
          el.play().catch(() => {});
        }
      } else if (localStreamRef.current && el.srcObject !== localStreamRef.current) {
        el.srcObject = localStreamRef.current;
        el.muted = true;
        el.play().catch(() => {});
      }
    }
  }, []);

  const remoteVideoCallbackRef = useCallback((el: HTMLVideoElement | null) => {
    remoteVideoRef.current = el;
    if (el) {
      if (livekitRoomRef.current) {
        const remote = Array.from(livekitRoomRef.current.remoteParticipants.values())[0];
        if (remote) {
          const vidPub = Array.from(remote.videoTrackPublications.values()).find(
            (p) => p.source === Track.Source.Camera && p.track
          );
          if (vidPub?.track) {
            vidPub.track.attach(el);
            el.muted = false;
            el.volume = 1.0;
            el.play().catch(() => {});
          }
        }
      } else if (remoteStreamRef.current && el.srcObject !== remoteStreamRef.current) {
        el.srcObject = remoteStreamRef.current;
        el.muted = false;
        el.volume = 1.0;
        el.play().catch(() => {});
      }
    }
  }, []);

  const screenVideoCallbackRef = useCallback((el: HTMLVideoElement | null) => {
    screenVideoRef.current = el;
    if (el) {
      if (livekitRoomRef.current) {
        const screenPub = Array.from(livekitRoomRef.current.localParticipant.videoTrackPublications.values()).find(
          (p) => p.source === Track.Source.ScreenShare && p.track
        );
        if (screenPub?.track) {
          screenPub.track.attach(el);
          el.play().catch(() => {});
        }
      } else if (screenStreamRef.current && el.srcObject !== screenStreamRef.current) {
        el.srcObject = screenStreamRef.current;
        el.play().catch(() => {});
      }
    }
  }, []);

  const remoteScreenVideoCallbackRef = useCallback((el: HTMLVideoElement | null) => {
    remoteScreenVideoRef.current = el;
    if (el && remoteScreenTrackRef.current) {
      remoteScreenTrackRef.current.attach(el);
      el.play().catch(() => {});
    }
  }, []);

  // Captura Segura Fallback HD
  const startCamera = useCallback(async (): Promise<MediaStream> => {
    setPermissionError(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      const emptyStream = new MediaStream();
      localStreamRef.current = emptyStream;
      setLocalStream(emptyStream);
      setCamOn(false);
      setMicOn(false);
      return emptyStream;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 24 },
          facingMode: 'user',
        },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setCamOn(true);
      setMicOn(true);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        localVideoRef.current.play().catch(() => {});
      }
      return stream;
    } catch {
      // Fallback sem restrições
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        setLocalStream(stream);
        setCamOn(true);
        setMicOn(true);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          localVideoRef.current.play().catch(() => {});
        }
        return stream;
      } catch {
        const emptyStream = new MediaStream();
        localStreamRef.current = emptyStream;
        setLocalStream(emptyStream);
        setCamOn(false);
        setMicOn(false);
        setPermissionError(
          'Câmera ou microfone não detectados ou bloqueados. Verifique as permissões do seu navegador.'
        );
        return emptyStream;
      }
    }
  }, []);

  // WebRTC PeerConnection & Sinalização Fallback
  const initWebRTC = useCallback(
    async (roomId: string, currentLocalStream: MediaStream) => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      roleRef.current = null;
      hasCreatedOfferRef.current = false;
      lastOfferTimeRef.current = 0;
      pendingCandidatesRef.current = [];

      const pc = new RTCPeerConnection(peerConnectionConfig);
      peerConnectionRef.current = pc;

      const audioTracks = currentLocalStream.getAudioTracks();
      const videoTracks = currentLocalStream.getVideoTracks();

      if (audioTracks.length > 0) {
        audioTracks.forEach((track) => pc.addTrack(track, currentLocalStream));
      } else {
        pc.addTransceiver('audio', { direction: 'recvonly' });
      }

      if (videoTracks.length > 0) {
        videoTracks.forEach((track) => pc.addTrack(track, currentLocalStream));
      } else {
        pc.addTransceiver('video', { direction: 'recvonly' });
      }

      const sendSignal = async (type: 'offer' | 'answer' | 'candidate', rawData: unknown) => {
        try {
          let data = rawData;
          if (rawData && typeof rawData === 'object') {
            if ('type' in rawData && 'sdp' in rawData) {
              data = { type: (rawData as { type: string }).type, sdp: (rawData as { sdp: string }).sdp };
            } else if (typeof (rawData as { toJSON?: () => unknown }).toJSON === 'function') {
              data = (rawData as { toJSON: () => unknown }).toJSON();
            }
          }
          await fetch('/api/meet/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'signal',
              roomId,
              participantId: participantIdRef.current,
              signalType: type,
              data,
            }),
          });
        } catch {}
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal('candidate', event.candidate);
        }
      };

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          const s = event.streams[0];
          remoteStreamRef.current = s;
          setRemoteStream(s);
          setHasRemoteStream(true);
          hasRemoteStreamRef.current = true;
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = s;
            remoteVideoRef.current.muted = false;
            remoteVideoRef.current.volume = 1.0;
            remoteVideoRef.current.play().catch(() => {});
          }
        }
      };

      pc.oniceconnectionstatechange = () => {
        setIceConnectionState(pc.iceConnectionState);
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setIsPeerConnected(true);
          isPeerConnectedRef.current = true;
        }
      };

      try {
        const myDisplayName =
          activeCreator?.qualitative?.artisticName ||
          activeAgency?.basicInfo?.responsibleName ||
          currentUser?.name ||
          'Membro VIP';

        await fetch('/api/meet/signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'join',
            roomId,
            participantId: participantIdRef.current,
            participantName: myDisplayName,
          }),
        });
      } catch {}

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

          if (Array.isArray(pollData.participants)) {
            const other = pollData.participants.find(
              (p: { id: string; name: string }) => p.id !== participantIdRef.current
            );
            if (other) {
              setRemoteParticipant({ id: other.id, name: other.name });
              const isCaller = participantIdRef.current < other.id;
              roleRef.current = isCaller ? 'caller' : 'callee';

              if (isCaller && !isPeerConnectedRef.current && !hasRemoteStreamRef.current) {
                if (pc.signalingState === 'stable' && !hasCreatedOfferRef.current) {
                  hasCreatedOfferRef.current = true;
                  lastOfferTimeRef.current = Date.now();
                  const offer = await pc.createOffer();
                  await pc.setLocalDescription(offer);
                  await sendSignal('offer', { type: offer.type, sdp: offer.sdp });
                }
              }
            } else {
              setRemoteParticipant(null);
            }
          }

          if (Array.isArray(pollData.signals)) {
            for (const sig of pollData.signals) {
              if (sig.type === 'offer') {
                const offerData = typeof sig.data === 'string' ? JSON.parse(sig.data) : sig.data;
                if (offerData && offerData.sdp) {
                  await pc.setRemoteDescription(new RTCSessionDescription(offerData));
                  while (pendingCandidatesRef.current.length > 0) {
                    const cand = pendingCandidatesRef.current.shift();
                    if (cand) {
                      try {
                        await pc.addIceCandidate(new RTCIceCandidate(cand));
                      } catch {}
                    }
                  }
                  const answer = await pc.createAnswer();
                  await pc.setLocalDescription(answer);
                  await sendSignal('answer', { type: answer.type, sdp: answer.sdp });
                }
              } else if (sig.type === 'answer') {
                const answerData = typeof sig.data === 'string' ? JSON.parse(sig.data) : sig.data;
                if (answerData && answerData.sdp && pc.signalingState === 'have-local-offer') {
                  await pc.setRemoteDescription(new RTCSessionDescription(answerData));
                  while (pendingCandidatesRef.current.length > 0) {
                    const cand = pendingCandidatesRef.current.shift();
                    if (cand) {
                      try {
                        await pc.addIceCandidate(new RTCIceCandidate(cand));
                      } catch {}
                    }
                  }
                }
              } else if (sig.type === 'candidate') {
                const candData = typeof sig.data === 'string' ? JSON.parse(sig.data) : sig.data;
                if (candData && candData.candidate !== undefined) {
                  if (pc.remoteDescription && pc.remoteDescription.type) {
                    try {
                      await pc.addIceCandidate(new RTCIceCandidate(candData));
                    } catch {}
                  } else {
                    pendingCandidatesRef.current.push(candData);
                  }
                }
              }
            }
          }
        } catch {}
      };

      signalingPollRef.current = setInterval(runPoll, 1000);
    },
    [activeCreator, activeAgency, currentUser]
  );

  // Conexão LiveKit Cloud com Alta Resolução 720p/1080p e Detecção de Compartilhamento de Tela
  const initLiveKit = useCallback(
    async (roomId: string): Promise<boolean> => {
      try {
        const myDisplayName =
          activeCreator?.qualitative?.artisticName ||
          activeAgency?.basicInfo?.responsibleName ||
          currentUser?.name ||
          'Membro VIP Lumiardi';

        const tokenRes = await fetch('/api/meet/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            participantId: participantIdRef.current,
            participantName: myDisplayName,
          }),
        });

        if (!tokenRes.ok) return false;
        const data = await tokenRes.json();

        if (!data.success || !data.token || !data.serverUrl) {
          return false;
        }

        if (livekitRoomRef.current) {
          await livekitRoomRef.current.disconnect();
          livekitRoomRef.current = null;
        }

        const room = new LiveKitRoom({
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: {
            resolution: VideoPresets.h720.resolution,
            facingMode: 'user',
          },
          publishDefaults: {
            videoEncoding: VideoPresets.h720.encoding,
            screenShareEncoding: ScreenSharePresets.h1080fps30.encoding,
            simulcast: true,
            videoCodec: 'vp8',
          },
        });
        livekitRoomRef.current = room;

        // 1. Participante conecta
        room.on(RoomEvent.ParticipantConnected, (participant: LiveKitRemoteParticipant) => {
          setRemoteParticipant({ id: participant.identity, name: participant.name || participant.identity });
          setIsPeerConnected(true);
          isPeerConnectedRef.current = true;
        });

        // 2. Participante desconecta
        room.on(RoomEvent.ParticipantDisconnected, () => {
          if (room.remoteParticipants.size === 0) {
            setRemoteParticipant(null);
            setHasRemoteStream(false);
            hasRemoteStreamRef.current = false;
            setHasRemoteScreenShare(false);
            remoteScreenTrackRef.current = null;
            setIsPeerConnected(false);
            isPeerConnectedRef.current = false;
          }
        });

        // 3. Faixa de mídia inscrita (Câmera, Microfone ou Tela Compartilhada)
        room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, publication, participant: LiveKitRemoteParticipant) => {
          if (track.kind === Track.Kind.Video) {
            if (track.source === Track.Source.ScreenShare) {
              remoteScreenTrackRef.current = track;
              setHasRemoteScreenShare(true);
              if (remoteScreenVideoRef.current) {
                track.attach(remoteScreenVideoRef.current);
                remoteScreenVideoRef.current.play().catch(() => {});
              }
            } else {
              if (remoteVideoRef.current) {
                track.attach(remoteVideoRef.current);
                remoteVideoRef.current.play().catch(() => {});
              }
              setHasRemoteStream(true);
              hasRemoteStreamRef.current = true;
            }
          } else if (track.kind === Track.Kind.Audio) {
            track.attach();
          }
          setRemoteParticipant({ id: participant.identity, name: participant.name || participant.identity });
          setIsPeerConnected(true);
          isPeerConnectedRef.current = true;
        });

        // 4. Faixa de mídia desinscrita
        room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
          track.detach();
          if (track.source === Track.Source.ScreenShare) {
            remoteScreenTrackRef.current = null;
            setHasRemoteScreenShare(false);
          } else if (track.kind === Track.Kind.Video) {
            setHasRemoteStream(false);
            hasRemoteStreamRef.current = false;
          }
        });

        // 5. Chat em tempo real via DataChannel
        room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: LiveKitRemoteParticipant) => {
          try {
            const str = new TextDecoder().decode(payload);
            const msg = JSON.parse(str);
            if (msg.text) {
              setInMeetingMessages((prev) => [
                ...prev,
                {
                  id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
                  sender: participant?.name || 'Interlocutor',
                  text: msg.text,
                  time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                  isMe: false,
                },
              ]);
              setUnreadChatCount((c) => c + 1);
            }
          } catch {}
        });

        await room.connect(data.serverUrl, data.token);

        // 6. Sincroniza participantes que já estavam na sala
        if (room.remoteParticipants.size > 0) {
          const firstRemote = Array.from(room.remoteParticipants.values())[0];
          setRemoteParticipant({ id: firstRemote.identity, name: firstRemote.name || firstRemote.identity });
          setIsPeerConnected(true);
          isPeerConnectedRef.current = true;

          firstRemote.trackPublications.forEach((pub) => {
            if (pub.track) {
              if (pub.track.source === Track.Source.ScreenShare) {
                remoteScreenTrackRef.current = pub.track;
                setHasRemoteScreenShare(true);
                if (remoteScreenVideoRef.current) {
                  pub.track.attach(remoteScreenVideoRef.current);
                  remoteScreenVideoRef.current.play().catch(() => {});
                }
              } else if (pub.track.kind === Track.Kind.Video && remoteVideoRef.current) {
                pub.track.attach(remoteVideoRef.current);
                remoteVideoRef.current.play().catch(() => {});
                setHasRemoteStream(true);
                hasRemoteStreamRef.current = true;
              } else if (pub.track.kind === Track.Kind.Audio) {
                pub.track.attach();
              }
            }
          });
        }

        // 7. Ativa Câmera HD 720p e Microfone com Cancelamento de Ruído
        try {
          await room.localParticipant.setCameraEnabled(true, {
            resolution: VideoPresets.h720.resolution,
          });
          await room.localParticipant.setMicrophoneEnabled(true, {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          });
          const videoPub = Array.from(room.localParticipant.videoTrackPublications.values()).find(
            (p) => p.source === Track.Source.Camera
          );
          if (videoPub?.track && localVideoRef.current) {
            videoPub.track.attach(localVideoRef.current);
            localVideoRef.current.muted = true;
            localVideoRef.current.play().catch(() => {});
          }
          setCamOn(true);
          setMicOn(true);
        } catch (mediaErr) {
          console.warn('Erro ao ativar câmera/microfone via LiveKit:', mediaErr);
        }

        return true;
      } catch (err) {
        console.warn('LiveKit init falhou, recorrendo a WebRTC:', err);
        return false;
      }
    },
    [activeCreator, activeAgency, currentUser]
  );

  // Inicialização quando a chamada é ativada
  useEffect(() => {
    let mounted = true;

    if (inCall && activeRoomId) {
      (async () => {
        try {
          const statusRes = await fetch('/api/meet/room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'status', roomId: activeRoomId }),
          });
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData.dailyRoomUrl) {
              setDailyUrl(statusData.dailyRoomUrl);
              return;
            }
          }
        } catch {}

        if (!mounted) return;

        const livekitOk = await initLiveKit(activeRoomId);
        if (!livekitOk && mounted) {
          const stream = await startCamera();
          if (mounted && stream) {
            await initWebRTC(activeRoomId, stream);
          }
        }
      })();
    }

    return () => {
      mounted = false;
      stopAllMediaTracks();
    };
  }, [inCall, activeRoomId, initLiveKit, initWebRTC, startCamera, stopAllMediaTracks]);

  // Criação de Nova Sala
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
  const toggleMic = async () => {
    const nextState = !micOn;
    setMicOn(nextState);
    if (livekitRoomRef.current) {
      try {
        await livekitRoomRef.current.localParticipant.setMicrophoneEnabled(nextState);
      } catch {}
    }
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = nextState;
      });
    }
  };

  // Controles de Mídia: Câmera
  const toggleCam = async () => {
    const nextState = !camOn;
    setCamOn(nextState);
    if (livekitRoomRef.current) {
      try {
        await livekitRoomRef.current.localParticipant.setCameraEnabled(nextState, {
          resolution: VideoPresets.h720.resolution,
        });
        if (nextState) {
          const videoPub = Array.from(livekitRoomRef.current.localParticipant.videoTrackPublications.values()).find(
            (p) => p.source === Track.Source.Camera
          );
          if (videoPub?.track && localVideoRef.current) {
            videoPub.track.attach(localVideoRef.current);
            localVideoRef.current.muted = true;
            localVideoRef.current.play().catch(() => {});
          }
        }
      } catch {}
    }
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = nextState;
      });
    }
  };

  // Compartilhamento de Ecrã em Alta Definição 1080p
  const toggleScreenShare = async () => {
    if (!screenShare) {
      if (livekitRoomRef.current) {
        try {
          await livekitRoomRef.current.localParticipant.setScreenShareEnabled(
            true,
            { audio: false },
            { screenShareEncoding: ScreenSharePresets.h1080fps30.encoding }
          );
          setScreenShare(true);
          const screenPub = Array.from(livekitRoomRef.current.localParticipant.videoTrackPublications.values()).find(
            (p) => p.source === Track.Source.ScreenShare
          );
          if (screenPub?.track && screenVideoRef.current) {
            screenPub.track.attach(screenVideoRef.current);
            screenVideoRef.current.play().catch(() => {});
          }
          if (screenPub?.track) {
            screenPub.track.mediaStreamTrack.onended = () => {
              setScreenShare(false);
            };
          }
        } catch (err) {
          console.warn('Compartilhamento cancelado:', err);
        }
      } else {
        try {
          if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getDisplayMedia) {
            const stream = await navigator.mediaDevices.getDisplayMedia({
              video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
              audio: false,
            });

            screenStreamRef.current = stream;
            if (screenVideoRef.current) {
              screenVideoRef.current.srcObject = stream;
              screenVideoRef.current.play().catch(() => {});
            }
            setScreenShare(true);

            stream.getVideoTracks()[0].onended = () => {
              setScreenShare(false);
              if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach((t) => t.stop());
                screenStreamRef.current = null;
              }
            };
          }
        } catch {}
      }
    } else {
      if (livekitRoomRef.current) {
        try {
          await livekitRoomRef.current.localParticipant.setScreenShareEnabled(false);
        } catch {}
      }
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

    const messageText = chatInput.trim();
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'Você',
      text: messageText,
      time: timeString,
      isMe: true,
    };

    if (livekitRoomRef.current) {
      try {
        const payload = new TextEncoder().encode(JSON.stringify({ text: messageText }));
        livekitRoomRef.current.localParticipant.publishData(payload, { reliable: true });
      } catch {}
    }

    setInMeetingMessages((prev) => [...prev, newMsg]);
    setChatInput('');
    setTimeout(() => {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  // Encerrar Chamada
  const handleEndCall = async () => {
    setIsEnding(true);
    stopAllMediaTracks();

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
    } catch {}

    setInCall(false);
    setIsEnding(false);
    if (onClose) {
      onClose();
    }
  };

  // Estado Unificado de Conexão
  const isCallConnected = Boolean(isPeerConnected || iceConnectionState === 'connected' || hasRemoteStream);
  const isPresentationActive = Boolean(screenShare || hasRemoteScreenShare);

  // Nome do Interlocutor para Exibição
  const interlocutorName = remoteParticipant?.name || propCounterparty || 'Interlocutor VIP';
  const myDisplayName =
    activeCreator?.qualitative?.artisticName ||
    activeAgency?.basicInfo?.responsibleName ||
    currentUser?.name ||
    'Você';

  // Conteúdo Principal
  const content = (
    <div
      ref={containerRef}
      className={`relative w-full bg-[#0a0a0c] text-ivory select-none overflow-hidden transition-all duration-300 font-sans ${
        isModal
          ? 'fixed inset-0 z-[80] h-screen w-screen flex flex-col justify-between rounded-none'
          : isFullscreen
          ? 'fixed inset-0 z-[9999] h-screen w-screen flex flex-col justify-between'
          : 'h-[calc(100vh-180px)] min-h-[580px] rounded-2xl border border-white/10 shadow-2xl flex flex-col justify-between'
      }`}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. CENÁRIO A: CHAMADA EM ANDAMENTO (GOOGLE MEET ARCHITECTURE)
         ───────────────────────────────────────────────────────────── */}
      {inCall ? (
        <div className="relative w-full h-full flex flex-col bg-[#0a0a0c] overflow-hidden">
          {/* TOP BAR: Cabeçalho Estilo Google Meet */}
          <header className="h-14 sm:h-16 px-4 sm:px-6 bg-[#0e0e11] border-b border-white/10 flex items-center justify-between shrink-0 z-30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/40 flex items-center justify-center text-gold">
                <Shield className="w-4 h-4 text-gold" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-serif-lumiardi text-sm sm:text-base font-medium tracking-wide text-ivory">
                    Lumiardi Meet VIP
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="flex items-center gap-2 text-[11px] text-ivory/60 font-mono">
                  <span>
                    Sala: <strong className="text-gold">{activeRoomId}</strong>
                  </span>
                  <span>·</span>
                  <CallTimer active={inCall} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Botão de Alternar Modo Mosaico vs Destaque */}
              {!isPresentationActive && isCallConnected && (
                <button
                  onClick={() => setLayoutMode(layoutMode === 'grid' ? 'spotlight' : 'grid')}
                  className="px-3 py-1.5 bg-[#18181c] hover:bg-[#222228] text-ivory/80 hover:text-gold border border-white/10 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title={layoutMode === 'grid' ? 'Mudar para modo Destaque' : 'Mudar para modo Mosaico'}
                >
                  {layoutMode === 'grid' ? <Square className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
                  <span className="hidden md:inline">{layoutMode === 'grid' ? 'Foco' : 'Mosaico'}</span>
                </button>
              )}

              {/* Botão Copiar Convite */}
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-black/60 hover:bg-gold hover:text-black-matte border border-gold/40 text-gold text-xs font-medium rounded-full transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-md"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copiedLink ? 'Link Copiado' : 'Copiar Convite'}</span>
              </button>

              {/* Tela Cheia */}
              <button
                onClick={toggleFullscreen}
                className="p-2 bg-[#18181c] hover:bg-[#222228] text-ivory/70 hover:text-gold border border-white/10 rounded-full transition-colors cursor-pointer"
                title={isFullscreen ? 'Sair da Tela Cheia' : 'Modo Tela Cheia'}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>

              {/* Fechar Modal */}
              {isModal && onClose && (
                <button
                  onClick={handleEndCall}
                  className="p-2 bg-[#18181c] hover:bg-rose-500/20 text-ivory/70 hover:text-rose-400 border border-white/10 rounded-full transition-colors cursor-pointer"
                  title="Fechar Janela"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </header>

          {/* Banner de Permissões Negadas */}
          {permissionError && (
            <div className="absolute top-16 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-xl z-40 bg-neutral-900/95 border border-gold/40 backdrop-blur-xl p-3 sm:p-4 rounded-xl shadow-2xl text-xs flex items-start gap-3 text-ivory">
              <AlertCircle className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="font-medium text-gold">{permissionError}</p>
                <p className="text-[11px] text-ivory/60">
                  Verifique se a câmera e microfone estão permitidos nas configurações do navegador.
                </p>
              </div>
              <button
                onClick={startCamera}
                className="px-2.5 py-1 bg-gold text-black-matte text-[11px] font-semibold rounded-md hover:bg-gold-light transition-colors shrink-0 cursor-pointer"
              >
                Tentar Novamente
              </button>
              <button onClick={() => setPermissionError(null)} className="text-ivory/40 hover:text-ivory p-1 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* PALCO CENTRAL + CHAT LATERAL */}
          <div className="relative flex-1 flex overflow-hidden min-h-0 bg-[#09090b]">
            {/* ÁREA DE VÍDEO PRINCIPAL */}
            <main className="relative flex-1 flex items-center justify-center p-2 sm:p-4 min-h-0 overflow-hidden">
              {dailyUrl ? (
                <iframe
                  src={dailyUrl}
                  allow="camera; microphone; fullscreen; display-capture; autoplay"
                  className="w-full h-full border-0 rounded-2xl"
                />
              ) : isPresentationActive ? (
                /* ─────────────────────────────────────────────────────────────
                   MODO APRESENTAÇÃO: TELA COMPARTILHADA (1080p, OBJECT-CONTAIN)
                   ───────────────────────────────────────────────────────────── */
                <div className="relative w-full h-full flex flex-col lg:flex-row gap-3 items-center justify-center">
                  {/* Card da Apresentação */}
                  <div className="relative flex-1 w-full h-full rounded-2xl bg-black border border-white/10 overflow-hidden flex items-center justify-center shadow-2xl">
                    {screenShare ? (
                      <video
                        ref={screenVideoCallbackRef}
                        autoPlay={true}
                        playsInline={true}
                        className="w-full h-full object-contain bg-black"
                      />
                    ) : (
                      <video
                        ref={remoteScreenVideoCallbackRef}
                        autoPlay={true}
                        playsInline={true}
                        className="w-full h-full object-contain bg-black"
                      />
                    )}

                    {/* Banner de Status da Apresentação */}
                    <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-gold/40 flex items-center gap-2 text-xs">
                      <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                      <span className="text-gold font-medium">
                        {screenShare ? 'Você está compartilhando a tela' : `${interlocutorName} está apresentando a tela`}
                      </span>
                      {screenShare && (
                        <button
                          onClick={toggleScreenShare}
                          className="ml-2 px-2 py-0.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-full text-[10px] cursor-pointer"
                        >
                          Parar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Barra Lateral / Faixa Inferior de Webcams durante Apresentação */}
                  <div className="flex lg:flex-col gap-3 shrink-0 overflow-x-auto max-w-full">
                    {/* Interlocutor Câmera */}
                    <div className="relative w-36 sm:w-48 aspect-video rounded-xl bg-[#141417] border border-white/10 overflow-hidden shadow-lg shrink-0 flex items-center justify-center">
                      <video
                        ref={remoteVideoCallbackRef}
                        autoPlay={true}
                        playsInline={true}
                        muted={false}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-1.5 left-2 bg-black/70 px-2 py-0.5 rounded-md text-[10px] text-ivory/80 truncate max-w-[85%] font-medium">
                        {interlocutorName}
                      </div>
                    </div>

                    {/* Você Câmera */}
                    <div className="relative w-36 sm:w-48 aspect-video rounded-xl bg-[#141417] border border-white/10 overflow-hidden shadow-lg shrink-0 flex items-center justify-center">
                      {camOn ? (
                        <video
                          ref={localVideoCallbackRef}
                          autoPlay={true}
                          playsInline={true}
                          muted={true}
                          className="w-full h-full object-cover"
                          style={{ transform: 'scaleX(-1)' }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-ivory/40">
                          <VideoOff className="w-5 h-5 mb-1" />
                          <span className="text-[9px]">Câmera Desligada</span>
                        </div>
                      )}
                      <div className="absolute bottom-1.5 left-2 bg-black/70 px-2 py-0.5 rounded-md text-[10px] text-gold font-medium">
                        Você
                      </div>
                    </div>
                  </div>
                </div>
              ) : isCallConnected ? (
                /* ─────────────────────────────────────────────────────────────
                   MODO NORMAL: GRID (LADO A LADO) OU SPOTLIGHT (FOCO)
                   ───────────────────────────────────────────────────────────── */
                layoutMode === 'grid' ? (
                  /* 1. MODO MOSAICO (GOOGLE MEET SIDE-BY-SIDE 1-ON-1) */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 w-full h-full max-w-6xl mx-auto items-center justify-center">
                    {/* TILE 1: INTERLOCUTOR */}
                    <div className="relative w-full h-full max-h-[75vh] aspect-video md:aspect-[16/10] rounded-2xl bg-[#141417] border border-white/10 shadow-2xl overflow-hidden flex items-center justify-center">
                      <video
                        ref={remoteVideoCallbackRef}
                        autoPlay={true}
                        playsInline={true}
                        muted={false}
                        className="w-full h-full object-cover sm:object-contain md:object-cover"
                      />
                      {/* Chip de Identificação */}
                      <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 shadow-lg">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-xs font-serif-lumiardi font-medium text-gold">{interlocutorName}</span>
                      </div>
                    </div>

                    {/* TILE 2: VOCÊ */}
                    <div className="relative w-full h-full max-h-[75vh] aspect-video md:aspect-[16/10] rounded-2xl bg-[#141417] border border-white/10 shadow-2xl overflow-hidden flex items-center justify-center">
                      {camOn ? (
                        <video
                          ref={localVideoCallbackRef}
                          autoPlay={true}
                          playsInline={true}
                          muted={true}
                          className="w-full h-full object-cover sm:object-contain md:object-cover"
                          style={{ transform: 'scaleX(-1)' }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#101012] text-ivory/50 space-y-2">
                          <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
                            <User className="w-7 h-7" />
                          </div>
                          <span className="text-xs text-ivory/60 font-medium">Sua câmera está desligada</span>
                        </div>
                      )}
                      {/* Chip de Identificação */}
                      <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 shadow-lg">
                        <span className={`w-2 h-2 rounded-full ${micOn ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        <span className="text-xs font-serif-lumiardi font-medium text-ivory">Você ({myDisplayName})</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 2. MODO DESTAQUE (SPOTLIGHT COM PIP FLUTUANTE) */
                  <div className="relative w-full h-full max-w-6xl mx-auto flex items-center justify-center">
                    {/* PALCO PRINCIPAL DESTAQUE */}
                    <div className="relative w-full h-full rounded-2xl bg-[#141417] border border-white/10 shadow-2xl overflow-hidden flex items-center justify-center">
                      {!swappedViews ? (
                        <video
                          ref={remoteVideoCallbackRef}
                          autoPlay={true}
                          playsInline={true}
                          muted={false}
                          className="w-full h-full object-cover sm:object-contain md:object-cover"
                        />
                      ) : camOn ? (
                        <video
                          ref={localVideoCallbackRef}
                          autoPlay={true}
                          playsInline={true}
                          muted={true}
                          className="w-full h-full object-cover sm:object-contain md:object-cover"
                          style={{ transform: 'scaleX(-1)' }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-ivory/50">
                          <VideoOff className="w-8 h-8 text-rose-400 mb-2" />
                          <span className="text-xs">Sua câmera está desligada</span>
                        </div>
                      )}

                      <div className="absolute top-4 left-4 bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-xs font-serif-lumiardi font-medium text-gold">
                          {!swappedViews ? interlocutorName : 'Você (Palco Invertido)'}
                        </span>
                      </div>
                    </div>

                    {/* PIP FLUTUANTE NO CANTO INFERIOR DIREITO */}
                    <div
                      onClick={() => setSwappedViews(!swappedViews)}
                      className="absolute bottom-4 right-4 w-36 sm:w-56 aspect-video rounded-xl bg-black/90 border border-gold/40 shadow-2xl overflow-hidden cursor-pointer z-20 group hover:scale-105 hover:border-gold transition-all"
                      title="Clique para alternar o palco principal"
                    >
                      {swappedViews ? (
                        <video
                          ref={remoteVideoCallbackRef}
                          autoPlay={true}
                          playsInline={true}
                          muted={false}
                          className="w-full h-full object-cover"
                        />
                      ) : camOn ? (
                        <video
                          ref={localVideoCallbackRef}
                          autoPlay={true}
                          playsInline={true}
                          muted={true}
                          className="w-full h-full object-cover"
                          style={{ transform: 'scaleX(-1)' }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#101012] text-ivory/50">
                          <VideoOff className="w-5 h-5 text-rose-400 mb-1" />
                          <span className="text-[9px]">Câmera Desligada</span>
                        </div>
                      )}

                      <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[9px] font-mono pointer-events-none">
                        <span className="bg-black/80 px-1.5 py-0.5 rounded-xs text-gold border border-white/10 truncate max-w-[70%]">
                          {swappedViews ? interlocutorName : 'Você'}
                        </span>
                        <span className="p-1 bg-black/80 rounded-full border border-white/10">
                          {micOn ? <Mic className="w-2.5 h-2.5 text-emerald-400" /> : <MicOff className="w-2.5 h-2.5 text-rose-400" />}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                /* ─────────────────────────────────────────────────────────────
                   MODO AGUARDANDO PARTICIPANTE (LOUNGE EXECUTIVO)
                   ───────────────────────────────────────────────────────────── */
                <div className="relative w-full h-full max-w-4xl mx-auto rounded-2xl bg-gradient-to-b from-[#141418] via-[#0d0d10] to-[#08080a] border border-white/10 shadow-2xl p-6 sm:p-12 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/40 flex items-center justify-center text-gold shadow-2xl">
                      <Shield className="w-8 h-8 text-gold" />
                    </div>
                    <span className="w-24 h-24 -top-2 -left-2 absolute rounded-full border border-gold/25 animate-ping opacity-60 pointer-events-none" />
                  </div>

                  <div className="max-w-md space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/10 border border-gold/30 rounded-full text-[10px] uppercase font-mono tracking-widest text-gold">
                      <Lock className="w-3 h-3 text-gold" />
                      <span>Conexão Criptografada E2E</span>
                    </div>
                    <h3 className="font-serif-lumiardi text-2xl sm:text-3xl font-light text-ivory">
                      Aguardando Interlocutor...
                    </h3>
                    <p className="text-xs text-ivory/60 leading-relaxed font-sans">
                      A sala VIP está pronta. Copie o convite abaixo e envie para o participante conectar imediatamente.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={handleCopyLink}
                      className="px-6 py-3 bg-gradient-to-r from-gold to-gold-light hover:brightness-110 text-black-matte font-semibold text-xs uppercase tracking-wider rounded-full shadow-xl shadow-gold/15 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedLink ? 'Link Copiado!' : 'Copiar Convite VIP'}</span>
                    </button>
                  </div>

                  {/* Prévia da Câmera Local no Lounge */}
                  <div className="w-44 sm:w-56 aspect-video rounded-xl bg-black border border-white/10 overflow-hidden relative shadow-lg mt-4">
                    {camOn ? (
                      <video
                        ref={localVideoCallbackRef}
                        autoPlay={true}
                        playsInline={true}
                        muted={true}
                        className="w-full h-full object-cover"
                        style={{ transform: 'scaleX(-1)' }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-ivory/40">
                        <VideoOff className="w-5 h-5 mb-1 text-rose-400" />
                        <span className="text-[9px]">Câmera Desligada</span>
                      </div>
                    )}
                    <span className="absolute bottom-1.5 left-2 bg-black/80 px-2 py-0.5 rounded-md text-[9px] text-ivory/80 font-mono">
                      Prévia Local
                    </span>
                  </div>
                </div>
              )}
            </main>

            {/* ─────────────────────────────────────────────────────────────
                CHAT DA REUNIÃO: DESKTOP (PAINEL LATERAL ACOPLADO)
               ───────────────────────────────────────────────────────────── */}
            {showChat && (
              <aside className="hidden sm:flex w-80 lg:w-92 bg-[#0e0e11] border-l border-white/10 flex-col shrink-0 z-30">
                <div className="h-14 px-4 border-b border-white/10 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-gold" />
                    <span className="font-serif-lumiardi text-sm text-ivory font-medium">Chat da Reunião</span>
                    <span className="text-[10px] font-mono text-gold bg-gold/10 px-2 py-0.5 rounded-full">
                      {inMeetingMessages.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowChat(false)}
                    className="p-1.5 text-ivory/50 hover:text-gold rounded-md transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Lista de Mensagens */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
                  {inMeetingMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-ivory/40 space-y-2 p-4">
                      <MessageSquare className="w-8 h-8 text-gold/30" />
                      <p className="text-xs font-medium">Nenhuma mensagem ainda.</p>
                      <p className="text-[11px]">Mensagens enviadas aqui são visíveis para todos na chamada.</p>
                    </div>
                  ) : (
                    inMeetingMessages.map((m) => (
                      <div
                        key={m.id}
                        className={`p-3 rounded-xl leading-relaxed ${
                          m.isMe
                            ? 'bg-gold/15 border border-gold/30 ml-4 text-ivory'
                            : 'bg-[#18181c] border border-white/10 mr-4 text-ivory/90'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1 text-[10px]">
                          <span className={`font-semibold ${m.isMe ? 'text-gold' : 'text-ivory'}`}>{m.sender}</span>
                          <span className="text-ivory/40">{m.time}</span>
                        </div>
                        <p className="text-xs break-words">{m.text}</p>
                      </div>
                    ))
                  )}
                  <div ref={chatMessagesEndRef} />
                </div>

                {/* Input de Envio Desktop */}
                <form onSubmit={handleSendMessage} className="p-3 bg-[#121216] border-t border-white/10 flex gap-2 shrink-0">
                  <input
                    type="text"
                    placeholder="Enviar mensagem na chamada..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 bg-[#1a1a20] border border-white/15 focus:border-gold px-3.5 py-2.5 text-xs text-ivory outline-none rounded-xl placeholder:text-ivory/30"
                  />
                  <button
                    type="submit"
                    className="p-2.5 bg-gold text-black-matte font-bold rounded-xl hover:bg-gold-light transition-colors cursor-pointer shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </aside>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              CHAT DA REUNIÃO: MOBILE (MODAL FULLSCREEN SEM BLOQUEIO DE TECLADO)
             ───────────────────────────────────────────────────────────── */}
          {showChat && (
            <div className="sm:hidden fixed inset-0 z-50 bg-[#0e0e11] flex flex-col animate-in fade-in duration-200">
              {/* Header do Chat Mobile */}
              <div className="h-14 px-4 bg-[#141418] border-b border-white/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gold" />
                  <span className="font-serif-lumiardi text-sm text-ivory font-medium">Mensagens da Reunião</span>
                </div>
                <button
                  onClick={() => setShowChat(false)}
                  className="p-2 text-ivory/60 hover:text-gold transition-colors cursor-pointer"
                  title="Voltar para a chamada"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Lista de Mensagens Mobile */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
                {inMeetingMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-ivory/40 space-y-2 p-6">
                    <MessageSquare className="w-8 h-8 text-gold/30" />
                    <p className="text-xs font-medium">Nenhuma mensagem no chat.</p>
                    <p className="text-[11px]">Converse por texto diretamente com o interlocutor durante a chamada.</p>
                  </div>
                ) : (
                  inMeetingMessages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3 rounded-xl leading-relaxed ${
                        m.isMe
                          ? 'bg-gold/15 border border-gold/30 ml-4 text-ivory'
                          : 'bg-[#1a1a20] border border-white/10 mr-4 text-ivory/90'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 text-[10px]">
                        <span className={`font-semibold ${m.isMe ? 'text-gold' : 'text-ivory'}`}>{m.sender}</span>
                        <span className="text-ivory/40">{m.time}</span>
                      </div>
                      <p className="text-xs break-words">{m.text}</p>
                    </div>
                  ))
                )}
                <div ref={chatMessagesEndRef} />
              </div>

              {/* Input Mobile Firme e Desobstruído */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 pb-8 bg-[#141418] border-t border-white/10 flex gap-2 shrink-0"
              >
                <input
                  type="text"
                  placeholder="Escreva sua mensagem..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  autoFocus={true}
                  className="flex-1 bg-[#1e1e24] border border-white/20 focus:border-gold px-4 py-3 text-xs text-ivory outline-none rounded-xl placeholder:text-ivory/40"
                />
                <button
                  type="submit"
                  className="px-4 py-3 bg-gold text-black-matte font-bold rounded-xl hover:bg-gold-light transition-colors cursor-pointer shrink-0 flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              BARRA DE CONTROLES INFERIOR FIXA (ESTILO GOOGLE MEET DOCK)
             ───────────────────────────────────────────────────────────── */}
          <footer className="h-18 sm:h-20 bg-[#0e0e11] border-t border-white/10 px-4 sm:px-8 flex items-center justify-between shrink-0 z-30">
            {/* Esquerda: Info da Sala (Desktop) */}
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-xs font-mono text-ivory/70">{activeRoomId}</span>
              <span className="text-ivory/30">|</span>
              <CallTimer active={inCall} />
            </div>

            {/* Centro: Botões Redondos Google Meet */}
            <div className="flex items-center gap-2 sm:gap-3.5 mx-auto">
              {/* Microfone */}
              <button
                onClick={toggleMic}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full transition-all cursor-pointer flex items-center justify-center shadow-md active:scale-95 ${
                  micOn
                    ? 'bg-[#222226] hover:bg-[#2d2d32] text-white border border-white/10'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}
                title={micOn ? 'Desativar Microfone' : 'Ativar Microfone'}
              >
                {micOn ? <Mic className="w-5 h-5 text-emerald-400" /> : <MicOff className="w-5 h-5 text-white" />}
              </button>

              {/* Câmera */}
              <button
                onClick={toggleCam}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full transition-all cursor-pointer flex items-center justify-center shadow-md active:scale-95 ${
                  camOn
                    ? 'bg-[#222226] hover:bg-[#2d2d32] text-white border border-white/10'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}
                title={camOn ? 'Desligar Câmera' : 'Ligar Câmera'}
              >
                {camOn ? <VideoIcon className="w-5 h-5 text-emerald-400" /> : <VideoOff className="w-5 h-5 text-white" />}
              </button>

              {/* Compartilhamento de Tela */}
              <button
                onClick={toggleScreenShare}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full transition-all cursor-pointer flex items-center justify-center shadow-md active:scale-95 ${
                  screenShare
                    ? 'bg-gold text-black-matte font-bold shadow-gold/30'
                    : 'bg-[#222226] hover:bg-[#2d2d32] text-white border border-white/10'
                }`}
                title={screenShare ? 'Interromper Apresentação' : 'Apresentar Tela Agora'}
              >
                <MonitorUp className="w-5 h-5" />
              </button>

              {/* Alternar Mosaico / Destaque */}
              {!isPresentationActive && isCallConnected && (
                <button
                  onClick={() => setLayoutMode(layoutMode === 'grid' ? 'spotlight' : 'grid')}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#222226] hover:bg-[#2d2d32] text-white border border-white/10 transition-all cursor-pointer flex items-center justify-center shadow-md active:scale-95"
                  title={layoutMode === 'grid' ? 'Mudar para Destaque' : 'Mudar para Mosaico'}
                >
                  {layoutMode === 'grid' ? <Square className="w-5 h-5 text-gold" /> : <LayoutGrid className="w-5 h-5 text-white" />}
                </button>
              )}

              {/* Chat */}
              <button
                onClick={() => {
                  setShowChat(!showChat);
                  setUnreadChatCount(0);
                }}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full transition-all cursor-pointer flex items-center justify-center shadow-md relative active:scale-95 ${
                  showChat
                    ? 'bg-gold text-black-matte font-bold'
                    : 'bg-[#222226] hover:bg-[#2d2d32] text-white border border-white/10'
                }`}
                title="Abrir Chat da Reunião"
              >
                <MessageSquare className="w-5 h-5" />
                {unreadChatCount > 0 && !showChat && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold text-black-matte text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadChatCount}
                  </span>
                )}
              </button>

              {/* Botão Vermelho de Sair (Pill Google Meet) */}
              <button
                onClick={handleEndCall}
                disabled={isEnding}
                className="h-11 sm:h-12 px-5 sm:px-6 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-rose-950/40 active:scale-95 ml-1"
                title="Sair da chamada"
              >
                <PhoneOff className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-semibold">Sair da chamada</span>
              </button>
            </div>

            {/* Direita: Ações Rápidas (Desktop) */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="p-2 text-ivory/60 hover:text-gold hover:bg-[#222226] rounded-full transition-colors cursor-pointer"
                title="Copiar Link da Reunião"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-2 text-ivory/60 hover:text-gold hover:bg-[#222226] rounded-full transition-colors cursor-pointer"
                title="Tela Cheia"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </footer>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            2. CENÁRIO B: LOBBY EXECUTIVO (ENTRADA OU CRIAÇÃO DE SALA)
           ───────────────────────────────────────────────────────────── */
        <div className="w-full h-full flex flex-col items-center justify-center p-6 sm:p-12 text-center relative bg-gradient-to-b from-[#0e0e12] to-[#060608]">
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
                <span className="bg-[#0b0b0e] px-3 text-[11px] text-ivory/40 uppercase font-mono tracking-wider">
                  ou aceder por código
                </span>
              </div>

              <form onSubmit={handleJoinExistingRoom} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: LM-9A4B2C-VIP"
                  value={joinInputId}
                  onChange={(e) => setJoinInputId(e.target.value)}
                  className="flex-1 bg-[#141418] border border-white/15 focus:border-gold px-4 py-3 text-xs font-mono text-ivory outline-none rounded-full placeholder:text-ivory/30"
                />
                <button
                  type="submit"
                  disabled={!joinInputId.trim()}
                  className="px-5 py-3 bg-[#1e1e24] hover:bg-gold hover:text-black-matte text-gold border border-gold/30 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
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
