'use client';

import React from 'react';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthPortalProvider } from '@/context/AuthPortalContext';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <LanguageProvider>
      <AuthPortalProvider>{children}</AuthPortalProvider>
    </LanguageProvider>
  );
};

