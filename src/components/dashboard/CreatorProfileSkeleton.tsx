'use client';

import React from 'react';

export const CreatorProfileSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse" aria-busy="true" aria-label="Carregando Book da Modelo">
      {/* Header do Perfil Skeleton */}
      <div className="p-6 md:p-8 bg-[#0F0F0F] border border-gold/20 shadow-2xl relative overflow-hidden rounded-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Foto Principal Skeleton */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 border-2 border-gold/40 p-1 bg-black shrink-0 rounded-sm overflow-hidden">
              <div className="w-full h-full bg-[#161616] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/20" />
              </div>
            </div>

            <div className="space-y-3">
              {/* Badges Skeleton */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="h-5 w-28 bg-gold/10 border border-gold/20 rounded-xs" />
                <div className="h-5 w-36 bg-emerald-950/40 border border-emerald-500/20 rounded-xs" />
                <div className="h-5 w-32 bg-white/5 border border-white/10 rounded-xs" />
              </div>

              {/* Nome Artístico Skeleton */}
              <div className="h-9 w-64 md:w-80 bg-white/10 rounded-xs" />

              {/* Localização e Instagram Skeleton */}
              <div className="flex items-center gap-3 pt-0.5">
                <div className="h-4 w-40 bg-white/5 rounded-xs" />
                <div className="h-4 w-24 bg-gold/15 rounded-xs" />
              </div>
            </div>
          </div>

          {/* Ações Rápidas Skeleton */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-10 w-44 bg-[#161616] border border-gold/30 rounded-sm" />
            <div className="h-10 w-32 bg-[#161616] border border-white/10 rounded-sm" />
            <div className="h-10 w-40 bg-gold/30 rounded-sm" />
          </div>
        </div>

        {/* Sub-navegação interna skeleton */}
        <div className="flex gap-2 mt-8 pt-4 border-t border-white/10">
          <div className="h-8 w-32 bg-gold/15 border-b-2 border-gold rounded-xs" />
          <div className="h-8 w-32 bg-white/5 rounded-xs" />
          <div className="h-8 w-28 bg-white/5 rounded-xs" />
        </div>
      </div>

      {/* Showreel Skeleton */}
      <div className="p-6 bg-[#0B0B0B] border border-white/10 rounded-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="h-6 w-56 bg-white/10 rounded-xs" />
          <div className="h-8 w-44 bg-[#141414] border border-gold/20 rounded-sm" />
        </div>
        <div className="relative w-full h-72 md:h-80 bg-[#080808] border border-gold/15 rounded-sm flex items-center justify-center overflow-hidden">
          <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-gold/20" />
          </div>
        </div>
      </div>

      {/* Grid de Fotos Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-3 w-36 bg-gold/20 rounded-xs" />
            <div className="h-7 w-60 bg-white/10 rounded-xs" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-44 bg-gold/15 border border-gold/30 rounded-sm" />
            <div className="h-4 w-28 bg-white/5 rounded-xs" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-80 bg-[#101010] border border-gold/20 relative overflow-hidden rounded-sm flex flex-col justify-end p-4 space-y-2"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="relative z-10 h-3 w-20 bg-gold/25 rounded-xs" />
              <div className="relative z-10 h-5 w-36 bg-white/15 rounded-xs" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

