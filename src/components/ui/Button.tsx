'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline-dark';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  className,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-300 rounded-none tracking-wider text-xs md:text-sm uppercase font-sans cursor-pointer focus:outline-none';

  const variants = {
    primary:
      'bg-gold text-black-matte hover:bg-gold-light shadow-md hover:shadow-gold/20 border border-gold',
    secondary:
      'bg-transparent text-gold border border-gold/60 hover:border-gold hover:bg-gold/10',
    ghost:
      'bg-transparent text-ivory hover:text-gold hover:bg-white/5 border border-transparent',
    'outline-dark':
      'bg-transparent text-black-matte border border-black-matte/30 hover:border-black-matte hover:bg-black-matte/5',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs gap-1.5',
    md: 'px-6 py-3 text-xs md:text-sm gap-2',
    lg: 'px-8 py-4 text-sm md:text-base gap-3.5',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      <span>{children}</span>
      {icon && <span className="transition-transform duration-300 group-hover:translate-x-1">{icon}</span>}
    </motion.button>
  );
};
