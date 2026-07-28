import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gold' | 'bronze' | 'outline' | 'dark';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gold',
  className,
}) => {
  const baseStyles =
    'inline-block px-3 py-1 text-[10px] md:text-xs font-semibold tracking-widest uppercase font-sans border transition-colors';

  const variants = {
    gold: 'bg-gold/10 text-gold border-gold/40',
    bronze: 'bg-bronze/10 text-bronze border-bronze/40',
    outline: 'bg-transparent text-ivory border-ivory/30',
    dark: 'bg-black-matte text-gold border-gold/30',
  };

  return (
    <span className={cn(baseStyles, variants[variant], className)}>
      {children}
    </span>
  );
};
