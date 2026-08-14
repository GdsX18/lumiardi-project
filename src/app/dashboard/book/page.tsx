'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { CreatorProfileView } from '@/components/dashboard/CreatorProfileView';
import { AgencyRosterView } from '@/components/dashboard/AgencyRosterView';
import { useAuthPortal } from '@/context/AuthPortalContext';

export default function BookPage() {
  const { role } = useAuthPortal();
  const isCriadora = role === 'criadora';

  return (
    <DashboardLayout
      pageTitle={isCriadora ? 'Meu Book & Ficha Técnica' : 'Gestão de Modelos Agenciadas'}
      pageSubtitle={
        isCriadora
          ? 'Área dedicada para upload de ensaios fotográficos em alta resolução, vídeo showreel e medidas corporais.'
          : 'Acompanhe as criadoras associadas ao seu elenco, contratos de exclusividade e produções ativas.'
      }
    >
      {isCriadora ? <CreatorProfileView /> : <AgencyRosterView />}
    </DashboardLayout>
  );
}
