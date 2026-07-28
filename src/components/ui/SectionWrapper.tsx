import React from 'react';
import { cn } from '@/lib/utils';

export interface SectionWrapperProps {
  id?: string;
  bg?: 'dark' | 'light';
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

export const SectionWrapper: React.FC<SectionWrapperProps> = ({
  id,
  bg = 'dark',
  children,
  className,
  containerClassName,
}) => {
  return (
    <section
      id={id}
      className={cn(
        'w-full py-20 md:py-32 relative overflow-hidden transition-colors duration-500',
        bg === 'dark' ? 'bg-[#0B0B0B] text-ivory' : 'bg-[#F7F3EC] text-black-matte',
        className
      )}
    >
      <div className={cn('max-w-7xl mx-auto px-6 md:px-12 lg:px-16 relative z-10', containerClassName)}>
        {children}
      </div>
    </section>
  );
};
