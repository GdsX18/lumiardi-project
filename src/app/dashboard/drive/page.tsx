'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SharedDrivePanel } from '@/components/interactive/SharedDrivePanel';

export default function DrivePage() {
  return (
    <DashboardLayout
      pageTitle="Lumiardi Drive — Armazenamento Criptografado"
      pageSubtitle="Repositório seguro para ensaios em formato RAW, vídeos em 4K e contratos assinados digitalmente."
    >
      <div className="w-full">
        <SharedDrivePanel />
      </div>
    </DashboardLayout>
  );
}
