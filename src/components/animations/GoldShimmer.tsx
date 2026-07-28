'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface GoldShimmerProps {
  children: React.ReactNode;
  className?: string;
}

export const GoldShimmer: React.FC<GoldShimmerProps> = ({ children, className }) => {
  return (
    <motion.span
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={cn(
        'inline-block bg-[length:200%_auto] bg-clip-text text-transparent bg-gradient-to-r from-gold via-gold-light to-bronze font-serif-lumiardi',
        className
      )}
    >
      {children}
    </motion.span>
  );
};
