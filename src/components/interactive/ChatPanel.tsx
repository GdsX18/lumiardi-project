'use client';

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Send,
  ShieldCheck,
  Paperclip,
  Lock,
  Search,
  FileText,
  Video,
  Download,
  Image as ImageIcon,
  X,
  ArrowLeft,
  RefreshCw,
  CheckCheck,
  Copy,
  Check,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuthPortal } from '@/context/AuthPortalContext';
import { VideoCallWidget } from './VideoCallWidget';

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  senderId?: string;
  sender?: string;
  senderName?: string;
  senderRole?: string;
  text: string;
  time?: string;
  createdAt?: string;
  isMe?: boolean;
  hasAttachment?: boolean;
  attachmentName?: string;
  attachmentUrl?: string;
  attachmentType?: string;
}

export interface Conversation {
  id: string;
  partnerId?: string;
  name: string;
  avatarText: string;
  subtitle: string;
  lastMessage: string;
  lastTime: string;
  unreadCount?: number;
  verified: boolean;
  isOnline?: boolean;
}

interface AttachedFile {
  name: string;
  url?: string;
  type: 'image' | 'file';
  fileKey?: string;
}

interface ConversationCacheEntry {
  messages: ChatMessage[];
  lastTimestamp?: string;
  isLoaded: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(isoOrTime?: string): string {
  if (!isoOrTime) return 'Agora';
  try {
    return new Date(isoOrTime).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoOrTime;
  }
}

function getInitials(name?: string): string {
  if (!name) return 'LM';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
}

// ─── Componente Principal ────────────────────────────────────────────────────

const ChatPanelInner: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser, activeCreator } = useAuthPortal();
  const searchParams = useSearchParams();

  // Recupera canal da URL ou sessionStorage
  const queryConv = searchParams?.get('conversationId') || searchParams?.get('c');
  const [activeConvId, setActiveConvId] = useState<string>(() => {
    if (queryConv) return queryConv;
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('lumiardi_active_chat');
      if (saved) return saved;
    }
    return 'curation';
  });

  // Lista de canais disponíveis
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 'curation',
      name: 'Mesa de Curadoria Lumiardi',
      avatarText: 'LM',
      subtitle: 'Suporte Oficial & Atendimento VIP',
      lastMessage: 'Canal oficial com a equipe de Curadoria e Compliance.',
      lastTime: 'Agora',
      unreadCount: 0,
      verified: true,
      isOnline: true,
    },
  ]);

  // Mensagens da conversa aberta no momento
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [inputVal, setInputVal] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showMobileList, setShowMobileList] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [activeMeetRoom, setActiveMeetRoom] = useState<string | null>(null);
  const [isStartingMeet, setIsStartingMeet] = useState<boolean>(false);

  // ─── REFS DE CONTROLE E CACHE DE ALTA VELOCIDADE (0ms Latency) ────────────
  const cacheRef = useRef<Map<string, ConversationCacheEntry>>(new Map());
  const activeConvIdRef = useRef<string>(activeConvId);
  activeConvIdRef.current = activeConvId;

  const abortControllerRef = useRef<AbortController | null>(null);
  const isSyncingRef = useRef<boolean>(false);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const prevMessagesCountRef = useRef<number>(0);
  const isInitialLoadRef = useRef<boolean>(true);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0];

  // ─── Normalização de mensagens da API ─────────────────────────────────────

  const normalizeMessages = useCallback(
    (raw: any[], currentId?: string, myName?: string): ChatMessage[] => {
      return raw.map((m: any) => {
        const isMe =
          m.isMe !== undefined
            ? Boolean(m.isMe)
            : Boolean((currentId && m.senderId === currentId) || m.senderId === 'me');

        const senderDisplayName = isMe
          ? myName || 'Você'
          : m.sender || m.senderName || 'Mesa de Curadoria Lumiardi';

        return {
          id: m.id || String(Math.random()),
          senderId: m.senderId,
          sender: senderDisplayName,
          senderName: m.senderName || senderDisplayName,
          senderRole: m.senderRole,
          text: m.text || m.content || '',
          time: m.time || formatTime(m.createdAt),
          createdAt: m.createdAt,
          isMe,
          hasAttachment: !!m.hasAttachment || !!m.attachmentUrl,
          attachmentName: m.attachmentName,
          attachmentUrl: m.attachmentUrl,
          attachmentType: m.attachmentType || 'file',
        };
      });
    },
    []
  );

  // ─── Carga e Sincronização Inteligente por Conversa (Zero Leaks) ──────────

  const syncConversation = useCallback(
    async (targetConvId: string, isFullLoad: boolean) => {
      if (!targetConvId) return;

      const cached = cacheRef.current.get(targetConvId);
      const since = !isFullLoad && cached?.lastTimestamp ? cached.lastTimestamp : undefined;

      try {
        const controller = abortControllerRef.current;
        const signal = controller ? controller.signal : undefined;

        const url = since
          ? `/api/chat/messages?conversationId=${encodeURIComponent(targetConvId)}&since=${encodeURIComponent(since)}`
          : `/api/chat/messages?conversationId=${encodeURIComponent(targetConvId)}`;

        const res = await fetch(url, { signal });

        // 304 Not Modified: nenhuma mensagem nova nesta conversa
        if (res.status === 304) {
          if (activeConvIdRef.current === targetConvId) {
            setIsLoadingMessages(false);
          }
          return;
        }

        if (res.ok) {
          const data = await res.json();
          // Garante que os dados pertencem estritamente a este canal
          if (data.conversationId && data.conversationId !== targetConvId) return;
          if (!Array.isArray(data.messages)) return;

          const currentId = currentUser?.id || data.currentUserId;
          const myName =
            activeCreator?.qualitative?.artisticName ||
            currentUser?.name ||
            data.currentUserName ||
            'Você';

          const incoming = normalizeMessages(data.messages, currentId, myName);
          const prevEntry = cacheRef.current.get(targetConvId);
          let merged: ChatMessage[] = [];

          if (isFullLoad || !prevEntry || !prevEntry.isLoaded) {
            // Carga inicial completa: preserva mensagens otimistas locais ainda pendentes
            const pendingOptimistic = (prevEntry?.messages || []).filter((m) =>
              m.id.startsWith('optimistic-')
            );
            const stillPending = pendingOptimistic.filter(
              (opt) => !incoming.some((s) => s.isMe && s.text === opt.text)
            );
            merged = [...incoming, ...stillPending];
          } else {
            // Delta incremental: funde mensagens novas preservando ordem
            const existingIds = new Set(prevEntry.messages.map((m) => m.id));
            let updatedPrev = [...prevEntry.messages];
            const fresh: ChatMessage[] = [];

            for (const nm of incoming) {
              if (existingIds.has(nm.id)) continue;
              if (nm.isMe) {
                const optIndex = updatedPrev.findIndex(
                  (m) => m.id.startsWith('optimistic-') && m.text === nm.text
                );
                if (optIndex !== -1) {
                  updatedPrev[optIndex] = nm;
                  existingIds.add(nm.id);
                  continue;
                }
              }
              fresh.push(nm);
              existingIds.add(nm.id);
            }
            merged = [...updatedPrev, ...fresh];
          }

          const lastMsg = merged[merged.length - 1];
          const newTimestamp = lastMsg?.createdAt || prevEntry?.lastTimestamp;

          // Atualiza cache específico desta conversa
          cacheRef.current.set(targetConvId, {
            messages: merged,
            lastTimestamp: newTimestamp,
            isLoaded: true,
          });

          // REGRA DE OURO ANTI-LEAK:
          // Só atualiza a tela SE o usuário AINDA ESTIVER nesta conversa
          if (activeConvIdRef.current === targetConvId) {
            setMessages(merged);
            setIsLoadingMessages(false);
          }
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      } finally {
        if (activeConvIdRef.current === targetConvId) {
          setIsLoadingMessages(false);
        }
      }
    },
    [currentUser?.id, currentUser?.name, activeCreator, normalizeMessages]
  );

  // ─── Troca de Conversa Instantânea (0ms com Cache) ─────────────────────────

  const handleSelectConversation = useCallback(
    (newConvId: string) => {
      if (newConvId === activeConvIdRef.current) {
        setShowMobileList(false);
        return;
      }

      // 1. Cancela qualquer requisição HTTP pendente da conversa anterior
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // 2. Atualiza refs e estado da conversa ativa
      activeConvIdRef.current = newConvId;
      setActiveConvId(newConvId);
      setShowMobileList(false);
      isInitialLoadRef.current = true;
      prevMessagesCountRef.current = 0;

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('lumiardi_active_chat', newConvId);
      }

      // 3. Renderização instantânea se já estiver no cache
      const cached = cacheRef.current.get(newConvId);
      if (cached && cached.isLoaded) {
        setMessages(cached.messages);
        setIsLoadingMessages(false);
      } else {
        // Primeira vez abrindo este chat: limpa tela e exibe loading discreto
        setMessages([]);
        setIsLoadingMessages(true);
      }

      // 4. Sincroniza em segundo plano sem bloquear a interface
      syncConversation(newConvId, !cached?.isLoaded);
    },
    [syncConversation]
  );

  // ─── Carga de Lista de Conversas ───────────────────────────────────────────

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/conversations');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.conversations) && data.conversations.length > 0) {
          setConversations(data.conversations);
        }
      }
    } catch {}
  }, []);

  // ─── Inicialização e Ciclos de Polling Sequenciados (Anti-Lag) ─────────────

  useEffect(() => {
    fetchConversations();
    // Atualiza canais e status de presença real a cada 12 segundos
    const convInterval = setInterval(fetchConversations, 12000);
    return () => clearInterval(convInterval);
  }, [fetchConversations]);

  useEffect(() => {
    // Carga inicial da conversa ativa ao montar
    const currentTarget = activeConvId;
    const cached = cacheRef.current.get(currentTarget);
    if (cached && cached.isLoaded) {
      setMessages(cached.messages);
      setIsLoadingMessages(false);
    } else {
      setIsLoadingMessages(true);
    }
    syncConversation(currentTarget, !cached?.isLoaded);
  }, [activeConvId, syncConversation]);

  // Polling sequencial sem acúmulo de requisições concorrentes
  useEffect(() => {
    let isMounted = true;
    let pollTimeout: NodeJS.Timeout | null = null;

    const runPoll = async () => {
      if (!isMounted) return;

      // Se a aba estiver minimizada ou em segundo plano, reduz polling
      if (typeof document !== 'undefined' && document.hidden) {
        pollTimeout = setTimeout(runPoll, 5000);
        return;
      }

      if (!isSyncingRef.current) {
        isSyncingRef.current = true;
        const currentTarget = activeConvIdRef.current;
        if (currentTarget) {
          await syncConversation(currentTarget, false);
        }
        isSyncingRef.current = false;
      }

      if (isMounted) {
        // Agenda o próximo ciclo 2.5s após a conclusão da requisição atual
        pollTimeout = setTimeout(runPoll, 2500);
      }
    };

    pollTimeout = setTimeout(runPoll, 2500);

    return () => {
      isMounted = false;
      if (pollTimeout) clearTimeout(pollTimeout);
    };
  }, [syncConversation]);

  // Batimento cardíaco ativo de presença a cada 60s
  useEffect(() => {
    const sendHeartbeat = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetch('/api/user/heartbeat', { method: 'POST' }).catch(() => {});
      }
    };
    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 60000);
    document.addEventListener('visibilitychange', sendHeartbeat);
    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', sendHeartbeat);
    };
  }, []);

  // ─── Scroll Estritamente Contido no Contêiner Interno ──────────────────────

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (isInitialLoadRef.current && messages.length > 0) {
      container.scrollTop = container.scrollHeight;
      isInitialLoadRef.current = false;
      prevMessagesCountRef.current = messages.length;
      return;
    }

    if (messages.length > prevMessagesCountRef.current) {
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 140;
      if (isNearBottom) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }
    }

    prevMessagesCountRef.current = messages.length;
  }, [messages]);

  // ─── Auto-resize do textarea ──────────────────────────────────────────────

  const autoResizeTextarea = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 128)}px`;
  }, []);

  // ─── Upload de Arquivo ─────────────────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const presignRes = await fetch('/api/chat/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileType: file.type }),
      });

      if (presignRes.ok) {
        const presignData = await presignRes.json();

        if (presignData.fallback) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('category', 'chat');
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            setAttachedFile({
              name: file.name,
              url: uploadData.url || uploadData.file?.url,
              type: file.type.startsWith('image/') ? 'image' : 'file',
            });
          } else {
            setAttachedFile({ name: file.name, type: file.type.startsWith('image/') ? 'image' : 'file' });
          }
        } else if (presignData.uploadUrl) {
          await fetch(presignData.uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file,
          });

          setAttachedFile({
            name: file.name,
            url: presignData.publicUrl || presignData.uploadUrl,
            type: file.type.startsWith('image/') ? 'image' : 'file',
            fileKey: presignData.fileKey,
          });
        }
      }
    } catch {
      setAttachedFile({ name: file.name, type: file.type.startsWith('image/') ? 'image' : 'file' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ─── Envio Otimista Ultra-Rápido ──────────────────────────────────────────

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputVal.trim() && !attachedFile) || isUploading || isSending) return;

    const currentText = inputVal.trim();
    const currentAttachment = attachedFile;
    const targetConvId = activeConvIdRef.current;

    const myDisplayName =
      activeCreator?.qualitative?.artisticName || currentUser?.name || 'Você';
    const tempId = `optimistic-${Date.now()}`;

    const optimisticMsg: ChatMessage = {
      id: tempId,
      senderId: currentUser?.id || 'me',
      sender: myDisplayName,
      senderName: myDisplayName,
      senderRole:
        currentUser?.role === 'criadora'
          ? 'modelo'
          : currentUser?.role || 'modelo',
      text: currentText,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      isMe: true,
      hasAttachment: !!currentAttachment,
      attachmentName: currentAttachment?.name,
      attachmentUrl: currentAttachment?.url,
      attachmentType: currentAttachment?.type,
    };

    // 1. Atualização Instantânea no Estado e no Cache
    if (activeConvIdRef.current === targetConvId) {
      setMessages((prev) => [...prev, optimisticMsg]);
    }
    const cached = cacheRef.current.get(targetConvId);
    if (cached) {
      cacheRef.current.set(targetConvId, {
        ...cached,
        messages: [...cached.messages, optimisticMsg],
      });
    }

    // 2. Limpa o input imediatamente
    setInputVal('');
    setAttachedFile(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // 3. Atualiza a barra lateral com a última mensagem em tempo real
    setConversations((prev) =>
      prev.map((c) =>
        c.id === targetConvId
          ? {
              ...c,
              lastMessage: currentText,
              lastTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            }
          : c
      )
    );

    // 4. Scroll imediato
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 30);

    // 5. Envia no background para o servidor
    setIsSending(true);
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: targetConvId,
          text: currentText,
          attachmentUrl: currentAttachment?.url,
          attachmentName: currentAttachment?.name,
          attachmentType: currentAttachment?.type,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const serverId = data.message?.id;
        const serverCreatedAt = data.message?.createdAt;

        if (serverId) {
          const replaceOptimistic = (m: ChatMessage) =>
            m.id === tempId ? { ...m, id: serverId, createdAt: serverCreatedAt || m.createdAt } : m;

          const currentCache = cacheRef.current.get(targetConvId);
          if (currentCache) {
            cacheRef.current.set(targetConvId, {
              ...currentCache,
              messages: currentCache.messages.map(replaceOptimistic),
              lastTimestamp: serverCreatedAt || currentCache.lastTimestamp,
            });
          }

          if (activeConvIdRef.current === targetConvId) {
            setMessages((prev) => prev.map(replaceOptimistic));
          }
        }
      }
    } catch {
      // Mensagem otimista permanece visível mesmo com instabilidade temporária
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── Iniciar Reunião VIP Lumiardi Meet ─────────────────────────────────────

  const handleStartVipMeet = async () => {
    setIsStartingMeet(true);
    const targetConvId = activeConvIdRef.current;

    try {
      const res = await fetch('/api/meet/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' }),
      });
      if (res.ok) {
        const data = await res.json();
        const roomId = data.roomId;
        const inviteUrl = data.inviteUrl || `/dashboard/meet?room=${encodeURIComponent(roomId)}`;
        const myDisplayName =
          activeCreator?.qualitative?.artisticName || currentUser?.name || 'Você';
        const meetMsgText = `Reunião VIP iniciada. Clique para aceder à sala executiva: ${roomId}`;

        const optimisticMsg: ChatMessage = {
          id: `optimistic-${Date.now()}`,
          senderId: currentUser?.id || 'me',
          sender: myDisplayName,
          senderName: myDisplayName,
          senderRole: currentUser?.role === 'criadora' ? 'modelo' : currentUser?.role || 'modelo',
          text: meetMsgText,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          createdAt: new Date().toISOString(),
          isMe: true,
          hasAttachment: true,
          attachmentName: `Sala VIP ${roomId}`,
          attachmentUrl: inviteUrl,
          attachmentType: 'meet',
        };

        if (activeConvIdRef.current === targetConvId) {
          setMessages((prev) => [...prev, optimisticMsg]);
        }
        const cached = cacheRef.current.get(targetConvId);
        if (cached) {
          cacheRef.current.set(targetConvId, {
            ...cached,
            messages: [...cached.messages, optimisticMsg],
          });
        }

        try {
          await fetch('/api/chat/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversationId: targetConvId,
              text: meetMsgText,
              attachmentType: 'meet',
              attachmentName: `Sala VIP ${roomId}`,
              attachmentUrl: inviteUrl,
            }),
          });
        } catch {}

        setActiveMeetRoom(roomId);
      }
    } catch (err) {
      console.error('Erro ao iniciar Reunião VIP:', err);
    } finally {
      setIsStartingMeet(false);
    }
  };

  const copyMessageText = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canSend = (inputVal.trim().length > 0 || !!attachedFile) && !isSending && !isUploading;

  return (
    <div className="w-full h-full min-h-[580px] bg-[#080808] border border-white/[0.08] rounded-xs shadow-2xl flex overflow-hidden">
      {/* ── Barra Lateral de Canais ── */}
      <div
        className={`w-full md:w-80 lg:w-88 border-r border-white/[0.06] bg-[#0A0A0A] flex flex-col shrink-0 transition-all ${
          showMobileList ? 'flex' : 'hidden md:flex'
        }`}
      >
        <div className="p-3.5 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-gold" />
            <h2 className="font-serif-lumiardi text-sm font-semibold tracking-wide text-ivory">
              Canais Seguros
            </h2>
          </div>
          <span className="text-[10px] text-gold/70 font-mono bg-gold/10 px-2 py-0.5 rounded-xs border border-gold/20">
            E2E
          </span>
        </div>

        {/* Busca de Canais */}
        <div className="p-2.5 border-b border-white/[0.04]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-ivory/30 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar mensagens ou canais..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#121212] border border-white/[0.08] pl-9 pr-3 py-2 text-xs text-ivory outline-none rounded-xs placeholder:text-ivory/30 focus:border-gold/40 transition-colors"
            />
          </div>
        </div>

        {/* Lista de Canais */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filteredConversations.map((conv) => {
            const isSelected = conv.id === activeConvId;
            return (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className={`w-full px-3.5 py-3 text-left transition-all flex items-start gap-3 cursor-pointer rounded-xs ${
                  isSelected
                    ? 'bg-gold/10 border-l-2 border-gold text-ivory'
                    : 'hover:bg-white/[0.03] text-ivory/70 border-l-2 border-transparent'
                }`}
              >
                <div className="relative shrink-0 mt-0.5">
                  <div className="w-10 h-10 bg-[#141414] border border-gold/30 text-gold flex items-center justify-center font-serif-lumiardi font-bold text-xs rounded-xs">
                    {conv.avatarText}
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#080808] transition-colors duration-300 ${
                      conv.isOnline ? 'bg-emerald-500' : 'bg-white/80'
                    }`}
                    title={conv.isOnline ? 'Online' : 'Offline'}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-serif-lumiardi text-[13px] font-medium text-ivory truncate flex items-center gap-1.5">
                      {conv.name}
                      {conv.verified && (
                        <ShieldCheck className="w-3.5 h-3.5 text-gold shrink-0 opacity-70" />
                      )}
                    </span>
                    <span className="text-[10px] text-ivory/40 font-sans ml-1 shrink-0">
                      {conv.lastTime}
                    </span>
                  </div>
                  <p className="text-[11px] text-ivory/50 font-sans truncate">
                    {conv.lastMessage}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Rodapé da Barra Lateral */}
        <div className="px-4 py-2.5 border-t border-white/[0.05] flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3 text-gold/50 shrink-0" />
          <span className="text-[10px] text-ivory/35 font-sans">
            Blindagem Criptográfica Lumiardi E2E
          </span>
        </div>
      </div>

      {/* ── Janela de Conversa Ativa ── */}
      <div className="flex-1 flex flex-col bg-[#0B0B0B] h-full overflow-hidden">
        {/* Header da Conversa */}
        <div className="px-4 py-3 bg-[#0E0E0E]/90 border-b border-white/[0.06] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMobileList(true)}
              className="md:hidden p-2 bg-[#161616] border border-white/10 text-gold rounded-xs hover:bg-white/10"
              title="Ver canais"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="relative">
              <div className="w-10 h-10 bg-gold/10 border border-gold/30 text-gold flex items-center justify-center font-serif-lumiardi font-bold text-xs rounded-xs">
                {activeConv.avatarText}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0E0E0E] transition-colors duration-300 ${
                  activeConv.isOnline ? 'bg-emerald-500' : 'bg-white/80'
                }`}
                title={activeConv.isOnline ? 'Online' : 'Offline'}
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-serif-lumiardi text-sm md:text-base font-medium text-ivory leading-tight">
                  {activeConv.name}
                </h3>
                <ShieldCheck className="w-3.5 h-3.5 text-gold/70 shrink-0" />
              </div>
              <span className="text-[11px] text-ivory/50 font-sans flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                    activeConv.isOnline ? 'bg-emerald-500' : 'bg-white/40'
                  }`}
                />
                <span>
                  {activeConv.isOnline
                    ? (activeConv.id === 'curation' ? 'Equipe ativa · Resposta prioritária' : 'Online agora · Resposta ativa')
                    : 'Offline · Mensagem segura arquivada'}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleStartVipMeet}
              disabled={isStartingMeet}
              className="px-3 py-2 bg-gradient-to-r from-gold to-gold-light hover:brightness-110 text-black-matte font-semibold text-xs font-sans uppercase tracking-wider transition-all flex items-center gap-1.5 rounded-xs shadow-sm shadow-gold/10 cursor-pointer disabled:opacity-50"
            >
              {isStartingMeet ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Video className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {isStartingMeet ? 'Iniciando...' : 'Reunião VIP'}
              </span>
            </button>
          </div>
        </div>

        {/* ── Histórico de Mensagens ── */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-5">
          {isLoadingMessages ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
              <RefreshCw className="w-6 h-6 text-gold/60 animate-spin" />
              <span className="text-xs text-ivory/50 font-sans tracking-wide">
                Sincronizando canal criptografado...
              </span>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2 text-ivory/40">
              <Lock className="w-8 h-8 text-gold/30 mb-2" />
              <p className="text-xs font-serif-lumiardi font-medium text-ivory/70">
                Canal Seguro Criptografado E2E
              </p>
              <p className="text-[11px] max-w-xs leading-relaxed text-ivory/40">
                Nenhuma mensagem nesta conversa ainda. Suas mensagens são transmitidas com segurança ponta a ponta.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const initials = getInitials(msg.sender);

              return (
                <div
                  key={msg.id}
                  className={`flex w-full ${msg.isMe ? 'justify-end' : 'justify-start'} items-end gap-2 group`}
                >
                  {!msg.isMe && (
                    <div
                      className="w-7 h-7 rounded-full bg-[#141414] border border-gold/30 text-gold flex items-center justify-center font-serif-lumiardi font-bold text-[10px] shrink-0 mb-0.5"
                      title={msg.sender}
                    >
                      {activeConv.avatarText || initials}
                    </div>
                  )}

                  <div
                    className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'} max-w-[80%] sm:max-w-lg md:max-w-2xl space-y-1`}
                  >
                    {!msg.isMe && (
                      <span className="text-[10px] text-ivory/50 font-sans px-1">
                        {msg.sender}
                      </span>
                    )}

                    <div
                      className={`px-4 py-3 text-xs font-sans leading-relaxed shadow-sm relative transition-all ${
                        msg.isMe
                          ? 'bg-[#1C1914] border border-[#C9A96B]/25 text-[#F5F2EB] rounded-2xl rounded-tr-xs'
                          : 'bg-[#141414] border border-white/[0.07] text-ivory/90 rounded-2xl rounded-tl-xs hover:border-white/[0.12]'
                      }`}
                    >
                      {/* Caso Reunião VIP */}
                      {msg.attachmentType === 'meet' || msg.text.includes('Reunião VIP') ? (
                        <div className="p-3.5 bg-gradient-to-br from-[#1c1913] to-[#0f0e0c] border border-gold/35 rounded-sm space-y-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/35 flex items-center justify-center text-gold shrink-0">
                              <Video className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="font-serif-lumiardi text-sm text-ivory font-medium block">
                                Reunião VIP Lumiardi
                              </span>
                              <p className="text-[11px] text-ivory/55 font-sans">
                                Sessão executiva criptografada ponta-a-ponta
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-gold/15 gap-2 flex-wrap">
                            <span className="text-xs font-mono text-gold bg-gold/10 px-2 py-0.5 rounded-xs border border-gold/20">
                              {msg.attachmentName || 'Sala VIP Ativa'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const match =
                                  msg.text.match(/LM-[A-Z0-9-]+/) ||
                                  msg.attachmentUrl?.match(/room=([^&]+)/);
                                const roomToOpen = match
                                  ? decodeURIComponent(match[1] || match[0])
                                  : activeMeetRoom || 'LM-VIP';
                                setActiveMeetRoom(roomToOpen);
                              }}
                              className="px-3 py-1.5 bg-gradient-to-r from-gold to-gold-light hover:brightness-110 text-black-matte font-semibold text-xs rounded-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <Video className="w-3 h-3" />
                              Entrar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {msg.text && (
                            <p
                              className={`whitespace-pre-wrap text-[13px] leading-relaxed ${
                                msg.isMe ? 'text-[#F5F2EB]/95' : 'text-ivory/90'
                              }`}
                            >
                              {msg.text}
                            </p>
                          )}

                          {msg.hasAttachment && msg.attachmentUrl && (
                            <div
                              className={`mt-2.5 rounded-xs border overflow-hidden ${
                                msg.isMe
                                  ? 'border-[#C9A96B]/20 bg-black/25'
                                  : 'border-white/[0.07] bg-[#181818]'
                              }`}
                            >
                              {msg.attachmentType === 'image' && (
                                <a
                                  href={msg.attachmentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={msg.attachmentUrl}
                                    alt={msg.attachmentName || 'Imagem'}
                                    className="w-full max-h-48 object-cover block"
                                    loading="lazy"
                                  />
                                </a>
                              )}

                              <div className="flex items-center justify-between px-3 py-2 gap-2">
                                <div className="flex items-center gap-2 truncate">
                                  {msg.attachmentType === 'image' ? (
                                    <ImageIcon className="w-3.5 h-3.5 text-gold/70 shrink-0" />
                                  ) : (
                                    <FileText className="w-3.5 h-3.5 text-gold/70 shrink-0" />
                                  )}
                                  <span className="truncate text-[11px] font-medium text-ivory/75">
                                    {msg.attachmentName || 'Anexo'}
                                  </span>
                                </div>
                                <a
                                  href={msg.attachmentUrl}
                                  download={msg.attachmentName || 'anexo_lumiardi'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 hover:text-gold transition-colors rounded-xs shrink-0 text-ivory/50"
                                  title="Download"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      <div
                        className={`flex items-center gap-1 mt-1.5 ${
                          msg.isMe ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <span className="text-[10px] text-ivory/35 font-sans">{msg.time}</span>
                        {msg.isMe && (
                          <CheckCheck className="w-3 h-3 text-gold/50" />
                        )}
                      </div>

                      <button
                        onClick={() => copyMessageText(msg.id, msg.text)}
                        title="Copiar mensagem"
                        className={`absolute -top-2 ${
                          msg.isMe ? '-left-7' : '-right-7'
                        } opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-[#181818] border border-white/10 rounded-xs text-ivory/50 hover:text-gold shadow-sm cursor-pointer`}
                      >
                        {copiedMsgId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {msg.isMe && (
                    <div
                      className="w-7 h-7 rounded-full bg-gold/10 border border-[#C9A96B]/30 text-gold flex items-center justify-center font-serif-lumiardi font-bold text-[10px] shrink-0 mb-0.5"
                      title={msg.sender}
                    >
                      {initials || 'VC'}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Prévia de Anexo Selecionado ── */}
        {attachedFile && (
          <div className="px-5 py-2 bg-[#111] border-t border-gold/20 flex items-center justify-between gap-3 text-xs text-gold/80">
            <span className="flex items-center gap-2 truncate">
              {attachedFile.type === 'image' ? (
                <ImageIcon className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <FileText className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="truncate font-sans">{attachedFile.name}</span>
            </span>
            <button
              onClick={() => setAttachedFile(null)}
              className="text-ivory/40 hover:text-rose-400 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── Barra de Input ── */}
        <form
          onSubmit={handleSend}
          className="px-4 py-3 md:px-5 md:py-4 bg-[#0E0E0E] border-t border-white/[0.07] flex items-end gap-2.5"
        >
          <label
            className={`p-2.5 bg-[#161616] border border-white/[0.08] text-ivory/60 rounded-xs transition-all shrink-0 mb-px ${
              isUploading
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gold/10 hover:text-gold hover:border-gold/30 cursor-pointer'
            }`}
            title="Anexar imagem ou PDF"
          >
            {isUploading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Paperclip className="w-4 h-4" />
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              disabled={isUploading}
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          <textarea
            ref={textareaRef}
            rows={1}
            placeholder={`Escreva para ${activeConv.name}…`}
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              autoResizeTextarea();
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-[#141414] border border-white/[0.08] focus:border-gold/50 focus:bg-[#181818] px-4 py-2.5 text-sm text-ivory outline-none rounded-xs transition-all placeholder:text-ivory/30 shadow-inner resize-none max-h-32 overflow-y-auto leading-relaxed"
          />

          <button
            type="submit"
            disabled={!canSend}
            className={`px-5 py-2.5 bg-gradient-to-r from-gold to-gold-light text-black-matte font-bold text-xs uppercase tracking-wider rounded-xs transition-all flex items-center gap-2 shrink-0 shadow-md shadow-gold/15 ${
              canSend
                ? 'hover:brightness-110 cursor-pointer'
                : 'opacity-30 pointer-events-none'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isSending ? '...' : 'Enviar'}
            </span>
          </button>
        </form>
      </div>

      {/* ── Modal de Chamada VIP ── */}
      {activeMeetRoom && (
        <VideoCallWidget
          roomId={activeMeetRoom}
          isModal={true}
          onClose={() => setActiveMeetRoom(null)}
        />
      )}
    </div>
  );
};

export const ChatPanel: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full min-h-[400px] flex items-center justify-center text-white/40">
          Carregando canal seguro...
        </div>
      }
    >
      <ChatPanelInner />
    </Suspense>
  );
};
