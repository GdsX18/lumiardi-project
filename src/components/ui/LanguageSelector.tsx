'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useLanguage, LANGUAGES, LanguageCode } from '@/context/LanguageContext';

interface LanguageSelectorProps {
  lightTheme?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ lightTheme = false }) => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 text-xs font-sans tracking-widest uppercase transition-colors px-2.5 py-1.5 border cursor-pointer ${
          lightTheme
            ? 'border-[#0B0B0B]/20 text-[#0B0B0B]/80 hover:border-[#C9A96B] hover:text-[#A97745] bg-white/50'
            : 'border-white/20 text-ivory/80 hover:border-gold hover:text-gold bg-black/40'
        }`}
        aria-label="Selecionar idioma"
      >
        <span className="font-semibold px-1 py-0.5 bg-[#C9A96B]/20 text-[#C9A96B] text-[10px] rounded-[2px]">
          {selectedLang.shortLabel}
        </span>
        <span className="font-medium">{selectedLang.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-44 py-2 shadow-2xl border z-50 animate-in fade-in slide-in-from-top-2 duration-200 ${
            lightTheme
              ? 'bg-white border-[#0B0B0B]/10 text-[#0B0B0B]'
              : 'bg-[#141414] border-white/15 text-ivory'
          }`}
        >
          <div className="px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-[#C9A96B] font-sans font-semibold border-b border-white/10 mb-1">
            Idioma / Language
          </div>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code as LanguageCode);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-sans transition-colors text-left cursor-pointer ${
                language === lang.code
                  ? lightTheme
                    ? 'bg-[#C9A96B]/15 text-[#8C6B2F] font-medium'
                    : 'bg-gold/15 text-gold font-medium'
                  : lightTheme
                  ? 'hover:bg-black/5 text-[#0B0B0B]/80'
                  : 'hover:bg-white/5 text-ivory/80'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold px-1 py-0.5 bg-[#C9A96B]/20 text-[#C9A96B] text-[9px] rounded-[2px]">
                  {lang.shortLabel}
                </span>
                <span>{lang.name}</span>
              </div>
              {language === lang.code && <Check className="w-3.5 h-3.5 stroke-[2]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
