'use client';

import React, { Suspense } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { VideoCallWidget } from '@/components/interactive/VideoCallWidget';

export default function MeetPage() {
  return (
    <DashboardLayout
      pageTitle="Lumiardi Meet — Sala Executiva de Vídeo"
      pageSubtitle="Ambiente criptografado para reuniões de casting, alinhamentos de contrato e pré-entrevistas em alta definição."
    >
      <div className="w-full h-full">
        <Suspense fallback={<div className="p-12 text-center text-gold font-mono">Conectando à Sala Executiva Lumiardi Meet...</div>}>
          <VideoCallWidget />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
