'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ScrollText, Check } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface TermsAcceptanceModalProps {
  isOpen: boolean;
  onAccept: () => void;
  termsVersion?: string;
}

export function TermsAcceptanceModal({
  isOpen,
  onAccept,
  termsVersion = 'v2.1-2026-09',
}: TermsAcceptanceModalProps) {
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canAccept, setCanAccept] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (!isOpen) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      const timer = setTimeout(() => setCanAccept(true), 3000);
      return () => clearTimeout(timer);
    }
    // Focus the scroll container
    setTimeout(() => scrollRef.current?.focus(), 100);
  }, [isOpen]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const progress = Math.min(
      100,
      Math.round(((el.scrollTop + el.clientHeight) / el.scrollHeight) * 100)
    );
    setScrollProgress(progress);
    const threshold = 24;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
      setCanAccept(true);
    }
  }, []);

  const handleAccept = async () => {
    if (!canAccept || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await fetch('/api/terms/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termsVersion }),
      });
    } catch {
      // Non-blocking — accept proceeds even if persistence fails
    } finally {
      setIsSubmitting(false);
      onAccept();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-modal-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-[#111111] border border-white/10 rounded-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-1">
            <ScrollText size={18} className="text-[#c8a882]" />
            <p className="text-xs tracking-[3px] uppercase text-[#8E8E93]">
              {t('lgm_terms_required')}
            </p>
          </div>
          <h2
            id="terms-modal-title"
            className="text-xl font-semibold text-[#f5f0e8]"
          >
            {t('lgm_terms_title')}
          </h2>
          <p className="mt-1 text-sm text-[#8E8E93]">
            {t('lgm_terms_scroll_hint').replace('{version}', termsVersion)}
          </p>
        </div>

        {/* Scrollable Content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          tabIndex={0}
          className="overflow-y-scroll focus:outline-none"
          style={{ maxHeight: '55vh' }}
          aria-label={t('lgm_terms_content_aria')}
        >
          <div className="px-8 py-6 text-sm text-[#c8c0b0] leading-relaxed space-y-5">
            {/* Terms content paragraphs */}
            <div>
              <h3 className="text-[#f5f0e8] font-medium mb-2">{t('lgm_terms_s1_title')}</h3>
              <p>{t('lgm_terms_s1_text')}</p>
            </div>
            <div>
              <h3 className="text-[#f5f0e8] font-medium mb-2">{t('lgm_terms_s2_title')}</h3>
              <p>{t('lgm_terms_s2_text')}</p>
            </div>
            <div>
              <h3 className="text-[#f5f0e8] font-medium mb-2">{t('lgm_terms_s3_title')}</h3>
              <p>{t('lgm_terms_s3_text')}</p>
            </div>
            <div>
              <h3 className="text-[#f5f0e8] font-medium mb-2">{t('lgm_terms_s4_title')}</h3>
              <p>{t('lgm_terms_s4_text')}</p>
            </div>
            <div>
              <h3 className="text-[#f5f0e8] font-medium mb-2">{t('lgm_terms_s5_title')}</h3>
              <p>{t('lgm_terms_s5_text')}</p>
            </div>
            <div>
              <h3 className="text-[#f5f0e8] font-medium mb-2">{t('lgm_terms_s6_title')}</h3>
              <p>{t('lgm_terms_s6_text')}</p>
            </div>
            <div>
              <h3 className="text-[#f5f0e8] font-medium mb-2">{t('lgm_terms_s7_title')}</h3>
              <p>{t('lgm_terms_s7_text')}</p>
            </div>
            <div>
              <h3 className="text-[#f5f0e8] font-medium mb-2">{t('lgm_terms_s8_title')}</h3>
              <p>{t('lgm_terms_contact_legal')} contact@lumiardi.com</p>
              <p>{t('lgm_terms_contact_privacy')} contact@lumiardi.com</p>
            </div>
            {/* Confirmation text at very end */}
            <div className="pt-4 pb-2 border-t border-white/10">
              <p className="text-[#8E8E93] text-xs">
                {t('lgm_terms_confirm_text')}
              </p>
            </div>
          </div>
        </div>

        {/* Progress + Footer */}
        <div className="px-8 py-6 border-t border-white/10 bg-[#0d0d0d]">
          {/* Scroll progress bar */}
          {!canAccept && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-[#8E8E93] mb-1.5">
                <span>{t('lgm_terms_progress')}</span>
                <span>{scrollProgress}%</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#c8a882] rounded-full transition-all duration-300"
                  style={{ width: `${scrollProgress}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleAccept}
            disabled={!canAccept || isSubmitting}
            aria-disabled={!canAccept || isSubmitting}
            className={`w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold tracking-[2px] uppercase rounded transition-all duration-300 ${
              canAccept && !isSubmitting
                ? 'bg-[#f5f0e8] text-[#0a0a0a] hover:bg-[#e8e0d0] cursor-pointer'
                : 'bg-white/5 text-white/20 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>{t('lgm_terms_processing')}</>
            ) : canAccept ? (
              <><Check size={15} /> {t('lgm_terms_accept')}</>
            ) : (
              <>{t('lgm_terms_scroll_continue')}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
