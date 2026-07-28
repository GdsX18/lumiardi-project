'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string;
  onSearch?: (value: string) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Buscar...',
  onSearch,
  className,
  ...props
}) => {
  return (
    <div className="relative w-full max-w-md">
      <input
        type="text"
        placeholder={placeholder}
        className={cn(
          'w-full bg-[#0F0F0F] border border-bronze/30 text-ivory placeholder:text-ivory/40 text-xs md:text-sm px-4 py-3.5 pl-11 focus:outline-none focus:border-gold transition-colors font-sans rounded-none',
          className
        )}
        onChange={(e) => onSearch?.(e.target.value)}
        {...props}
      />
      <Search className="w-4 h-4 text-gold absolute left-4 top-1/2 -translate-y-1/2" />
    </div>
  );
};
