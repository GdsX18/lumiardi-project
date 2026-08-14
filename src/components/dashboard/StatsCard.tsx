'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  subtitle?: string;
  icon?: LucideIcon;
  badgeText?: string;
  className?: string;
  highlight?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  subtitle,
  icon: Icon,
  badgeText,
  className,
  highlight = false,
}) => {
  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={cn(
        'relative overflow-hidden p-5 md:p-6 border transition-all duration-300 backdrop-blur-sm',
        highlight
          ? 'bg-[#12110D] border-gold/40 shadow-[0_0_20px_rgba(201,169,107,0.12)]'
          : 'bg-[#0E0E0E]/90 border-white/[0.08] hover:border-gold/30 hover:bg-[#141414]',
        className
      )}
    >
      {/* Glow sutil no topo do card */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent opacity-60" />

      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-ivory/60 font-light">
          {title}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-none bg-gold/10 border border-gold/20 flex items-center justify-center text-gold shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="font-serif-lumiardi text-2xl md:text-3xl font-light tracking-wide text-ivory">
          {value}
        </span>
        {badgeText && (
          <span className="text-[9px] font-sans uppercase tracking-widest px-2 py-0.5 bg-gold/15 text-gold border border-gold/30 font-medium">
            {badgeText}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs font-sans text-ivory/50 pt-2 border-t border-white/[0.06]">
        {change && (
          <span
            className={cn(
              'flex items-center gap-1 font-medium text-[11px]',
              isPositive ? 'text-emerald-400' : 'text-rose-400'
            )}
          >
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {change}
          </span>
        )}
        {subtitle && <span className="text-[10px] text-ivory/40 truncate">{subtitle}</span>}
      </div>
    </motion.div>
  );
};
