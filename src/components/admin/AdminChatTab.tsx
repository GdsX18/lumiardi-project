'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [selectedConv, setSelectedConv] = useState<AdminConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [lastMsgTime, setLastMsgTime] = useState<string | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const convPollingRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Load Conversations ─────────────────────────────────────────────────

  const loadConversations = useCallback(async () => {
    try {
      const params = new URLSearchParams({ filter });
      if (search.trim()) params.set('search', search.trim());
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
  }, [filter, search]);

  useEffect(() => {
    setLoadingConvs(true);
    loadConversations();
  }, [loadConversations]);

  // Poll conversations every 15s
  useEffect(() => {
    convPollingRef.current = setInterval(loadConversations, 15000);
    return () => { if (convPollingRef.current) clearInterval(convPollingRef.current); };
  }, [loadConversations]);

  // ─── Load Messages ──────────────────────────────────────────────────────

  const loadMessages = useCallback(async (userId: string, since?: string) => {
    if (!since) setLoadingMsgs(true);
    try {
      const params = new URLSearchParams({ conversationId: 'curation' });
      if (since) params.set('since', since);
      const res = await fetch(`/api/chat/messages?${params}`);
      if (res.status === 304) return; // no new messages
      if (!res.ok) return;
      const data = await res.json();

      const allMsgs: ChatMessage[] = (data.messages || []).filter(
        (m: ChatMessage) =>
          m.senderId === userId ||
          m.senderId === 'admin-curadoria-1' ||
          (m.senderRole === 'curadoria') ||
          (m as any).receiverId === userId
      );

      if (since) {
        // Incremental: only append new messages
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newOnes = allMsgs.filter((m) => !existingIds.has(m.id));
          return newOnes.length > 0 ? [...prev, ...newOnes] : prev;
        });
      } else {
        setMessages(allMsgs);
      }

      if (allMsgs.length > 0) {
        const latest = allMsgs[allMsgs.length - 1];
        setLastMsgTime(latest.createdAt);
      }
    } catch {
      // silent
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedConv) return;
    setMessages([]);
    setLastMsgTime(undefined);
    loadMessages(selectedConv.userId);
  }, [selectedConv, loadMessages]);

  // Incremental polling for active conversation
  useEffect(() => {
    if (!selectedConv) return;
    pollingRef.current = setInterval(() => {
      loadMessages(selectedConv.userId, lastMsgTime);
    }, 2500);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [selectedConv, lastMsgTime, loadMessages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Send Message ───────────────────────────────────────────────────────

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv || !messageText.trim() || sending) return;

    setSending(true);
    setErrorMsg(null);
    const textToSend = messageText.trim();
    setMessageText('');

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSend,
          conversationId: 'curation',
          receiverId: selectedConv.userId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error || 'Erro ao enviar mensagem.');
        setMessageText(textToSend); // restore
      } else {
        // Reload messages immediately after send
        await loadMessages(selectedConv.userId);
        await loadConversations();
      }
    } catch {
      setErrorMsg('Falha na conexão ao enviar mensagem.');
      setMessageText(textToSend);
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
                onClick={() => setSelectedConv(conv)}
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
              {loadingMsgs ? (
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
                  const isAdmin = msg.senderRole === 'curadoria' || msg.isMe;
                  return (
                    <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[72%] space-y-1 ${isAdmin ? 'items-end' : 'items-start'} flex flex-col`}>
                        <span className="text-[10px] text-ivory/40 font-sans px-1">
                          {msg.senderName || (isAdmin ? 'Curadoria' : selectedConv.displayName)}
                        </span>
                        <div
                          className={`px-4 py-2.5 rounded-xs text-xs font-sans leading-relaxed ${
                            isAdmin
                              ? 'bg-gold/10 border border-gold/20 text-ivory'
                              : 'bg-white/[0.06] border border-white/[0.08] text-ivory/90'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[9px] text-ivory/25 font-sans px-1">
                          {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
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

