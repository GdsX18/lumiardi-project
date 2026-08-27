'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Kanban,
  ListTodo,
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'all' | 'todo' | 'inProgress' | 'done'>('all');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAgency, setNewTaskAgency] = useState('Lumiardi Onboarding');
  const [newTaskPriority, setNewTaskPriority] = useState<'Alta' | 'Média' | 'Normal'>('Alta');
  const [newTaskDate, setNewTaskDate] = useState('Esta Semana');

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

  // Mover Tarefa entre Colunas
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

    // Atualização otimista
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, column: nextColumn } : t))
    );

    try {
      await fetch('/api/kanban', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, columnStatus: nextColumn }),
      });
    } catch (err) {
      console.error('Erro ao atualizar tarefa:', err);
      fetchTasks();
    }
  };

  // Excluir Tarefa
  const deleteTask = async (taskId: string) => {
    if (confirm('Deseja realmente excluir esta tarefa?')) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      try {
        await fetch(`/api/kanban?id=${encodeURIComponent(taskId)}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.error('Erro ao deletar tarefa:', err);
        fetchTasks();
      }
    }
  };

  // Criar Nova Tarefa
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const title = newTaskTitle.trim();
    const agency = newTaskAgency.trim() || 'Lumiardi Onboarding';
    const prio = newTaskPriority;
    const date = newTaskDate.trim() || 'Em aberto';

    setIsModalOpen(false);
    setNewTaskTitle('');

    try {
      const res = await fetch('/api/kanban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          agencyName: agency,
          priority: prio,
          dueDate: date,
          columnStatus: 'todo',
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

  const todoTasks = tasks.filter((t) => t.column === 'todo');
  const inProgressTasks = tasks.filter((t) => t.column === 'inProgress');
  const doneTasks = tasks.filter((t) => t.column === 'done');

  return (
    <div className="w-full bg-[#0D0D0D] border border-gold/30 p-4 sm:p-6 md:p-8 text-ivory shadow-2xl space-y-6 rounded-sm">
      {/* Header do Kanban */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 sm:pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-[0.25em] text-gold font-semibold font-sans">
              {t('kanban_campaigns') || 'Campanhas & Entregas'}
            </span>
          </div>
          <h3 className="font-serif-lumiardi text-xl sm:text-2xl md:text-3xl font-light text-ivory">
            {t('kanban_title') || 'Quadro Kanban de Projetos'}
          </h3>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            onClick={fetchTasks}
            title="Atualizar quadro"
            className="p-2 sm:p-2.5 bg-[#141414] hover:bg-[#202020] border border-white/10 text-ivory/70 hover:text-gold transition-colors rounded-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-gradient-to-r from-gold to-gold-light text-black-matte font-semibold text-xs font-sans uppercase tracking-wider hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md rounded-xs"
          >
            <Plus className="w-4 h-4" />
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
          {t('kanban_col_todo') || 'A Fazer'} ({todoTasks.length})
        </button>
        <button
          onClick={() => setMobileTab('inProgress')}
          className={`flex-1 py-1.5 px-2 text-[11px] font-sans font-medium rounded-xs transition-colors whitespace-nowrap text-center ${
            mobileTab === 'inProgress' ? 'bg-gold text-black-matte font-bold shadow-sm' : 'text-ivory/60 hover:text-ivory'
          }`}
        >
          {t('kanban_col_in_progress') || 'Produção'} ({inProgressTasks.length})
        </button>
        <button
          onClick={() => setMobileTab('done')}
          className={`flex-1 py-1.5 px-2 text-[11px] font-sans font-medium rounded-xs transition-colors whitespace-nowrap text-center ${
            mobileTab === 'done' ? 'bg-gold text-black-matte font-bold shadow-sm' : 'text-ivory/60 hover:text-ivory'
          }`}
        >
          {t('kanban_col_done') || 'Concluído'} ({doneTasks.length})
        </button>
      </div>

      {/* Grid das 3 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Coluna 1: A Fazer */}
        <div className={`bg-[#121212] p-4 border border-white/5 space-y-4 rounded-xs ${
          mobileTab === 'all' || mobileTab === 'todo' ? 'block' : 'hidden lg:block'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="font-serif-lumiardi font-medium text-base tracking-wider uppercase text-ivory flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold" />
              {t('kanban_col_todo') || 'A Fazer'} ({todoTasks.length})
            </span>
            <span className="text-[10px] font-sans text-ivory/40">Pendentes</span>
          </div>

          <div className="space-y-3">
            {todoTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 bg-[#181818] border border-white/10 hover:border-gold/50 transition-all shadow-md space-y-3 rounded-xs group relative"
              >
                <div className="flex items-center justify-between">
                  <Badge variant={task.priority === 'Alta' ? 'gold' : 'bronze'}>
                    {task.priority} Prioridade
                  </Badge>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1 text-ivory/30 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Excluir Tarefa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveTask(task.id, 'next')}
                      className="p-1.5 bg-gold/10 hover:bg-gold text-gold hover:text-black-matte transition-all text-xs flex items-center gap-1 cursor-pointer font-bold rounded-xs"
                      title="Iniciar Tarefa"
                    >
                      <span className="text-[10px]">Iniciar</span>
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
              <p className="text-xs text-ivory/30 italic py-6 text-center">Nenhuma tarefa pendente no momento.</p>
            )}
          </div>
        </div>

        {/* Coluna 2: Em Andamento */}
        <div className={`bg-[#121212] p-4 border border-gold/30 space-y-4 shadow-[0_0_20px_rgba(201,169,107,0.05)] rounded-xs ${
          mobileTab === 'all' || mobileTab === 'inProgress' ? 'block' : 'hidden lg:block'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-gold/30">
            <span className="font-serif-lumiardi font-medium text-base tracking-wider uppercase text-gold flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold animate-spin" />
              Em Andamento ({inProgressTasks.length})
            </span>
            <span className="text-[10px] font-sans text-gold">Produção Ativa</span>
          </div>

          <div className="space-y-3">
            {inProgressTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 bg-[#181818] border-2 border-gold/40 shadow-lg space-y-3 rounded-xs"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="gold">{task.priority} Prioridade</Badge>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1 text-ivory/30 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Excluir Tarefa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveTask(task.id, 'prev')}
                      className="p-1.5 bg-white/5 hover:bg-white/10 text-ivory/60 hover:text-white transition-colors cursor-pointer rounded-xs"
                      title="Voltar para A Fazer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveTask(task.id, 'next')}
                      className="p-1.5 bg-gold hover:bg-gold-light text-black-matte transition-colors text-xs flex items-center gap-1 cursor-pointer font-bold rounded-xs shadow-sm"
                      title="Concluir Tarefa"
                    >
                      <span className="text-[10px]">Concluir</span>
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
              <p className="text-xs text-ivory/30 italic py-6 text-center">Nenhuma tarefa em andamento.</p>
            )}
          </div>
        </div>

        {/* Coluna 3: Concluído */}
        <div className={`bg-[#121212] p-4 border border-emerald-500/20 space-y-4 rounded-xs ${
          mobileTab === 'all' || mobileTab === 'done' ? 'block' : 'hidden lg:block'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="font-serif-lumiardi font-medium text-base tracking-wider uppercase text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Concluído ({doneTasks.length})
            </span>
            <span className="text-[10px] font-sans text-emerald-400">Finalizado</span>
          </div>

          <div className="space-y-3">
            {doneTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 bg-[#161616]/70 border border-emerald-500/20 space-y-3 opacity-90 rounded-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[9px] font-sans uppercase tracking-widest font-semibold rounded-xs">
                    Entregue
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1 text-ivory/30 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Excluir Tarefa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveTask(task.id, 'prev')}
                      className="p-1.5 bg-white/5 hover:bg-white/10 text-ivory/60 hover:text-white transition-colors cursor-pointer rounded-xs"
                      title="Reabrir Tarefa"
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
              <p className="text-xs text-ivory/30 italic py-6 text-center">Nenhuma tarefa concluída ainda.</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Nova Tarefa */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0F0F0F] border border-gold/40 p-6 md:p-8 max-w-md w-full text-ivory shadow-2xl space-y-5 relative rounded-sm max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-ivory/50 hover:text-gold cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-gold font-sans font-semibold">
                  Gerenciamento de Entregas
                </span>
                <h3 className="font-serif-lumiardi text-2xl font-light text-ivory mt-1">
                  Nova Tarefa / Entrega
                </h3>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-sans text-ivory/70 uppercase tracking-wider mb-1.5 font-medium">
                    Título da Tarefa
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
                      Prioridade
                    </label>
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as any)}
                      className="w-full bg-[#181818] border border-white/10 p-2.5 text-xs text-ivory focus:outline-none focus:border-gold font-sans cursor-pointer rounded-xs"
                    >
                      <option value="Alta">Alta</option>
                      <option value="Média">Média</option>
                      <option value="Normal">Normal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-sans text-ivory/70 uppercase tracking-wider mb-1.5 font-medium">
                      Prazo Limite
                    </label>
                    <input
                      type="text"
                      value={newTaskDate}
                      onChange={(e) => setNewTaskDate(e.target.value)}
                      className="w-full bg-[#181818] border border-white/10 p-2.5 text-xs text-ivory focus:outline-none focus:border-gold font-sans rounded-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-sans uppercase text-ivory/60 hover:text-ivory cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gold hover:bg-gold-light text-black-matte font-semibold text-xs font-sans uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer shadow-md rounded-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Criar Tarefa</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
