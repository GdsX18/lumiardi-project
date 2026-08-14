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
} from 'lucide-react';

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
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 'curation',
      name: 'Mesa de Curadoria Lumiardi',
      avatarText: 'LM',
      subtitle: 'Suporte Oficial & Compliance VIP',
      lastMessage: 'Bem-vinda à plataforma Lumiardi!',
      lastTime: 'Hoje',
      unreadCount: 0,
      verified: true,
    },
    {
      id: 'agency-aura',
      name: 'Aura Management (Casting)',
      avatarText: 'AM',
      subtitle: 'Diretoria de Casting Internacional',
      lastMessage: 'Proposta de ensaio editorial disponível para revisão.',
      lastTime: 'Ontem',
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
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0];

  // Carregar conversas da API
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/conversations');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.conversations)) {
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
              id: m.id,
              sender: m.senderId === 'user-model-1' ? 'Você' : activeConv.name,
              text: m.text,
              time: new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isMe: m.senderId === 'user-model-1' || m.senderId === 'Você',
              hasAttachment: !!(m.attachmentUrl || m.attachmentName),
              attachmentName: m.attachmentName,
              attachmentUrl: m.attachmentUrl,
              attachmentType: m.attachmentType,
            }))
          );
        }
      }
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    }
  }, [activeConvId, activeConv.name]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

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
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setAttachedFile({
          name: file.name,
          url: data.url,
          type: file.type.startsWith('image/') ? 'image' : 'file',
        });
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachedFile({
            name: file.name,
            url: typeof reader.result === 'string' ? reader.result : undefined,
            type: file.type.startsWith('image/') ? 'image' : 'file',
          });
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.warn('Erro ao processar anexo:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() && !attachedFile) return;

    const textToSend = inputVal.trim();
    const currentAttachment = attachedFile;

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const tempMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'Você',
      text: textToSend,
      time: timeStr,
      isMe: true,
      hasAttachment: !!currentAttachment,
      attachmentName: currentAttachment?.name,
      attachmentUrl: currentAttachment?.url,
      attachmentType: currentAttachment?.type,
    };

    setMessages((prev) => [...prev, tempMessage]);
    setInputVal('');
    setAttachedFile(null);

    try {
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConvId,
          text: textToSend,
          attachmentUrl: currentAttachment?.url,
          attachmentName: currentAttachment?.name,
          attachmentType: currentAttachment?.type,
        }),
      });
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full bg-[#0B0B0B] border border-gold/30 text-ivory shadow-2xl flex flex-col md:flex-row h-[620px] overflow-hidden rounded-sm relative">
      {/* Coluna Lateral: Lista de Conversas */}
      <div
        className={`w-full md:w-80 bg-[#0E0E0E] border-r border-white/10 flex flex-col justify-between shrink-0 ${
          showMobileList ? 'flex absolute inset-0 z-30' : 'hidden md:flex'
        }`}
      >
        <div>
          <div className="p-4 border-b border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-serif-lumiardi text-base md:text-lg font-medium text-ivory flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-gold" />
                Mensagens Seguras
              </span>
              {showMobileList && (
                <button
                  onClick={() => setShowMobileList(false)}
                  className="md:hidden p-1 text-ivory/60 hover:text-ivory"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Campo de Busca */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-ivory/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar conversas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#161616] border border-white/10 pl-8 pr-3 py-1.5 text-xs text-ivory outline-none rounded-xs placeholder:text-ivory/30 focus:border-gold/50"
              />
            </div>
          </div>

          {/* Lista de Contatos */}
          <div className="overflow-y-auto max-h-[460px] divide-y divide-white/5">
            {filteredConversations.map((conv) => {
              const isSelected = conv.id === activeConvId;
              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    setActiveConvId(conv.id);
                    setShowMobileList(false);
                  }}
                  className={`w-full p-3.5 text-left transition-all flex items-start gap-3 cursor-pointer ${
                    isSelected ? 'bg-gold/10 border-l-2 border-gold' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="w-10 h-10 bg-gold/15 border border-gold/40 text-gold flex items-center justify-center font-serif-lumiardi font-bold shrink-0 text-sm rounded-xs">
                    {conv.avatarText}
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-serif-lumiardi text-sm font-medium text-ivory truncate flex items-center gap-1">
                        {conv.name}
                        {conv.verified && <ShieldCheck className="w-3.5 h-3.5 text-gold shrink-0" />}
                      </span>
                      <span className="text-[9px] text-ivory/40 font-sans">{conv.lastTime}</span>
                    </div>
                    <p className="text-[11px] text-ivory/60 font-sans truncate">{conv.lastMessage}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-3 bg-[#080808] border-t border-white/10 text-[10px] text-center text-ivory/40 font-sans">
          🔒 Zero rastreamento · Comunicação Criptografada
        </div>
      </div>

      {/* Janela de Conversa Ativa */}
      <div className="flex-1 flex flex-col justify-between bg-[#0B0B0B] h-full overflow-hidden">
        {/* Header da Conversa */}
        <div className="p-4 bg-[#0E0E0E] border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMobileList(true)}
              className="md:hidden p-1.5 bg-[#161616] border border-white/10 text-gold rounded-xs"
              title="Ver conversas"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 bg-gold/15 border border-gold/40 text-gold flex items-center justify-center font-serif-lumiardi font-bold text-sm rounded-xs">
              {activeConv.avatarText}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-serif-lumiardi text-sm md:text-base font-medium text-ivory">
                  {activeConv.name}
                </h4>
                <ShieldCheck className="w-3.5 h-3.5 text-gold" />
              </div>
              <span className="text-[10px] text-ivory/50 font-sans tracking-wider uppercase block">
                {activeConv.subtitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchMessages}
              title="Atualizar mensagens"
              className="p-2 bg-[#141414] hover:bg-[#202020] border border-white/10 text-ivory/70 hover:text-gold transition-colors rounded-xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <Link
              href="/dashboard/meet"
              className="px-3 py-1.5 bg-gold/10 hover:bg-gold text-gold hover:text-black-matte border border-gold/40 text-xs font-sans font-medium transition-colors flex items-center gap-1.5 rounded-xs"
            >
              <Video className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Iniciar Meet</span>
            </Link>
          </div>
        </div>

        {/* Histórico de Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          <div className="text-center my-2">
            <span className="px-3 py-1 bg-[#141414] border border-white/5 text-[10px] text-ivory/40 font-sans uppercase tracking-widest rounded-full">
              Canal de Mensagens Diretas Ativo
            </span>
          </div>

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'} space-y-1`}
            >
              <div
                className={`max-w-md p-3.5 rounded-xs text-xs font-sans leading-relaxed shadow-md ${
                  msg.isMe
                    ? 'bg-gold text-black-matte font-medium rounded-tr-none'
                    : 'bg-[#151515] border border-white/10 text-ivory/90 rounded-tl-none'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-70">
                  <span className="font-bold">{msg.sender}</span>
                  <span>{msg.time}</span>
                </div>

                <p className="whitespace-pre-wrap">{msg.text}</p>

                {msg.hasAttachment && (
                  <div
                    className={`mt-2.5 p-2.5 rounded-xs flex items-center justify-between gap-3 border ${
                      msg.isMe ? 'bg-black/10 border-black/20' : 'bg-[#1C1C1C] border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {msg.attachmentType === 'image' ? (
                        <ImageIcon className="w-4 h-4 text-gold shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-gold shrink-0" />
                      )}
                      <span className="truncate text-[11px]">{msg.attachmentName || 'Anexo'}</span>
                    </div>

                    {msg.attachmentUrl && (
                      <a
                        href={msg.attachmentUrl}
                        download={msg.attachmentName || 'anexo_lumiardi'}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 hover:text-gold transition-colors shrink-0"
                        title="Download do Anexo"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Prévia do Anexo Selecionado */}
        {attachedFile && (
          <div className="px-4 py-2 bg-[#141414] border-t border-gold/30 flex items-center justify-between text-xs text-gold">
            <span className="flex items-center gap-2 truncate">
              <Paperclip className="w-3.5 h-3.5" />
              <span>Anexo pronto: <strong>{attachedFile.name}</strong></span>
            </span>
            <button
              onClick={() => setAttachedFile(null)}
              className="text-ivory/50 hover:text-rose-400 text-xs cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input de Mensagem Real */}
        <form onSubmit={handleSend} className="p-3 md:p-4 bg-[#0E0E0E] border-t border-white/10 flex items-center gap-2">
          <label
            className="p-2.5 bg-[#161616] hover:bg-gold hover:text-black-matte text-ivory/70 border border-white/10 transition-colors rounded-xs cursor-pointer shrink-0"
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
            type="text"
            placeholder={`Escreva uma mensagem para ${activeConv.name}...`}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="flex-1 bg-[#161616] border border-white/10 focus:border-gold px-4 py-2.5 text-xs text-ivory outline-none rounded-xs"
          />

          <button
            type="submit"
            disabled={(!inputVal.trim() && !attachedFile) || isUploading}
            className="px-4 py-2.5 bg-gold hover:bg-gold-light disabled:opacity-40 text-black-matte font-bold text-xs uppercase tracking-wider rounded-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isUploading ? 'Enviando...' : 'Enviar'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
