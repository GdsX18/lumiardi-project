'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  X,
  Trash2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useLanguage } from '@/context/LanguageContext';

export interface TaskItem {
  id: string;
  title: string;
  agency?: string;
  date?: string;
  priority: 'Alta' | 'Média' | 'Normal' | string;
  column: 'todo' | 'inProgress' | 'done' | string;
  createdAt?: string;
}

export const KanbanBoard: React.FC = () => {
  const { t } = useLanguage();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);

  // Filtro Mobile
  const [mobileTab, setMobileTab] = useState<'all' | 'todo' | 'inProgress' | 'done'>('all');

  // Formulário Nova Tarefa
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAgency, setNewTaskAgency] = useState('Lumiardi Onboarding');
  const [newTaskPriority, setNewTaskPriority] = useState<'Alta' | 'Média' | 'Normal'>('Alta');
  const [newTaskColumn, setNewTaskColumn] = useState<'todo' | 'inProgress'>('todo');
  const [newTaskDate, setNewTaskDate] = useState('Esta Semana');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Carregar tarefas da API
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/kanban');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.tasks)) {
          setTasks(data.tasks);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar kanban:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Mover Tarefa entre Colunas (com Atualização Otimista & Rollback)
  const moveTask = async (taskId: string, direction: 'next' | 'prev') => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    let nextColumn = task.column;
    if (direction === 'next') {
      if (task.column === 'todo') nextColumn = 'inProgress';
      else if (task.column === 'inProgress') nextColumn = 'done';
    } else {
      if (task.column === 'done') nextColumn = 'inProgress';
      else if (task.column === 'inProgress') nextColumn = 'todo';
    }

    if (nextColumn === task.column) return;

    const previousTasks = [...tasks];

    // Atualização otimista imediata na interface
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, column: nextColumn } : t))
    );

    try {
      const res = await fetch('/api/kanban', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, columnStatus: nextColumn }),
      });
      if (!res.ok) {
        throw new Error('Falha ao persistir status da tarefa');
      }
    } catch (err) {
      console.error('Erro ao atualizar tarefa:', err);
      // Rollback se falhar
      setTasks(previousTasks);
    }
  };

  // Confirmar Exclusão com Atualização Otimista
  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    const targetId = taskToDelete.id;
    const previousTasks = [...tasks];

    // Fecha o modal e remove otimisticamente
    setTaskToDelete(null);
    setTasks((prev) => prev.filter((t) => t.id !== targetId));

    try {
      const res = await fetch(`/api/kanban?id=${encodeURIComponent(targetId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Falha ao remover tarefa no banco');
      }
    } catch (err) {
      console.error('Erro ao deletar tarefa:', err);
      // Rollback se falhar
      setTasks(previousTasks);
    }
  };

  // Criar Nova Tarefa
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const title = newTaskTitle.trim();
    const agency = newTaskAgency.trim() || 'Lumiardi Onboarding';
    const prio = newTaskPriority;
    const col = newTaskColumn;
    const date = newTaskDate.trim() || 'Em aberto';

    setIsModalOpen(false);
    setNewTaskTitle('');
    setNewTaskColumn('todo');

    try {
      const res = await fetch('/api/kanban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          agencyName: agency,
          priority: prio,
          dueDate: date,
          columnStatus: col,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.task) {
          setTasks((prev) => [data.task, ...prev]);
        } else {
          fetchTasks();
        }
      }
    } catch (err) {
      console.error('Erro ao criar tarefa:', err);
      fetchTasks();
    }
  };

  // Helper de tradução de prioridades
  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'Alta':
      case 'High':
        return t('kanban_priority_high') || 'Alta';
      case 'Média':
      case 'Media':
      case 'Medium':
        return t('kanban_priority_medium') || 'Média';
      case 'Normal':
      case 'Baixa':
      case 'Low':
      default:
        return t('kanban_priority_normal') || 'Normal';
    }
  };

  const todoTasks = tasks.filter((t) => t.column === 'todo');
  const inProgressTasks = tasks.filter((t) => t.column === 'inProgress');
  const doneTasks = tasks.filter((t) => t.column === 'done');

  return (
    <div className="w-full bg-[#0D0D0D] border border-[#C9A96B]/25 p-4 sm:p-6 md:p-8 text-ivory shadow-2xl space-y-6 rounded-sm">
      {/* Top Toolbar Unificado — Sem duplicação de título com o layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 sm:pb-5 border-b border-white/[0.08]">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-gold font-semibold font-sans">
            {t('kanban_campaigns') || 'Campanhas & Entregas'}
          </span>
          <p className="text-xs text-ivory/50 font-sans mt-0.5">
            {tasks.length} {tasks.length === 1 ? 'entrega gerenciada' : 'entregas gerenciadas'}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            onClick={fetchTasks}
            title={t('kanban_campaigns') || 'Atualizar quadro'}
            className="p-2.5 bg-[#141414] hover:bg-[#1E1E1E] border border-white/10 text-ivory/70 hover:text-gold transition-colors rounded-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-gold' : ''}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-gradient-to-r from-gold to-gold-light text-black-matte font-semibold text-xs font-sans uppercase tracking-wider hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md rounded-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('kanban_new_task') || 'Nova Tarefa'}</span>
          </button>
        </div>
      </div>

      {/* Seletor de Abas Mobile (Filtro por Coluna no celular) */}
      <div className="lg:hidden flex items-center gap-1.5 p-1 bg-[#141414] border border-white/[0.08] rounded-xs overflow-x-auto">
        <button
          onClick={() => setMobileTab('all')}
          className={`flex-1 py-1.5 px-2 text-[11px] font-sans font-medium rounded-xs transition-colors whitespace-nowrap text-center ${
            mobileTab === 'all' ? 'bg-gold text-black-matte font-bold shadow-sm' : 'text-ivory/60 hover:text-ivory'
          }`}
        >
          {t('kanban_all_tasks') || 'Todas'} ({tasks.length})
        </button>
        <button
          onClick={() => setMobileTab('todo')}
          className={`flex-1 py-1.5 px-2 text-[11px] font-sans font-medium rounded-xs transition-colors whitespace-nowrap text-center ${
            mobileTab === 'todo' ? 'bg-gold text-black-matte font-bold shadow-sm' : 'text-ivory/60 hover:text-ivory'
          }`}
        >
          {t('dash_kanban_col_todo') || t('kanban_col_todo') || 'A Fazer'} ({todoTasks.length})
        </button>
        <button
          onClick={() => setMobileTab('inProgress')}
          className={`flex-1 py-1.5 px-2 text-[11px] font-sans font-medium rounded-xs transition-colors whitespace-nowrap text-center ${
            mobileTab === 'inProgress' ? 'bg-gold text-black-matte font-bold shadow-sm' : 'text-ivory/60 hover:text-ivory'
          }`}
        >
          {t('dash_kanban_col_in_progress') || t('kanban_col_in_progress') || 'Em Andamento'} ({inProgressTasks.length})
        </button>
        <button
          onClick={() => setMobileTab('done')}
          className={`flex-1 py-1.5 px-2 text-[11px] font-sans font-medium rounded-xs transition-colors whitespace-nowrap text-center ${
            mobileTab === 'done' ? 'bg-gold text-black-matte font-bold shadow-sm' : 'text-ivory/60 hover:text-ivory'
          }`}
        >
          {t('dash_kanban_col_done') || t('kanban_col_done') || 'Concluído'} ({doneTasks.length})
        </button>
      </div>

      {/* Grid das 3 Colunas Estruturadas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Coluna 1: A Fazer */}
        <div
          className={`bg-[#121212] p-4 border border-white/5 space-y-4 rounded-xs ${
            mobileTab === 'all' || mobileTab === 'todo' ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="font-serif-lumiardi font-medium text-base tracking-wider uppercase text-ivory flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold" />
              {t('dash_kanban_col_todo') || t('kanban_col_todo') || 'A Fazer'} ({todoTasks.length})
            </span>
            <span className="text-[10px] font-sans text-ivory/40 uppercase tracking-wider">
              {t('kanban_col_pending_label') || 'Pendentes'}
            </span>
          </div>

          <div className="space-y-3">
            {todoTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 bg-[#181818] border border-white/10 hover:border-gold/50 transition-all shadow-md space-y-3 rounded-xs group relative"
              >
                <div className="flex items-center justify-between">
                  <Badge variant={task.priority === 'Alta' || task.priority === 'High' ? 'gold' : 'bronze'}>
                    {getPriorityLabel(task.priority)}
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setTaskToDelete(task)}
                      className="p-1 text-ivory/30 hover:text-rose-400 transition-colors cursor-pointer"
                      title={t('kanban_confirm_delete_title') || 'Excluir Tarefa'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveTask(task.id, 'next')}
                      className="p-1.5 bg-gold/10 hover:bg-gold text-gold hover:text-black-matte transition-all text-xs flex items-center gap-1 cursor-pointer font-bold rounded-xs"
                      title={t('kanban_start_task') || 'Iniciar Tarefa'}
                    >
                      <span className="text-[10px]">{t('kanban_start_task') || 'Iniciar'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="font-serif-lumiardi text-base font-medium text-ivory leading-snug">
                  {task.title}
                </h4>

                <div className="flex items-center justify-between text-[11px] text-ivory/50 font-sans pt-2 border-t border-white/5">
                  <span className="text-gold">{task.agency}</span>
                  <span className="flex items-center gap-1 text-ivory/60">
                    <Calendar className="w-3 h-3" />
                    {task.date}
                  </span>
                </div>
              </div>
            ))}
            {todoTasks.length === 0 && (
              <div className="py-8 px-4 text-center border border-dashed border-white/5 rounded-xs space-y-1">
                <p className="text-xs text-ivory/40 font-sans font-light">
                  {t('kanban_empty_todo') || 'Nenhuma tarefa pendente no momento.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Coluna 2: Em Andamento */}
        <div
          className={`bg-[#121212] p-4 border border-[#C9A96B]/30 space-y-4 shadow-[0_0_20px_rgba(201,169,107,0.04)] rounded-xs ${
            mobileTab === 'all' || mobileTab === 'inProgress' ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#C9A96B]/30">
            <span className="font-serif-lumiardi font-medium text-base tracking-wider uppercase text-gold flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold animate-spin" />
              {t('dash_kanban_col_in_progress') || t('kanban_col_in_progress') || 'Em Andamento'} ({inProgressTasks.length})
            </span>
            <span className="text-[10px] font-sans text-gold uppercase tracking-wider">
              {t('kanban_col_active_prod') || 'Produção Ativa'}
            </span>
          </div>

          <div className="space-y-3">
            {inProgressTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 bg-[#181818] border-2 border-gold/40 shadow-lg space-y-3 rounded-xs"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="gold">{getPriorityLabel(task.priority)}</Badge>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setTaskToDelete(task)}
                      className="p-1 text-ivory/30 hover:text-rose-400 transition-colors cursor-pointer"
                      title={t('kanban_confirm_delete_title') || 'Excluir Tarefa'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveTask(task.id, 'prev')}
                      className="p-1.5 bg-white/5 hover:bg-white/10 text-ivory/60 hover:text-white transition-colors cursor-pointer rounded-xs"
                      title={t('dash_kanban_col_todo') || 'Voltar para A Fazer'}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveTask(task.id, 'next')}
                      className="p-1.5 bg-gold hover:bg-gold-light text-black-matte transition-colors text-xs flex items-center gap-1 cursor-pointer font-bold rounded-xs shadow-sm"
                      title={t('kanban_complete_task') || 'Concluir Tarefa'}
                    >
                      <span className="text-[10px]">{t('kanban_complete_task') || 'Concluir'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="font-serif-lumiardi text-base font-medium text-ivory leading-snug">
                  {task.title}
                </h4>

                <div className="flex items-center justify-between text-[11px] text-ivory/50 font-sans pt-2 border-t border-white/5">
                  <span className="text-gold">{task.agency}</span>
                  <span className="flex items-center gap-1 text-gold font-medium">
                    <Calendar className="w-3 h-3" />
                    {task.date}
                  </span>
                </div>
              </div>
            ))}
            {inProgressTasks.length === 0 && (
              <div className="py-8 px-4 text-center border border-dashed border-white/5 rounded-xs space-y-1">
                <p className="text-xs text-ivory/40 font-sans font-light">
                  {t('kanban_empty_inprogress') || 'Nenhuma tarefa em produção.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Coluna 3: Concluído */}
        <div
          className={`bg-[#121212] p-4 border border-emerald-500/20 space-y-4 rounded-xs ${
            mobileTab === 'all' || mobileTab === 'done' ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="font-serif-lumiardi font-medium text-base tracking-wider uppercase text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {t('dash_kanban_col_done') || t('kanban_col_done') || 'Concluído'} ({doneTasks.length})
            </span>
            <span className="text-[10px] font-sans text-emerald-400 uppercase tracking-wider">
              {t('kanban_col_done_label') || 'Finalizado'}
            </span>
          </div>

          <div className="space-y-3">
            {doneTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 bg-[#161616]/70 border border-emerald-500/20 space-y-3 opacity-90 rounded-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[9px] font-sans uppercase tracking-widest font-semibold rounded-xs">
                    {t('kanban_task_delivered') || 'Entregue'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setTaskToDelete(task)}
                      className="p-1 text-ivory/30 hover:text-rose-400 transition-colors cursor-pointer"
                      title={t('kanban_confirm_delete_title') || 'Excluir Tarefa'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveTask(task.id, 'prev')}
                      className="p-1.5 bg-white/5 hover:bg-white/10 text-ivory/60 hover:text-white transition-colors cursor-pointer rounded-xs"
                      title={t('kanban_reopen_task') || 'Reabrir Tarefa'}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="font-serif-lumiardi text-base font-medium text-ivory/80 line-through decoration-gold">
                  {task.title}
                </h4>

                <div className="flex items-center justify-between text-[11px] text-ivory/40 font-sans pt-2 border-t border-white/5">
                  <span>{task.agency}</span>
                  <span>{task.date}</span>
                </div>
              </div>
            ))}
            {doneTasks.length === 0 && (
              <div className="py-8 px-4 text-center border border-dashed border-white/5 rounded-xs space-y-1">
                <p className="text-xs text-ivory/40 font-sans font-light">
                  {t('kanban_empty_done') || 'Nenhuma entrega concluída.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Customizado de Confirmação de Exclusão — Montado via React Portal (Elimina window.confirm) */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {taskToDelete && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.95, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 15 }}
                  className="bg-[#0D0D0D] border border-[#C9A96B]/30 p-6 md:p-8 max-w-md w-full text-ivory shadow-2xl space-y-5 relative rounded-sm"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-rose-950/50 border border-rose-800/40 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.25em] text-gold font-sans font-semibold">
                        Lumiardi Standard
                      </span>
                      <h3 className="font-serif-lumiardi text-xl md:text-2xl font-light text-ivory mt-0.5">
                        {t('kanban_confirm_delete_title') || 'Excluir Tarefa'}
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs font-sans text-ivory/70 leading-relaxed">
                    <p>
                      {t('kanban_confirm_delete_body') ||
                        'Esta ação removerá permanentemente a tarefa do quadro. Não poderá ser desfeita.'}
                    </p>
                    <div className="p-3 bg-[#161616] border border-white/5 rounded-xs text-ivory/90 font-medium truncate">
                      &ldquo;{taskToDelete.title}&rdquo;
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setTaskToDelete(null)}
                      className="px-4 py-2.5 text-xs font-sans uppercase tracking-wider text-ivory/60 hover:text-ivory border border-white/10 hover:border-white/20 transition-colors rounded-xs cursor-pointer"
                    >
                      {t('kanban_cancel') || 'Cancelar'}
                    </button>
                    <button
                      type="button"
                      onClick={confirmDeleteTask}
                      className="px-5 py-2.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/40 text-rose-200 font-semibold text-xs font-sans uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer rounded-xs shadow-md"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('kanban_confirm_delete_btn') || 'Confirmar Exclusão'}</span>
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* Modal de Nova Tarefa — Montado via React Portal */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isModalOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.95, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 15 }}
                  className="bg-[#0F0F0F] border border-[#C9A96B]/35 p-6 md:p-8 max-w-md w-full text-ivory shadow-2xl space-y-5 relative rounded-sm max-h-[90vh] overflow-y-auto"
                >
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="absolute top-4 right-4 text-ivory/50 hover:text-gold cursor-pointer"
                    title={t('kanban_cancel') || 'Fechar'}
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-gold font-sans font-semibold">
                      {t('kanban_modal_tag') || 'Gerenciamento de Entregas'}
                    </span>
                    <h3 className="font-serif-lumiardi text-2xl font-light text-ivory mt-1">
                      {t('kanban_modal_title') || 'Nova Tarefa / Entrega'}
                    </h3>
                  </div>

                  <form onSubmit={handleCreateTask} className="space-y-4">
                    <div>
                      <label className="block text-xs font-sans text-ivory/70 uppercase tracking-wider mb-1.5 font-medium">
                        {t('kanban_task_title_label') || 'Título da Tarefa / Entrega'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Ensaio de Fotos para Campanha de Verão"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="w-full bg-[#181818] border border-white/10 p-3 text-xs text-ivory focus:outline-none focus:border-gold font-sans rounded-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-sans text-ivory/70 uppercase tracking-wider mb-1.5 font-medium">
                          {t('kanban_priority_label') || 'Prioridade'}
                        </label>
                        <select
                          value={newTaskPriority}
                          onChange={(e) => setNewTaskPriority(e.target.value as any)}
                          className="w-full bg-[#181818] border border-white/10 p-2.5 text-xs text-ivory focus:outline-none focus:border-gold font-sans cursor-pointer rounded-xs"
                        >
                          <option value="Alta">{t('kanban_priority_high') || 'Alta'}</option>
                          <option value="Média">{t('kanban_priority_medium') || 'Média'}</option>
                          <option value="Normal">{t('kanban_priority_normal') || 'Normal'}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-sans text-ivory/70 uppercase tracking-wider mb-1.5 font-medium">
                          {t('kanban_col_initial') || 'Coluna Inicial'}
                        </label>
                        <select
                          value={newTaskColumn}
                          onChange={(e) => setNewTaskColumn(e.target.value as any)}
                          className="w-full bg-[#181818] border border-white/10 p-2.5 text-xs text-ivory focus:outline-none focus:border-gold font-sans cursor-pointer rounded-xs"
                        >
                          <option value="todo">
                            {t('dash_kanban_col_todo') || t('kanban_col_todo') || 'A Fazer'}
                          </option>
                          <option value="inProgress">
                            {t('dash_kanban_col_in_progress') || t('kanban_col_in_progress') || 'Em Andamento'}
                          </option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-sans text-ivory/70 uppercase tracking-wider mb-1.5 font-medium">
                        {t('kanban_due_date_label') || 'Prazo Limite'}
                      </label>
                      <input
                        type="text"
                        value={newTaskDate}
                        onChange={(e) => setNewTaskDate(e.target.value)}
                        className="w-full bg-[#181818] border border-white/10 p-2.5 text-xs text-ivory focus:outline-none focus:border-gold font-sans rounded-xs"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 text-xs font-sans uppercase text-ivory/60 hover:text-ivory cursor-pointer"
                      >
                        {t('kanban_cancel') || 'Cancelar'}
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-gold hover:bg-gold-light text-black-matte font-semibold text-xs font-sans uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer shadow-md rounded-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t('kanban_create_task') || 'Criar Tarefa'}</span>
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};
