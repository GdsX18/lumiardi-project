'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'dark' | 'light' | 'gold-border';
  number?: string;
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'dark',
  number,
  title,
  subtitle,
  children,
  className,
  ...props
}) => {
  const baseStyles = 'relative p-6 md:p-8 transition-all duration-300 flex flex-col justify-between';

  const variants = {
    dark: 'bg-[#0F0F0F] text-ivory border border-bronze/20 hover:border-gold/50 hover:bg-[#141414]',
    light: 'bg-[#F7F3EC] text-black-matte border border-black-matte/10 hover:border-bronze/40 shadow-sm',
    'gold-border': 'bg-[#0B0B0B] text-ivory border border-gold/40 hover:border-gold gold-border-glow',
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    >
      {number && (
        <span className="font-serif-lumiardi text-2xl md:text-3xl font-light text-gold tracking-widest block mb-4">
          {number}
        </span>
      )}
      {title && (
        <h3 className="font-serif-lumiardi text-xl md:text-2xl font-medium tracking-tight mb-2">
          {title}
        </h3>
      )}
      {subtitle && (
        <p className="text-xs md:text-sm text-bronze uppercase tracking-wider mb-4 font-sans font-medium">
          {subtitle}
        </p>
      )}
      {children}
    </motion.div>
  );
};
