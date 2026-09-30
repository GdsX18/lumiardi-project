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
      fullHeight
    >
      <div className="flex-1 min-h-0 w-full flex flex-col">
        <ChatPanel fullHeight />
      </div>
    </DashboardLayout>
  );
}
