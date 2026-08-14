'use client';

import React, { useState } from 'react';
import { DashboardHeader } from './DashboardHeader';
import { DashboardSidebar } from './DashboardSidebar';
import { AnimatePresence, motion } from 'framer-motion';

export interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  pageTitle?: string;
  pageSubtitle?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  pageTitle,
  pageSubtitle,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#070707] text-ivory font-sans flex flex-col selection:bg-gold selection:text-black-matte">
      {/* Header Corporativo Fixo */}
      <DashboardHeader
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        mobileMenuOpen={mobileMenuOpen}
      />

      <div className="flex-1 flex w-full max-w-[1920px] mx-auto">
        {/* Sidebar Desktop */}
        <div className="hidden lg:block shrink-0">
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
        <main className="flex-1 p-4 md:p-8 lg:p-10 overflow-y-auto max-w-full">
          {pageTitle && (
            <div className="mb-6 pb-4 border-b border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h1 className="font-serif-lumiardi text-2xl md:text-4xl font-light text-ivory tracking-wide">
                  {pageTitle}
                </h1>
                {pageSubtitle && (
                  <p className="text-xs md:text-sm text-ivory/60 font-sans mt-1">
                    {pageSubtitle}
                  </p>
                )}
              </div>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
};
