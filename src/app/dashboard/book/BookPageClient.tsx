'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { CreatorProfileView } from '@/components/dashboard/CreatorProfileView';
import { AgencyRosterView } from '@/components/dashboard/AgencyRosterView';
import { useAuthPortal } from '@/context/AuthPortalContext';
import { useLanguage } from '@/context/LanguageContext';

export interface BookPageClientProps {
  initialProfile: any;
  initialRole: string;
}

export default function BookPageClient({ initialProfile, initialRole }: BookPageClientProps) {
  const { role } = useAuthPortal();
  const { t } = useLanguage();

  const userRoleStr = String(role || initialRole || '').toLowerCase();
  const isCriadora = userRoleStr === 'criadora' || userRoleStr === 'modelo';

  return (
    <DashboardLayout
      pageTitle={
        isCriadora
          ? t('dash_page_book_title_creator', 'Book Editorial & Portfólio')
          : t('dash_page_book_title_agency', 'Gestão de Book das Agenciadas')
      }
      pageSubtitle={
        isCriadora
          ? t(
              'dash_page_book_sub_creator',
              'Área dedicada para upload de ensaios fotográficos em alta resolução, vídeo showreel e medidas corporais.'
            )
          : t(
              'dash_page_book_sub_agency',
              'Visualização e curadoria de materiais de portfólio, ensaios e casting do elenco.'
            )
      }
    >
      {isCriadora ? (
        <CreatorProfileView initialCreator={initialProfile} />
      ) : (
        <AgencyRosterView />
      )}
    </DashboardLayout>
  );
}
