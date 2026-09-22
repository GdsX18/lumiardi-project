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
      pageTitle={isCriadora ? t('dash_page_agencies_model_title') : t('dash_page_agency_panel_title')}
      pageSubtitle={
        isCriadora
          ? t('dash_page_agencies_model_sub')
          : t('dash_page_agency_panel_sub')
      }
    >
      {isCriadora ? <AgencyDirectoryView /> : <TalentScoutView />}
    </DashboardLayout>
  );
}
