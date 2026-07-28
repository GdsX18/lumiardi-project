'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export const VideoCallWidget: React.FC = () => {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [inCall, setInCall] = useState(true);

  return (
    <div className="w-full bg-[#0E0E0E] border border-bronze/30 p-4 md:p-6 text-ivory">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-bronze/20">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-gold" />
          <span className="font-serif-lumiardi text-lg font-light text-ivory">
            Lumiardi Meet (Criptografado)
          </span>
        </div>
        <Badge variant="gold" className="text-[9px]">
          REUNIÃO AO VIVO
        </Badge>
      </div>

      {inCall ? (
        <div className="relative w-full h-64 md:h-80 bg-black border border-bronze/20 overflow-hidden flex items-center justify-center">
          {/* Tela principal da chamada */}
          <div className="relative w-full h-full">
            <Image
              src="/images/hero_visual.jpg"
              alt="Reunião Virtual Aura Management"
              fill
              className={`object-cover ${camOn ? 'opacity-80' : 'opacity-10'}`}
            />
            {!camOn && (
              <div className="absolute inset-0 flex items-center justify-center text-ivory/40 font-serif-lumiardi text-xl">
                Câmera Desativada
              </div>
            )}

            <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1 text-xs font-sans text-ivory border border-white/10">
              Aura Management · Diretor de Talentos
            </div>

            {/* Minha imagem em PIP */}
            <div className="absolute top-4 right-4 w-28 h-20 bg-[#181818] border border-gold/40 shadow-md overflow-hidden flex items-center justify-center">
              <span className="text-[10px] text-gold font-serif-lumiardi">Você (Criador)</span>
            </div>
          </div>

          {/* Controls da chamada na base */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/80 p-2 border border-bronze/40 backdrop-blur-sm">
            <button
              onClick={() => setMicOn(!micOn)}
              className={`p-2.5 rounded-none transition-colors ${
                micOn ? 'bg-white/10 text-ivory hover:bg-white/20' : 'bg-rose-900/50 text-rose-300'
              }`}
              aria-label="Microfone"
            >
              {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setCamOn(!camOn)}
              className={`p-2.5 rounded-none transition-colors ${
                camOn ? 'bg-white/10 text-ivory hover:bg-white/20' : 'bg-rose-900/50 text-rose-300'
              }`}
              aria-label="Câmera"
            >
              {camOn ? <VideoIcon className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setInCall(false)}
              className="p-2.5 bg-rose-700 text-white hover:bg-rose-800 transition-colors"
              aria-label="Encerrar"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="h-64 md:h-80 bg-[#121212] border border-bronze/20 flex flex-col items-center justify-center gap-4 text-center p-6">
          <p className="font-serif-lumiardi text-xl text-ivory">Chamada Encerrada</p>
          <button
            onClick={() => setInCall(true)}
            className="px-6 py-2.5 bg-gold text-black-matte font-medium text-xs uppercase tracking-wider font-sans hover:bg-gold-light transition-colors"
          >
            Reconectar Reunião
          </button>
        </div>
      )}
    </div>
  );
};
