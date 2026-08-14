'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ChatPanel } from '@/components/interactive/ChatPanel';

export default function ChatPage() {
  return (
    <DashboardLayout
      pageTitle="Mensagens & Comunicação Criptografada"
      pageSubtitle="Canal isolado com criptografia ponta a ponta E2E para negociações e alinhamentos de produção."
    >
      <div className="max-w-5xl mx-auto w-full">
        <ChatPanel />
      </div>
    </DashboardLayout>
  );
}
