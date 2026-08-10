'use client';

import React from 'react';
import { Plus, MoreHorizontal, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useLanguage } from '@/context/LanguageContext';

export interface KanbanTask {
  id: string;
  title: string;
  agency: string;
  date: string;
  priority: string;
}

export const KanbanBoard: React.FC = () => {
  const { t } = useLanguage();

  const tasks = {
    todo: [
      {
        id: '1',
        title: t('kanban_task1_title'),
        agency: 'Aura Management',
        date: '30 Jul',
        priority: t('kanban_priority_high'),
        isHigh: true,
      },
      {
        id: '2',
        title: t('kanban_task2_title'),
        agency: 'Vanguard Talent Co.',
        date: '02 Aug',
        priority: t('kanban_priority_medium'),
        isHigh: false,
      },
    ],
    inProgress: [
      {
        id: '3',
        title: t('kanban_task3_title'),
        agency: 'Aura Management',
        date: '28 Jul',
        priority: t('kanban_priority_high'),
        isHigh: true,
      },
    ],
    done: [
      {
        id: '4',
        title: t('kanban_task4_title'),
        agency: 'Lumiardi Curation Team',
        date: '25 Jul',
        priority: t('kanban_priority_normal'),
        isHigh: false,
      },
    ],
  };

  return (
    <div className="w-full bg-white border border-black-matte/15 p-4 md:p-6 text-black-matte shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-black-matte/10">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-bronze font-semibold font-sans">
            {t('kanban_module_tag')}
          </span>
          <h3 className="font-serif-lumiardi text-2xl font-semibold text-black-matte">
            {t('kanban_title')}
          </h3>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-black-matte text-ivory text-xs font-sans hover:bg-gold hover:text-black-matte transition-colors cursor-pointer">
          <Plus className="w-4 h-4" />
          <span>{t('kanban_new_task')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna: A Fazer */}
        <div className="bg-[#F7F3EC] p-4 border border-black-matte/10 flex flex-col gap-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-serif-lumiardi font-semibold text-sm tracking-wider uppercase text-black-matte">
              {t('kanban_col_todo')} ({tasks.todo.length})
            </span>
            <Clock className="w-4 h-4 text-bronze" />
          </div>
          {tasks.todo.map((task) => (
            <div
              key={task.id}
              className="p-4 bg-white border border-black-matte/10 hover:border-gold transition-colors shadow-2xs space-y-2 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <Badge variant={task.priority === t('kanban_priority_high') ? 'gold' : 'bronze'}>
                  {task.priority}
                </Badge>
                <MoreHorizontal className="w-4 h-4 text-black-matte/40" />
              </div>
              <h4 className="font-serif-lumiardi text-base font-medium text-black-matte">
                {task.title}
              </h4>
              <div className="flex items-center justify-between text-[11px] text-black-matte/60 font-sans pt-2 border-t border-black-matte/5">
                <span>{task.agency}</span>
                <span className="flex items-center gap-1 text-bronze font-medium">
                  <Calendar className="w-3 h-3" />
                  {task.date}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Coluna: Em Andamento */}
        <div className="bg-[#F7F3EC] p-4 border border-black-matte/10 flex flex-col gap-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-serif-lumiardi font-semibold text-sm tracking-wider uppercase text-gold">
              {t('kanban_col_in_progress')} ({tasks.inProgress.length})
            </span>
            <Clock className="w-4 h-4 text-gold" />
          </div>
          {tasks.inProgress.map((task) => (
            <div
              key={task.id}
              className="p-4 bg-white border-2 border-gold/40 shadow-sm space-y-2 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <Badge variant="gold">{task.priority}</Badge>
                <MoreHorizontal className="w-4 h-4 text-black-matte/40" />
              </div>
              <h4 className="font-serif-lumiardi text-base font-medium text-black-matte">
                {task.title}
              </h4>
              <div className="flex items-center justify-between text-[11px] text-black-matte/60 font-sans pt-2 border-t border-black-matte/5">
                <span>{task.agency}</span>
                <span className="flex items-center gap-1 text-gold font-semibold">
                  <Calendar className="w-3 h-3" />
                  {task.date}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Coluna: Concluído */}
        <div className="bg-[#F7F3EC] p-4 border border-black-matte/10 flex flex-col gap-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-serif-lumiardi font-semibold text-sm tracking-wider uppercase text-emerald-800">
              {t('kanban_col_done')} ({tasks.done.length})
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-800" />
          </div>
          {tasks.done.map((task) => (
            <div
              key={task.id}
              className="p-4 bg-white/70 border border-black-matte/10 space-y-2 opacity-80"
            >
              <div className="flex items-center justify-between">
                <Badge variant="outline">{t('kanban_col_done')}</Badge>
              </div>
              <h4 className="font-serif-lumiardi text-base font-medium text-black-matte line-through decoration-bronze">
                {task.title}
              </h4>
              <div className="flex items-center justify-between text-[11px] text-black-matte/50 font-sans pt-2 border-t border-black-matte/5">
                <span>{task.agency}</span>
                <span>{task.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
