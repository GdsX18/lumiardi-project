'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ChatPanel } from '@/components/interactive/ChatPanel';
import { useLanguage } from '@/context/LanguageContext';

export default function ChatPage() {
  const { t } = useLanguage();

  return (
    <DashboardLayout
      pageTitle={t('dash_page_chat_title')}
      pageSubtitle={t('dash_page_chat_sub')}
    >
      <div className="w-full h-full">
        <ChatPanel />
      </div>
    </DashboardLayout>
  );
}
