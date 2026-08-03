'use client';

import React, { useState } from 'react';
import { Send, ShieldCheck, Paperclip } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useLanguage } from '@/context/LanguageContext';

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isMe?: boolean;
}

export const ChatPanel: React.FC = () => {
  const { t } = useLanguage();

  const initialMessages: ChatMessage[] = [
    {
      id: '1',
      sender: 'Aura Management',
      text: t('chat_msg1'),
      time: '14:32',
      isMe: false,
    },
    {
      id: '2',
      sender: t('chat_you'),
      text: t('chat_msg2'),
      time: '14:35',
      isMe: true,
    },
    {
      id: '3',
      sender: 'Aura Management',
      text: t('chat_msg3'),
      time: '14:38',
      isMe: false,
    },
  ];

  const [extraMessages, setExtraMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    setExtraMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: t('chat_you'),
        text: inputVal,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: true,
      },
    ]);
    setInputVal('');
  };

  const allMessages = [...initialMessages, ...extraMessages];

  return (
    <div className="w-full bg-[#0F0F0F] border border-bronze/30 text-ivory p-4 md:p-6 flex flex-col h-[520px] justify-between">
      {/* Header do Chat */}
      <div className="flex items-center justify-between pb-4 border-b border-bronze/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gold/10 border border-gold/40 flex items-center justify-center font-serif-lumiardi text-gold font-bold text-lg">
            AM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-serif-lumiardi text-lg font-medium text-ivory">
                Aura Management
              </h4>
              <ShieldCheck className="w-4 h-4 text-gold" />
            </div>
            <span className="text-[10px] text-ivory/50 font-sans tracking-wider uppercase block">
              {t('showcase_agency_type')}
            </span>
          </div>
        </div>
        <Badge variant="gold" className="text-[9px]">
          {t('chat_status')}
        </Badge>
      </div>

      {/* Lista de Mensagens */}
      <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-2">
        {allMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
          >
            <span className="text-[10px] text-ivory/40 font-sans mb-1">
              {msg.sender} · {msg.time}
            </span>
            <div
              className={`p-3.5 max-w-[85%] text-xs md:text-sm font-sans leading-relaxed ${
                msg.isMe
                  ? 'bg-gold text-black-matte border border-gold font-medium'
                  : 'bg-[#181818] text-ivory border border-bronze/30'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Form de Envio */}
      <form onSubmit={handleSend} className="flex gap-2 pt-3 border-t border-bronze/20">
        <button
          type="button"
          className="p-3 bg-[#181818] text-ivory/60 hover:text-gold border border-bronze/30 transition-colors"
          aria-label={t('chat_attach')}
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <input
          type="text"
          placeholder={t('chat_type_placeholder')}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          className="flex-1 bg-[#181818] border border-bronze/30 px-4 py-2.5 text-xs md:text-sm text-ivory placeholder:text-ivory/30 focus:outline-none focus:border-gold font-sans"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-gold text-black-matte font-medium hover:bg-gold-light transition-colors flex items-center gap-1.5 text-xs font-sans uppercase tracking-wider cursor-pointer"
        >
          <span>{t('chat_send')}</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
