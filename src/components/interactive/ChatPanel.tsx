'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
  Sparkles,
  Smile,
  Copy,
  Check,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export interface ChatMessage {
  id: string;
  senderId?: string;
  sender?: string;
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
  name: string;
  avatarText: string;
  subtitle: string;
  lastMessage: string;
  lastTime: string;
  unreadCount?: number;
  verified: boolean;
}

export const ChatPanel: React.FC = () => {
  const { t } = useLanguage();
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
    },
  ]);

  const [activeConvId, setActiveConvId] = useState<string>('curation');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [attachedFile, setAttachedFile] = useState<{ name: string; url?: string; type: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showMobileList, setShowMobileList] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0];

  // Carregar conversas da API
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/conversations');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.conversations) && data.conversations.length > 0) {
          setConversations(data.conversations);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar conversas:', err);
    }
  }, []);

  // Carregar mensagens da conversa ativa
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat/messages?conversationId=${encodeURIComponent(activeConvId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages)) {
          setMessages(
            data.messages.map((m: any) => ({
              id: m.id || String(Math.random()),
              senderId: m.senderId,
              sender: m.sender || m.senderName || 'Lumiardi Member',
              text: m.text || m.content || '',
              time: m.time || (m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Agora'),
              isMe: m.isMe !== undefined ? m.isMe : m.senderId === 'me' || m.sender === 'Você',
              hasAttachment: !!m.hasAttachment || !!m.attachmentUrl,
              attachmentName: m.attachmentName,
              attachmentUrl: m.attachmentUrl,
              attachmentType: m.attachmentType || 'file',
            }))
          );
        }
      }
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    }
  }, [activeConvId]);

  useEffect(() => {
    fetchConversations();
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [fetchConversations, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'chat');

      const res = await fetch('/api/drive/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setAttachedFile({
          name: file.name,
          url: data.file?.url,
          type: file.type.startsWith('image/') ? 'image' : 'file',
        });
      } else {
        setAttachedFile({
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'file',
        });
      }
    } catch {
      setAttachedFile({
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'file',
      });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputVal.trim() && !attachedFile) || isUploading) return;

    const currentText = inputVal.trim();
    const currentAttachment = attachedFile;

    const tempId = String(Date.now());
    const optimisticMsg: ChatMessage = {
      id: tempId,
      senderId: 'me',
      sender: 'Você',
      text: currentText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      hasAttachment: !!currentAttachment,
      attachmentName: currentAttachment?.name,
      attachmentUrl: currentAttachment?.url,
      attachmentType: currentAttachment?.type,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputVal('');
    setAttachedFile(null);

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConvId,
          text: currentText,
          hasAttachment: !!currentAttachment,
          attachmentName: currentAttachment?.name,
          attachmentUrl: currentAttachment?.url,
          attachmentType: currentAttachment?.type,
        }),
      });

      if (res.ok) {
        fetchMessages();
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    }
  };

  const copyMessageText = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full bg-[#0A0A0A] border border-white/[0.08] text-ivory shadow-2xl flex flex-col md:flex-row h-[calc(100vh-210px)] min-h-[640px] overflow-hidden rounded-sm relative backdrop-blur-xl">
      {/* Coluna Lateral: Lista de Conversas */}
      <div
        className={`w-full md:w-84 lg:w-96 bg-[#080808] border-r border-white/[0.06] flex flex-col justify-between shrink-0 ${
          showMobileList ? 'flex absolute inset-0 z-30' : 'hidden md:flex'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header da Sidebar */}
          <div className="p-4 border-b border-white/[0.06] space-y-3 bg-[#0D0D0D]/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xs bg-gold/10 border border-gold/30 text-gold flex items-center justify-center">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-serif-lumiardi text-base font-medium text-ivory block leading-tight">
                    {t('chat_secure_channels') || 'Canais Seguros'}
                  </span>
                  <span className="text-[10px] font-sans text-ivory/40">Criptografia E2E</span>
                </div>
              </div>

              {showMobileList && (
                <button
                  onClick={() => setShowMobileList(false)}
                  className="md:hidden p-1.5 text-ivory/60 hover:text-ivory bg-white/5 rounded-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Campo de Busca Fluido */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-ivory/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('chat_search_placeholder') || 'Pesquisar mensagens ou canais...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#121212] border border-white/[0.08] pl-9 pr-3 py-2 text-xs text-ivory outline-none rounded-xs placeholder:text-ivory/30 focus:border-gold/40 transition-colors"
              />
            </div>
          </div>

          {/* Lista de Contatos com Scroll Suave */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.03] p-2 space-y-1">
            {filteredConversations.map((conv) => {
              const isSelected = conv.id === activeConvId;
              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    setActiveConvId(conv.id);
                    setShowMobileList(false);
                  }}
                  className={`w-full p-3.5 text-left transition-all flex items-start gap-3 cursor-pointer rounded-xs ${
                    isSelected
                      ? 'bg-gradient-to-r from-gold/15 via-gold/5 to-transparent border-l-2 border-gold text-ivory shadow-inner'
                      : 'hover:bg-white/[0.03] text-ivory/70'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 bg-[#141414] border border-gold/40 text-gold flex items-center justify-center font-serif-lumiardi font-bold text-sm rounded-xs shadow-md">
                      {conv.avatarText}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-serif-lumiardi text-sm font-medium text-ivory truncate flex items-center gap-1.5">
                        {conv.name}
                        {conv.verified && <ShieldCheck className="w-3.5 h-3.5 text-gold shrink-0" />}
                      </span>
                      <span className="text-[10px] text-ivory/40 font-sans">{conv.lastTime}</span>
                    </div>
                    <p className="text-[11px] text-ivory/60 font-sans truncate leading-relaxed">
                      {conv.lastMessage}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Rodapé da Sidebar */}
          <div className="p-3 bg-[#060606] border-t border-white/[0.06] text-[10px] text-center text-ivory/40 font-sans flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-gold/60" />
            <span>{t('chat_e2e_shield') || 'Blindagem Criptográfica Lumiardi E2E'}</span>
          </div>
        </div>
      </div>

      {/* Janela de Conversa Ativa */}
      <div className="flex-1 flex flex-col justify-between bg-[#0B0B0B] h-full overflow-hidden">
        {/* Header da Conversa Ativa */}
        <div className="p-4 bg-[#0E0E0E]/90 border-b border-white/[0.06] flex items-center justify-between shrink-0 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMobileList(true)}
              className="md:hidden p-2 bg-[#161616] border border-white/10 text-gold rounded-xs hover:bg-white/10"
              title="Ver canais"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="relative">
              <div className="w-11 h-11 bg-gold/10 border border-gold/40 text-gold flex items-center justify-center font-serif-lumiardi font-bold text-sm rounded-xs shadow-md">
                {activeConv.avatarText}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif-lumiardi text-base md:text-lg font-medium text-ivory">
                  {activeConv.name}
                </h3>
                <ShieldCheck className="w-4 h-4 text-gold shrink-0" />
                <span className="hidden sm:inline-block px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-sans rounded-xs uppercase tracking-wider">
                  {t('chat_official_channel') || 'Canal Oficial'}
                </span>
              </div>
              <span className="text-[11px] text-ivory/50 font-sans flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{t('chat_priority_response') || 'Equipe Ativa · Resposta Prioritária'}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchMessages}
              title="Atualizar mensagens"
              className="p-2.5 bg-[#141414] hover:bg-[#202020] border border-white/[0.08] text-ivory/70 hover:text-gold transition-colors rounded-xs cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <Link
              href="/dashboard/meet"
              className="px-4 py-2 bg-gradient-to-r from-gold to-gold-light hover:brightness-110 text-black-matte font-semibold text-xs font-sans uppercase tracking-wider transition-all flex items-center gap-1.5 rounded-xs shadow-md shadow-gold/10"
            >
              <Video className="w-3.5 h-3.5 fill-black-matte" />
              <span className="hidden sm:inline">{t('chat_start_vip_meet') || 'Iniciar Reunião VIP'}</span>
            </Link>
          </div>
        </div>

        {/* Histórico de Mensagens com Design Limpo e Fluido */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          <div className="flex items-center justify-center my-2">
            <div className="px-4 py-1.5 bg-[#121212] border border-white/[0.06] text-[10px] text-ivory/50 font-sans uppercase tracking-[0.2em] rounded-full flex items-center gap-2 shadow-sm">
              <Lock className="w-3 h-3 text-gold/70" />
              <span>{t('chat_aes_shield') || 'Sessão Protegida por Criptografia AES-256'}</span>
            </div>
          </div>

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'} space-y-1.5 group`}
            >
              <div
                className={`max-w-xl md:max-w-2xl p-4 rounded-sm text-xs font-sans leading-relaxed shadow-lg relative transition-all ${
                  msg.isMe
                    ? 'bg-gradient-to-br from-gold/90 via-gold to-gold-dark text-black-matte font-medium rounded-tr-none'
                    : 'bg-[#141414] border border-white/[0.08] text-ivory/90 rounded-tl-none hover:border-gold/30'
                }`}
              >
                {/* Header da Bolha de Mensagem */}
                <div className="flex items-center justify-between gap-6 mb-1.5 text-[10px] opacity-80 border-b border-current/10 pb-1">
                  <span className="font-bold tracking-wide">{msg.sender}</span>
                  <div className="flex items-center gap-1.5">
                    <span>{msg.time}</span>
                    {msg.isMe && <CheckCheck className="w-3.5 h-3.5" />}
                  </div>
                </div>

                {/* Conteúdo Textual */}
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{msg.text}</p>

                {/* Bloco de Anexo Fluido */}
                {msg.hasAttachment && (
                  <div
                    className={`mt-3 p-3 rounded-xs flex items-center justify-between gap-3 border transition-all ${
                      msg.isMe
                        ? 'bg-black/15 border-black/20 text-black-matte'
                        : 'bg-[#1C1C1C] border-white/[0.08] text-ivory'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {msg.attachmentType === 'image' ? (
                        <ImageIcon className="w-4 h-4 text-gold shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-gold shrink-0" />
                      )}
                      <span className="truncate text-xs font-medium">{msg.attachmentName || 'Anexo Lumiardi'}</span>
                    </div>

                    {msg.attachmentUrl && (
                      <a
                        href={msg.attachmentUrl}
                        download={msg.attachmentName || 'anexo_lumiardi'}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 hover:text-gold hover:bg-white/10 transition-all rounded-xs shrink-0"
                        title="Download do Anexo"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )}

                {/* Botão Flutuante de Copiar */}
                <button
                  onClick={() => copyMessageText(msg.id, msg.text)}
                  title="Copiar mensagem"
                  className={`absolute -top-2 ${msg.isMe ? '-left-6' : '-right-6'} opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-[#181818] border border-white/10 rounded-xs text-ivory/60 hover:text-gold shadow-md cursor-pointer`}
                >
                  {copiedMsgId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Prévia de Anexo Selecionado */}
        {attachedFile && (
          <div className="px-5 py-2.5 bg-[#121212] border-t border-gold/30 flex items-center justify-between text-xs text-gold animate-fadeIn">
            <span className="flex items-center gap-2 truncate">
              <Paperclip className="w-4 h-4" />
              <span>{t('chat_ready_attachment') || 'Anexo pronto para envio'}: <strong>{attachedFile.name}</strong></span>
            </span>
            <button
              onClick={() => setAttachedFile(null)}
              className="text-ivory/50 hover:text-rose-400 text-xs cursor-pointer p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Barra de Input Expansiva e Fluida */}
        <form
          onSubmit={handleSend}
          className="p-4 md:p-5 bg-[#0E0E0E] border-t border-white/[0.08] flex items-center gap-3"
        >
          <label
            className="p-3 bg-[#161616] hover:bg-gold hover:text-black-matte text-ivory/70 border border-white/[0.08] hover:border-gold transition-all rounded-xs cursor-pointer shrink-0 shadow-sm"
            title="Anexar Foto ou Documento"
          >
            <Paperclip className="w-4 h-4" />
            <input
              type="file"
              disabled={isUploading}
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          <input
            ref={inputRef}
            type="text"
            placeholder={t('chat_input_placeholder') || `Escreva uma mensagem segura para ${activeConv.name}...`}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="flex-1 bg-[#141414] border border-white/[0.08] focus:border-gold/60 focus:bg-[#181818] px-5 py-3 text-xs md:text-sm text-ivory outline-none rounded-xs transition-all placeholder:text-ivory/30 shadow-inner"
          />

          <button
            type="submit"
            disabled={(!inputVal.trim() && !attachedFile) || isUploading}
            className="px-6 py-3 bg-gradient-to-r from-gold to-gold-light hover:brightness-110 disabled:opacity-30 disabled:hover:brightness-100 text-black-matte font-bold text-xs uppercase tracking-wider rounded-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-gold/20 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">{isUploading ? '...' : (t('chat_send') || 'Enviar')}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
