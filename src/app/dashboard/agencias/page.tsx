'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AgencyDirectoryView } from '@/components/dashboard/AgencyDirectoryView';
import { TalentScoutView } from '@/components/dashboard/TalentScoutView';
import { useAuthPortal } from '@/context/AuthPortalContext';
import { useLanguage } from '@/context/LanguageContext';

export default function AgenciasPage() {
  const { role } = useAuthPortal();
  const { t } = useLanguage();
  const isCriadora = role === 'criadora';

  return (
    <DashboardLayout
      pageTitle={isCriadora ? t('dash_page_agencies_title_creator') : t('dash_page_agencies_title_agency')}
      pageSubtitle={
        isCriadora
          ? t('dash_page_agencies_sub_creator')
          : t('dash_page_agencies_sub_agency')
      }
    >
      {isCriadora ? <AgencyDirectoryView /> : <TalentScoutView />}
    </DashboardLayout>
  );
}
