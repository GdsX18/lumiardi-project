'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SharedDrivePanel } from '@/components/interactive/SharedDrivePanel';
import { useLanguage } from '@/context/LanguageContext';

function DrivePageContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') === 'shared' ? 'shared' : 'private';
  const partnerId = searchParams.get('partnerId') || undefined;

  return (
    <div className="w-full">
      <SharedDrivePanel
        initialDriveMode={mode}
        targetAgencyId={partnerId}
        targetModelId={partnerId}
      />
    </div>
  );
}

export default function DrivePage() {
  const { t } = useLanguage();

  return (
    <DashboardLayout
      pageTitle={t('dash_page_drive_title')}
      pageSubtitle={t('dash_page_drive_sub')}
    >
      <Suspense fallback={<div className="p-8 text-center text-[#F5F2EB]/50">Carregando Lumiardi Drive...</div>}>
        <DrivePageContent />
      </Suspense>
    </DashboardLayout>
  );
}
