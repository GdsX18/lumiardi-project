'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ChatPanel } from '@/components/interactive/ChatPanel';

export default function ChatPage() {
  return (
    <DashboardLayout
      pageTitle="Mensagens & Comunicação Criptografada"
      pageSubtitle="Canal exclusivo com criptografia ponta a ponta E2E para negociações, alinhamentos e suporte VIP."
    >
      <div className="w-full h-full">
        <ChatPanel />
      </div>
    </DashboardLayout>
  );
}
