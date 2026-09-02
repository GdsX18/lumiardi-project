'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { KanbanBoard } from '@/components/interactive/KanbanBoard';
import { useLanguage } from '@/context/LanguageContext';

export default function KanbanPage() {
  const { t } = useLanguage();

  return (
    <DashboardLayout
      pageTitle={t('dash_page_kanban_title')}
      pageSubtitle={t('dash_page_kanban_sub')}
    >
      <div className="w-full">
        <KanbanBoard />
      </div>
    </DashboardLayout>
  );
}
