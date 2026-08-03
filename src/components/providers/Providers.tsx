'use client';

import React from 'react';
import { LanguageProvider } from '@/context/LanguageContext';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <LanguageProvider>{children}</LanguageProvider>;
};
