'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { CreatorProfileView } from '@/components/dashboard/CreatorProfileView';
import { AgencyRosterView } from '@/components/dashboard/AgencyRosterView';
import { useAuthPortal } from '@/context/AuthPortalContext';
import { useLanguage } from '@/context/LanguageContext';

export default function BookPage() {
  const { role } = useAuthPortal();
  const { t } = useLanguage();
  const isCriadora = role === 'criadora';

  return (
    <DashboardLayout
      pageTitle={isCriadora ? t('dash_page_book_title_creator') : t('dash_page_book_title_agency')}
      pageSubtitle={
        isCriadora
          ? t('dash_page_book_sub_creator')
          : t('dash_page_book_sub_agency')
      }
    >
      {isCriadora ? <CreatorProfileView /> : <AgencyRosterView />}
    </DashboardLayout>
  );
}
