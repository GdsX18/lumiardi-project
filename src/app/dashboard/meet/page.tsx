'use client';

import React, { Suspense } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { VideoCallWidget } from '@/components/interactive/VideoCallWidget';

export default function MeetPage() {
  return (
    <DashboardLayout
      pageTitle="Lumiardi Meet — Sala de Reunião VIP"
      pageSubtitle="Ambiente seguro para pré-entrevistas, reuniões de casting e alinhamentos de contrato por vídeo."
    >
      <div className="max-w-5xl mx-auto w-full">
        <Suspense fallback={<div className="p-12 text-center text-gold font-mono">Carregando Sala VIP Lumiardi Meet...</div>}>
          <VideoCallWidget />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
