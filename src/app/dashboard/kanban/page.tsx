'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { KanbanBoard } from '@/components/interactive/KanbanBoard';

export default function KanbanPage() {
  return (
    <DashboardLayout
      pageTitle="Quadro de Projetos & Campanhas"
      pageSubtitle="Área dedicada para acompanhamento de tarefas em colunas (A Fazer, Em Produção e Concluído)."
    >
      <div className="w-full">
        <KanbanBoard />
      </div>
    </DashboardLayout>
  );
}
