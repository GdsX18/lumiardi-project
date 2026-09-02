'use client';

import React, { Suspense } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { VideoCallWidget } from '@/components/interactive/VideoCallWidget';
import { useLanguage } from '@/context/LanguageContext';

export default function MeetPage() {
  const { t } = useLanguage();

  return (
    <DashboardLayout
      pageTitle={t('dash_page_meet_title')}
      pageSubtitle={t('dash_page_meet_sub')}
    >
      <div className="w-full h-full">
        <Suspense fallback={<div className="p-12 text-center text-gold font-mono">Conectando à Sala Executiva Lumiardi Meet...</div>}>
          <VideoCallWidget />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
