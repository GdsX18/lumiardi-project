'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { isOwnChatMessage } from '@/lib/chatRoles';
import {
  MessageSquare,
  Search,
  Send,
  Users,
  Building2,
  ExternalLink,
  Video,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminConversation {
  userId: string;
  displayName: string;
  userRole: 'MODELO' | 'AGENCIA';
  email: string;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  curationStatus: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName?: string;
  senderRole?: string;
  text: string;
  createdAt: string;
  isMe?: boolean;
  attachmentUrl?: string;
}

interface AdminChatTabProps {
  currentCuratorName?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `há ${diffMins}m`;
  if (diffHours < 24) return `há ${diffHours}h`;
  if (diffDays === 1) return 'ontem';
  return `há ${diffDays}d`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminChatTab({ currentCuratorName }: AdminChatTabProps) {
  const [filter, setFilter] = useState<'all' | 'criadora' | 'agencia'>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [selectedConv, setSelectedConv] = useState<AdminConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const convPollingRef = useRef<NodeJS.Timeout | null>(null);

  // ─── REFS DE ALTA VELOCIDADE & CACHE DE MENSAGENS (0ms Flash) ──────────────
  const messagesCacheRef = useRef<Map<string, { messages: ChatMessage[]; lastMsgTime?: string }>>(new Map());
  const selectedUserIdRef = useRef<string | null>(null);
  const lastMsgTimeRef = useRef<string | undefined>(undefined);
  /** ID do admin autenticado (devolvido por /api/chat/messages) para o cálculo de "isMe". */
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    selectedUserIdRef.current = selectedConv?.userId || null;
  }, [selectedConv?.userId]);

  // Debounce na busca de conversas para evitar sobrecarga no servidor
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // ─── Load Conversations ─────────────────────────────────────────────────

  const loadConversations = useCallback(async () => {
    try {
      const params = new URLSearchParams({ filter });
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      const res = await fetch(`/api/admin/chat/conversations?${params}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch {
      // silent
    } finally {
      setLoadingConvs(false);
    }
  }, [filter, debouncedSearch]);

  useEffect(() => {
    setLoadingConvs(true);
    loadConversations();
  }, [loadConversations]);

  // Poll conversations every 15s
  useEffect(() => {
    convPollingRef.current = setInterval(loadConversations, 15000);
    return () => { if (convPollingRef.current) clearInterval(convPollingRef.current); };
  }, [loadConversations]);

  // ─── Load Messages com Delta & Anti-Flash ────────────────────────────────

  const loadMessages = useCallback(async (userId: string, isPolling = false) => {
    if (!isPolling) {
      const cached = messagesCacheRef.current.get(userId);
      if (!cached || cached.messages.length === 0) {
        setLoadingMsgs(true);
      }
    }

    try {
      const params = new URLSearchParams({ conversationId: 'curation', targetUserId: userId });
      const since = isPolling ? lastMsgTimeRef.current : undefined;
      if (since) params.set('since', since);

      const res = await fetch(`/api/chat/messages?${params}`);
      if (res.status === 304) return; // Nenhuma mensagem nova
      if (!res.ok) return;
      const data = await res.json();
      if (data.currentUserId) setCurrentUserId(String(data.currentUserId));

      // Ignora se o auditor já tiver trocado de conversa
      if (selectedUserIdRef.current !== userId) return;

      // O servidor já devolve a thread completa da candidata (tudo que ela enviou + tudo que a
      // curadoria enviou a ela): sem filtro no cliente, para que nenhuma mensagem seja descartada.
      const allMsgs: ChatMessage[] = data.messages || [];

      let finalMessages: ChatMessage[] = [];

      if (since) {
        // Delta incremental: preserva mensagens locais e anexa novas
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const next = [...prev];
          let changed = false;
          for (const incoming of allMsgs) {
            if (existingIds.has(incoming.id)) continue;
            // A mensagem que o próprio auditor acabou de enviar pode chegar pelo polling antes da resposta
            // do POST: substitui a otimista em vez de duplicar.
            const optIndex = incoming.isMe
              ? next.findIndex((m) => m.id.startsWith('opt-') && m.text === incoming.text)
              : -1;
            if (optIndex !== -1) next[optIndex] = incoming;
            else next.push(incoming);
            existingIds.add(incoming.id);
            changed = true;
          }
          finalMessages = changed ? next : prev;
          return finalMessages;
        });
      } else {
        // Carga completa: preserva mensagens otimistas pendentes se houver
        const prevMsgs = messagesCacheRef.current.get(userId)?.messages || [];
        const pendingOptimistic = prevMsgs.filter((m) => m.id.startsWith('opt-'));
        const stillPending = pendingOptimistic.filter(
          (opt) => !allMsgs.some((s) => s.isMe && s.text === opt.text)
        );
        finalMessages = [...allMsgs, ...stillPending];
        setMessages(finalMessages);
      }

      if (allMsgs.length > 0) {
        const latest = allMsgs[allMsgs.length - 1];
        lastMsgTimeRef.current = latest.createdAt;
      }

      // Atualiza cache em memória
      const prevCached = messagesCacheRef.current.get(userId);
      messagesCacheRef.current.set(userId, {
        messages: finalMessages.length > 0 ? finalMessages : (prevCached?.messages || []),
        lastMsgTime: lastMsgTimeRef.current,
      });
    } catch {
      // silent
    } finally {
      if (selectedUserIdRef.current === userId) {
        setLoadingMsgs(false);
      }
    }
  }, []);

  // ─── Seleção de Conversa com Cache Instantâneo (Zero Latência) ───────────

  const handleSelectConversation = useCallback((conv: AdminConversation) => {
    if (selectedConv?.userId === conv.userId) return;
    setSelectedConv(conv);
    selectedUserIdRef.current = conv.userId;
    setErrorMsg(null);

    const cached = messagesCacheRef.current.get(conv.userId);
    if (cached && cached.messages.length > 0) {
      setMessages(cached.messages);
      lastMsgTimeRef.current = cached.lastMsgTime;
      setLoadingMsgs(false);
    } else {
      setMessages([]);
      lastMsgTimeRef.current = undefined;
      setLoadingMsgs(true);
    }
    loadMessages(conv.userId, false);
  }, [selectedConv?.userId, loadMessages]);

  // Pré-seleciona a primeira conversa se disponível
  useEffect(() => {
    if (!selectedConv && conversations.length > 0) {
      handleSelectConversation(conversations[0]);
    }
  }, [conversations, selectedConv, handleSelectConversation]);

  // ─── Polling Sequencial Confiável (Anti-Lag / Sem Acúmulo de Requests) ─────

  useEffect(() => {
    if (!selectedConv) return;
    const targetUserId = selectedConv.userId;
    let isMounted = true;
    let pollTimeout: NodeJS.Timeout | null = null;

    const runPoll = async () => {
      if (!isMounted) return;

      if (typeof document !== 'undefined' && document.hidden) {
        pollTimeout = setTimeout(runPoll, 3000);
        return;
      }

      if (selectedUserIdRef.current === targetUserId) {
        await loadMessages(targetUserId, true);
      }

      if (isMounted) {
        pollTimeout = setTimeout(runPoll, 1000);
      }
    };

    pollTimeout = setTimeout(runPoll, 1000);
    return () => {
      isMounted = false;
      if (pollTimeout) clearTimeout(pollTimeout);
    };
  }, [selectedConv?.userId, loadMessages]);

  // Auto-scroll para a última mensagem
  // (apenas quando chega/envia uma mensagem nova — polls sem novidade não rolam a tela)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // ─── Envio Otimista Ultra-Rápido (0ms Perceived Latency) ─────────────────

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv || !messageText.trim() || sending) return;

    const textToSend = messageText.trim();
    const targetUserId = selectedConv.userId;
    const tempId = `opt-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const curatorFirst = currentCuratorName?.split(' ')[0] || 'Curadoria';

    const optimisticMsg: ChatMessage = {
      id: tempId,
      senderId: 'admin',
      senderName: `Mesa de Curadoria — Auditor ${curatorFirst}`,
      senderRole: 'admin',
      text: textToSend,
      createdAt: nowIso,
      isMe: true,
    };

    // 1. Renderização Instantânea na Tela e no Cache
    setMessages((prev) => [...prev, optimisticMsg]);
    const cached = messagesCacheRef.current.get(targetUserId);
    if (cached) {
      messagesCacheRef.current.set(targetUserId, {
        ...cached,
        messages: [...cached.messages, optimisticMsg],
        // NÃO atualiza lastMsgTime ainda — só após confirmação do servidor
      });
    }
    // NÃO atualiza lastMsgTimeRef aqui — o timestamp otimista (local) pode ser
    // ligeiramente diferente do NOW() do PostgreSQL e contaminar o parâmetro
    // `since`, fazendo o polling nunca encontrar a mensagem real (retornando 304
    // para sempre) e travar o envio das mensagens seguintes.

    // 2. Limpa input imediatamente
    setMessageText('');
    setErrorMsg(null);

    // 3. Atualiza lista de conversas da barra lateral em tempo real
    setConversations((prev) =>
      prev.map((c) =>
        c.userId === targetUserId
          ? {
              ...c,
              lastMessage: textToSend,
              lastTime: nowIso,
            }
          : c
      )
    );

    // 4. Envia ao servidor em background
    setSending(true);
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSend,
          conversationId: 'curation',
          receiverId: targetUserId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || 'Erro ao enviar mensagem.');
        setMessageText(textToSend);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        // Reverte o cache também
        const revertCached = messagesCacheRef.current.get(targetUserId);
        if (revertCached) {
          messagesCacheRef.current.set(targetUserId, {
            ...revertCached,
            messages: revertCached.messages.filter((m) => m.id !== tempId),
          });
        }
      } else {
        const data = await res.json();
        const realId = data.message?.id;
        const realCreated = data.message?.createdAt;

        if (realId) {
          const replaceOpt = (m: ChatMessage) =>
            m.id === tempId ? { ...m, id: realId, createdAt: realCreated || m.createdAt } : m;
          // Se o polling já trouxe a mensagem real, descarta a otimista em vez de renomeá-la (evita duplicar)
          const dropOrReplace = (list: ChatMessage[]) =>
            list.some((m) => m.id === realId) ? list.filter((m) => m.id !== tempId) : list.map(replaceOpt);

          setMessages((prev) => dropOrReplace(prev));

          // Atualiza o cache com o ID e timestamp reais do servidor
          const curCached = messagesCacheRef.current.get(targetUserId);
          if (curCached) {
            messagesCacheRef.current.set(targetUserId, {
              ...curCached,
              messages: dropOrReplace(curCached.messages),
              lastMsgTime: realCreated || curCached.lastMsgTime,
            });
          }

          // ✅ Agora sim: atualiza lastMsgTimeRef com o timestamp REAL do servidor
          if (realCreated) {
            lastMsgTimeRef.current = realCreated;
          }
        }
      }
    } catch {
      setErrorMsg('Falha na conexão ao enviar mensagem.');
      setMessageText(textToSend);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      const revertCached = messagesCacheRef.current.get(targetUserId);
      if (revertCached) {
        messagesCacheRef.current.set(targetUserId, {
          ...revertCached,
          messages: revertCached.messages.filter((m) => m.id !== tempId),
        });
      }
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as React.FormEvent);
    }
  };

  // ─── UI Helpers ─────────────────────────────────────────────────────────

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APROVADO':
        return <span className="text-[9px] font-sans px-1.5 py-0.5 bg-emerald-950/60 text-emerald-300 border border-emerald-600/30 rounded-xs uppercase tracking-wider">Aprovada</span>;
      case 'EM_CURATORIA':
        return <span className="text-[9px] font-sans px-1.5 py-0.5 bg-amber-950/60 text-amber-300 border border-amber-600/30 rounded-xs uppercase tracking-wider">Em análise</span>;
      case 'REJEITADO':
        return <span className="text-[9px] font-sans px-1.5 py-0.5 bg-rose-950/60 text-rose-300 border border-rose-600/30 rounded-xs uppercase tracking-wider">Recusada</span>;
      default:
        return null;
    }
  };

  const getRoleBadge = (role: 'MODELO' | 'AGENCIA') =>
    role === 'MODELO' ? (
      <span className="text-[9px] font-sans px-1.5 py-0.5 bg-amber-950/50 text-amber-400 border border-amber-600/30 rounded-xs uppercase tracking-wider">Modelo</span>
    ) : (
      <span className="text-[9px] font-sans px-1.5 py-0.5 bg-sky-950/50 text-sky-400 border border-sky-600/30 rounded-xs uppercase tracking-wider">Agência</span>
    );

  const getAvatarColor = (role: 'MODELO' | 'AGENCIA') =>
    role === 'MODELO' ? 'bg-amber-950/60 text-amber-400 border-amber-600/30' : 'bg-sky-950/60 text-sky-400 border-sky-600/30';

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <section className="flex h-[calc(100vh-220px)] min-h-[500px] bg-[#0A0A0A] border border-white/[0.08] rounded-sm overflow-hidden">

      {/* ── LEFT SIDEBAR: Conversation Inbox ──────────────────────────── */}
      <aside className="w-80 flex-shrink-0 flex flex-col border-r border-white/[0.08]">

        {/* Header + Search */}
        <div className="p-4 border-b border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans font-semibold text-ivory/80 uppercase tracking-widest">
              Atendimento
            </span>
            <button
              onClick={loadConversations}
              title="Atualizar lista"
              className="p-1 text-ivory/40 hover:text-gold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ivory/30" />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#141414] border border-white/[0.1] focus:border-gold text-xs text-ivory placeholder-ivory/25 outline-none transition-colors rounded-xs"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1">
            {(['all', 'criadora', 'agencia'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-1.5 text-[10px] font-sans uppercase tracking-wider transition-all cursor-pointer rounded-xs ${
                  filter === f
                    ? 'bg-gold text-black-matte font-bold'
                    : 'text-ivory/50 hover:text-ivory bg-[#141414] border border-white/[0.08]'
                }`}
              >
                {f === 'all' ? 'Todas' : f === 'criadora' ? (
                  <span className="flex items-center justify-center gap-1"><Users className="w-3 h-3" />Criadoras</span>
                ) : (
                  <span className="flex items-center justify-center gap-1"><Building2 className="w-3 h-3" />Agências</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="space-y-px p-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-3 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/5 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-white/5 rounded w-3/4" />
                      <div className="h-2 bg-white/5 rounded w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <MessageSquare className="w-8 h-8 text-ivory/20 mb-3" />
              <p className="text-xs text-ivory/40 font-sans">
                {search ? 'Nenhuma conversa encontrada.' : 'Nenhuma mensagem no canal de curadoria.'}
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.userId}
                onClick={() => handleSelectConversation(conv)}
                className={`w-full text-left p-3.5 border-b border-white/[0.05] transition-colors cursor-pointer ${
                  selectedConv?.userId === conv.userId
                    ? 'bg-gold/10 border-l-2 border-l-gold'
                    : 'hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex gap-3 items-start">
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full border flex items-center justify-center text-xs font-semibold font-sans flex-shrink-0 ${getAvatarColor(conv.userRole)}`}>
                    {getInitials(conv.displayName)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-xs font-sans font-semibold text-ivory truncate">
                        {conv.displayName}
                      </span>
                      <span className="text-[10px] text-ivory/40 font-sans flex-shrink-0">
                        {formatRelativeTime(conv.lastTime)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mb-1">
                      {getRoleBadge(conv.userRole)}
                      {getStatusBadge(conv.curationStatus)}
                    </div>

                    <p className="text-[11px] text-ivory/50 font-sans line-clamp-1 leading-relaxed">
                      {conv.lastMessage}
                    </p>
                  </div>

                  {/* Unread badge */}
                  {conv.unreadCount > 0 && (
                    <span className="w-4.5 h-4.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ── RIGHT PANEL: Message View ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedConv ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-gold" />
            </div>
            <h3 className="font-serif-lumiardi text-xl text-ivory font-light mb-2">
              Canal de Atendimento
            </h3>
            <p className="text-xs text-ivory/50 font-sans max-w-xs leading-relaxed">
              Selecione uma conversa na lista ao lado para visualizar e responder às mensagens das criadoras e agências.
            </p>
          </div>
        ) : (
          <>
            {/* Conversation Header */}
            <div className="px-5 py-3.5 border-b border-white/[0.08] flex items-center justify-between gap-4 bg-[#0C0C0C]">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-full border flex items-center justify-center text-xs font-semibold flex-shrink-0 ${getAvatarColor(selectedConv.userRole)}`}>
                  {getInitials(selectedConv.displayName)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-sans font-semibold text-ivory truncate">
                      {selectedConv.displayName}
                    </span>
                    {getRoleBadge(selectedConv.userRole)}
                    {getStatusBadge(selectedConv.curationStatus)}
                  </div>
                  <span className="text-[10px] text-ivory/40 font-sans">{selectedConv.email}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={`/admin/solicitacao/${selectedConv.userId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-sans text-ivory/70 hover:text-ivory bg-[#141414] hover:bg-white/[0.06] border border-white/[0.08] transition-all rounded-xs cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ver Perfil</span>
                </a>
                <a
                  href={`/dashboard/meet?guest=${selectedConv.userId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-sans text-gold hover:text-black-matte bg-gold/10 hover:bg-gold border border-gold/40 hover:border-gold transition-all rounded-xs cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reunião VIP</span>
                </a>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {loadingMsgs && messages.length === 0 ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                      <div className={`h-10 rounded-sm animate-pulse bg-white/5 ${i % 2 === 0 ? 'w-56' : 'w-48'}`} />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                  <Clock className="w-6 h-6 text-ivory/20 mb-2" />
                  <p className="text-xs text-ivory/40 font-sans">Nenhuma mensagem nesta conversa.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  // Mesma regra do /dashboard/chat: mesmo sender_id da sessão ou mesmo papel (admin ↔ Mesa de Curadoria)
                  const isMe = isOwnChatMessage(msg, currentUserId, 'admin');
                  const time = new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2 w-full min-w-0`}
                    >
                      {!isMe && (
                        <div
                          className={`w-8 h-8 rounded-full border flex items-center justify-center text-[10px] font-semibold font-sans flex-shrink-0 mb-0.5 ${getAvatarColor(selectedConv.userRole)}`}
                          title={msg.senderName || selectedConv.displayName}
                        >
                          {getInitials(selectedConv.displayName)}
                        </div>
                      )}
                      <div className={`max-w-[75%] min-w-0 space-y-1 flex flex-col ${isMe ? 'items-end ml-auto' : 'items-start mr-auto'}`}>
                        <span className={`text-[10px] font-sans px-1 ${isMe ? 'text-amber-200/50' : 'text-ivory/50'}`}>
                          {isMe ? 'Você' : msg.senderName || selectedConv.displayName}
                        </span>
                        <div
                          className={`px-4 py-2.5 text-xs font-sans leading-relaxed min-w-0 ${
                            isMe
                              ? 'bg-amber-500/10 border border-amber-500/30 text-amber-100 rounded-2xl rounded-br-none'
                              : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl rounded-bl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-all [overflow-wrap:anywhere]">{msg.text}</p>
                          <div className={`flex mt-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[9px] text-ivory/35 font-sans">{time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="mx-5 mb-2 p-2.5 bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-sans flex items-center gap-2 rounded-xs">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 border-t border-white/[0.08] bg-[#0C0C0C]">
              <div className="text-[10px] text-ivory/30 font-sans mb-2 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-gold/60" />
                Respondendo como{' '}
                <strong className="text-ivory/60">
                  Mesa de Curadoria — Auditor{' '}
                  {currentCuratorName?.split(' ')[0] || 'Curadoria'}
                </strong>
              </div>
              <div className="flex gap-3 items-end">
                <textarea
                  ref={inputRef}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua mensagem… (Enter para enviar, Shift+Enter para nova linha)"
                  rows={2}
                  className="flex-1 bg-[#141414] border border-white/[0.1] focus:border-gold px-3.5 py-2.5 text-xs text-ivory placeholder-ivory/25 outline-none resize-none transition-colors rounded-xs leading-relaxed"
                />
                <button
                  type="submit"
                  disabled={sending || !messageText.trim()}
                  className="p-3 bg-gold hover:bg-gold-light disabled:opacity-40 disabled:cursor-not-allowed text-black-matte transition-all rounded-xs cursor-pointer flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </section>
  );
}

