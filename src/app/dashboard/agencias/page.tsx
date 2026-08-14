'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AgencyDirectoryView } from '@/components/dashboard/AgencyDirectoryView';
import { TalentScoutView } from '@/components/dashboard/TalentScoutView';
import { useAuthPortal } from '@/context/AuthPortalContext';

export default function AgenciasPage() {
  const { role } = useAuthPortal();
  const isCriadora = role === 'criadora';

  return (
    <DashboardLayout
      pageTitle={isCriadora ? 'Rede de Agências Parceiras' : 'Talent Scout de Modelos'}
      pageSubtitle={
        isCriadora
          ? 'Catálogo de agências internacionais parceiras da Lumiardi para envio de candidaturas e propostas diretas.'
          : 'Filtre e descubra novos talentos verificados por categoria, medidas, localização e idiomas.'
      }
    >
      {isCriadora ? <AgencyDirectoryView /> : <TalentScoutView />}
    </DashboardLayout>
  );
}
