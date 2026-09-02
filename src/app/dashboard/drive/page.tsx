'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { SharedDrivePanel } from '@/components/interactive/SharedDrivePanel';
import { useLanguage } from '@/context/LanguageContext';

export default function DrivePage() {
  const { t } = useLanguage();

  return (
    <DashboardLayout
      pageTitle={t('dash_page_drive_title')}
      pageSubtitle={t('dash_page_drive_sub')}
    >
      <div className="w-full">
        <SharedDrivePanel />
      </div>
    </DashboardLayout>
  );
}
