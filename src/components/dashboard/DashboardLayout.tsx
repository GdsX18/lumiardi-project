'use client';

import React, { useState } from 'react';
import { DashboardHeader } from './DashboardHeader';
import { DashboardSidebar } from './DashboardSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { AnimatePresence, motion } from 'framer-motion';
import { ContentProtectionProvider } from '@/components/providers/ContentProtectionProvider';

export interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  pageTitle?: string;
  pageSubtitle?: string;
  /**
   * Shell de altura fixa (100dvh): o scroll acontece dentro do conteúdo, não na página.
   * Usado pelo chat, que precisa de lista rolável + rodapé de envio fixo.
   */
  fullHeight?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  pageTitle,
  pageSubtitle,
  fullHeight = false,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <ContentProtectionProvider>
      <div
        className={`bg-[#070707] text-ivory font-sans flex flex-col selection:bg-gold selection:text-black-matte overflow-x-hidden ${
          fullHeight ? 'h-dvh overflow-hidden' : 'min-h-screen lg:h-dvh lg:overflow-hidden'
        }`}
      >
        {/* Header Corporativo Fixo */}
        <DashboardHeader
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          mobileMenuOpen={mobileMenuOpen}
        />

        {/* Desktop: shell de altura fixa — sidebar ocupa a coluna inteira e só o <main> rola */}
        <div className={`flex-1 flex w-full max-w-[1920px] mx-auto min-w-0 lg:min-h-0 ${fullHeight ? 'min-h-0' : ''}`}>
          {/* Sidebar Desktop */}
          <div className="hidden lg:flex shrink-0">
            <DashboardSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>

          {/* Sidebar Mobile Drawer */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setMobileMenuOpen(false)}
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
                />
                <motion.div
                  initial={{ x: -280 }}
                  animate={{ x: 0 }}
                  exit={{ x: -280 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#090909] border-r border-gold/30 shadow-2xl pt-14 lg:hidden overflow-y-auto"
                >
                  <DashboardSidebar
                    className="w-full md:w-full"
                    activeTab={activeTab}
                    setActiveTab={(tab) => {
                      if (setActiveTab) setActiveTab(tab);
                      setMobileMenuOpen(false);
                    }}
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Área Principal de Conteúdo */}
          <main
            className={`flex-1 p-3 sm:p-5 md:p-8 lg:p-10 pb-24 lg:pb-10 max-w-full min-w-0 ${
              fullHeight ? 'min-h-0 flex flex-col overflow-hidden' : 'overflow-y-auto'
            }`}
          >
            {pageTitle && (
              <div className="shrink-0 mb-5 sm:mb-6 pb-3 sm:pb-4 border-b border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-3">
                <div>
                  <h1 className="font-serif-lumiardi text-xl sm:text-2xl md:text-4xl font-light text-ivory tracking-wide">
                    {pageTitle}
                  </h1>
                  {pageSubtitle && (
                    <p className="text-[11px] sm:text-xs md:text-sm text-ivory/60 font-sans mt-0.5 sm:mt-1">
                      {pageSubtitle}
                    </p>
                  )}
                </div>
              </div>
            )}

            {children}
          </main>
        </div>

        {/* Navegação Inferior Mobile */}
        <MobileBottomNav />
      </div>
    </ContentProtectionProvider>
  );
};

