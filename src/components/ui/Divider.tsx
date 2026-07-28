import React from 'react';
import { cn } from '@/lib/utils';

export interface DividerProps {
  variant?: 'bronze' | 'gold' | 'fade';
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({
  variant = 'bronze',
  orientation = 'horizontal',
  className,
}) => {
  if (orientation === 'vertical') {
    return (
      <div
        className={cn(
          'w-[1px] h-full self-stretch opacity-40',
          variant === 'gold' && 'bg-gold',
          variant === 'bronze' && 'bg-bronze',
          variant === 'fade' && 'bg-gradient-to-b from-transparent via-gold to-transparent',
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'h-[1px] w-full opacity-40',
        variant === 'gold' && 'bg-gold',
        variant === 'bronze' && 'bg-bronze',
        variant === 'fade' && 'bg-gradient-to-r from-transparent via-gold to-transparent',
        className
      )}
    />
  );
};
