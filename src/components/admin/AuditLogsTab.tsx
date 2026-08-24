'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  MessageSquare,
  UserPlus,
  Shield,
  Clock,
  Calendar,
  Eye,
  RefreshCw,
  X,
  FileText,
  Lock,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { CurationAuditLog, AuditActionType, CurationRole } from '@/types';

interface AuditLogsTabProps {
  currentCuratorRole?: CurationRole;
}

const ACTION_LABELS: Record<
  string,
  { label: string; badgeClass: string; icon: React.ReactNode }
> = {
  CURATION_APPROVED: {
    label: 'Credencial Aprovada',
    badgeClass: 'bg-emerald-950/70 text-emerald-300 border-emerald-600/40',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
  },
  APROVOU_MODELO: {
    label: 'Modelo Aprovada',
    badgeClass: 'bg-emerald-950/70 text-emerald-300 border-emerald-600/40',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
  },
  APROVOU_AGENCIA: {
    label: 'Agência Aprovada',
    badgeClass: 'bg-emerald-950/70 text-emerald-300 border-emerald-600/40',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
  },
  CURATION_REJECTED: {
    label: 'Credencial Recusada',
    badgeClass: 'bg-rose-950/70 text-rose-300 border-rose-600/40',
    icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
  },
  RECUSOU_MODELO: {
    label: 'Modelo Recusada',
    badgeClass: 'bg-rose-950/70 text-rose-300 border-rose-600/40',
    icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
  },
  RECUSOU_AGENCIA: {
    label: 'Agência Recusada',
    badgeClass: 'bg-rose-950/70 text-rose-300 border-rose-600/40',
    icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
  },
  CURATION_NOTE_ADDED: {
    label: 'Anotação Interna',
    badgeClass: 'bg-amber-950/70 text-amber-300 border-amber-600/40',
    icon: <MessageSquare className="w-3.5 h-3.5 text-amber-400" />,
  },
  ADICIONOU_NOTA: {
    label: 'Anotação Interna',
    badgeClass: 'bg-amber-950/70 text-amber-300 border-amber-600/40',
    icon: <MessageSquare className="w-3.5 h-3.5 text-amber-400" />,
  },
  TEAM_MEMBER_CREATED: {
    label: 'Membro Cadastrado',
    badgeClass: 'bg-sky-950/70 text-sky-300 border-sky-600/40',
    icon: <UserPlus className="w-3.5 h-3.5 text-sky-400" />,
  },
  CRIOU_CURADOR: {
    label: 'Membro Cadastrado',
    badgeClass: 'bg-sky-950/70 text-sky-300 border-sky-600/40',
    icon: <UserPlus className="w-3.5 h-3.5 text-sky-400" />,
  },
  TEAM_ROLE_CHANGED: {
    label: 'Cargo RBAC Alterado',
    badgeClass: 'bg-purple-950/70 text-purple-300 border-purple-600/40',
    icon: <Shield className="w-3.5 h-3.5 text-purple-400" />,
  },
  ALTEROU_CARGO_CURADOR: {
    label: 'Cargo RBAC Alterado',
    badgeClass: 'bg-purple-950/70 text-purple-300 border-purple-600/40',
    icon: <Shield className="w-3.5 h-3.5 text-purple-400" />,
  },
  TEAM_MEMBER_DEACTIVATED: {
    label: 'Membro Desativado',
    badgeClass: 'bg-yellow-950/70 text-yellow-300 border-yellow-600/40',
    icon: <ShieldAlert className="w-3.5 h-3.5 text-yellow-400" />,
  },
  STATUS_CURADOR_ALTERADO: {
    label: 'Status Alterado',
    badgeClass: 'bg-yellow-950/70 text-yellow-300 border-yellow-600/40',
    icon: <ShieldAlert className="w-3.5 h-3.5 text-yellow-400" />,
  },
  TEAM_MEMBER_DELETED: {
    label: 'Membro Removido',
    badgeClass: 'bg-rose-950/70 text-rose-300 border-rose-600/40',
    icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
  },
  REMOVEU_CURADOR: {
    label: 'Membro Removido',
    badgeClass: 'bg-rose-950/70 text-rose-300 border-rose-600/40',
    icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
  },
};

export const AuditLogsTab: React.FC<AuditLogsTabProps> = ({ currentCuratorRole = 'admin' }) => {
  const [logs, setLogs] = useState<CurationAuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState<string>('ALL');

  // Modal de Detalhes
  const [selectedLog, setSelectedLog] = useState<CurationAuditLog | null>(null);

  const isRestricted = currentCuratorRole === 'curador_junior';

  const loadAuditLogs = useCallback(async () => {
    if (isRestricted) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      if (actionFilter !== 'ALL') {
        params.append('actionType', actionFilter);
      }
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      if (periodFilter === '24h') {
        const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
        params.append('dateFrom', d.toISOString());
      } else if (periodFilter === '7d') {
        const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        params.append('dateFrom', d.toISOString());
      } else if (periodFilter === '30d') {
        const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        params.append('dateFrom', d.toISOString());
      }

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      } else {
        const err = await res.json();
        setError(err.error || 'Erro ao carregar logs de auditoria');
      }
    } catch (e) {
      console.error('Erro ao buscar logs:', e);
      setError('Falha de conexão com a mesa de auditoria');
    } finally {
      setLoading(false);
    }
  }, [page, limit, actionFilter, searchTerm, periodFilter, isRestricted]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  if (isRestricted) {
    return (
      <div className="p-12 bg-[#0E0E0E] border border-dashed border-rose-500/30 text-center space-y-4 rounded-sm">
        <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h3 className="font-serif-lumiardi text-xl font-light text-ivory">
            Acesso Restrito à Supervisão & Administração
          </h3>
          <p className="text-xs text-ivory/50 font-sans leading-relaxed">
            Seu cargo atual (<strong>Curador Júnior</strong>) não possui privilégios para consultar a trilha forense de auditoria. Solicite acesso ao Supervisor ou Administrador Executivo.
          </p>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Banner de Cabeçalho do Audit Log */}
      <div className="p-6 bg-[#0E0E0E] border border-gold/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-mono tracking-widest text-gold font-bold px-2 py-0.5 bg-gold/10 border border-gold/30">
              Audit Trail & Compliance
            </span>
          </div>
          <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-ivory font-light">
            Histórico Imutável de Decisões da Curadoria
          </h2>
          <p className="text-xs text-ivory/60 font-sans mt-1 max-w-2xl">
            Registro cronológico e rastreável de todas as aprovações, recusas, anotações de compliance e alterações de cargos.
          </p>
        </div>

        <button
          onClick={loadAuditLogs}
          title="Atualizar logs"
          className="p-2.5 bg-[#141414] hover:bg-[#202020] border border-white/10 text-ivory/70 hover:text-gold transition-colors rounded-xs cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="p-4 bg-[#111111] border border-white/[0.08] flex flex-wrap items-center justify-between gap-4 rounded-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Busca Textual */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ivory/40" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail, justificativa ou ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs font-sans bg-[#181818] border border-white/10 text-ivory focus:border-gold outline-none rounded-xs"
            />
          </div>

          {/* Filtro por Tipo de Ação */}
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#181818] border border-white/10 text-ivory/80 text-xs px-3 py-2 rounded-xs outline-none focus:border-gold cursor-pointer"
          >
            <option value="ALL">Todas as Ações</option>
            <option value="CURATION_APPROVED">Aprovações de Credencial</option>
            <option value="CURATION_REJECTED">Recusas de Credencial</option>
            <option value="CURATION_NOTE_ADDED">Anotações de Compliance</option>
            <option value="TEAM_MEMBER_CREATED">Cadastro de Avaliador</option>
            <option value="TEAM_ROLE_CHANGED">Alterações de Cargo RBAC</option>
            <option value="TEAM_MEMBER_DEACTIVATED">Desativações de Membro</option>
          </select>

          {/* Filtro de Período */}
          <select
            value={periodFilter}
            onChange={(e) => {
              setPeriodFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#181818] border border-white/10 text-ivory/80 text-xs px-3 py-2 rounded-xs outline-none focus:border-gold cursor-pointer"
          >
            <option value="ALL">Todo o Histórico</option>
            <option value="24h">Últimas 24 Horas</option>
            <option value="7d">Últimos 7 Dias</option>
            <option value="30d">Últimos 30 Dias</option>
          </select>
        </div>

        <div className="text-[11px] font-mono text-ivory/50">
          Total de <strong>{total}</strong> evento(s) registrado(s)
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/70 border border-rose-500/40 text-rose-300 p-4 text-xs font-sans flex items-center gap-3 rounded-xs">
          <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabela de Logs */}
      <div className="bg-[#0E0E0E] border border-white/[0.08] overflow-hidden rounded-sm">
        {loading ? (
          <div className="p-12 text-center text-ivory/50 text-xs font-sans">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gold" />
            Carregando trilha de auditoria...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-ivory/50 text-xs font-sans">
            Nenhum evento registrado com os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#141414] text-ivory/40 uppercase tracking-widest text-[10px] border-b border-white/5">
                <tr>
                  <th className="px-6 py-3.5">Data / Hora</th>
                  <th className="px-6 py-3.5">Ação Realizada</th>
                  <th className="px-6 py-3.5">Operador / Avaliador</th>
                  <th className="px-6 py-3.5">Alvo / Candidato</th>
                  <th className="px-6 py-3.5">Justificativa / Detalhes</th>
                  <th className="px-6 py-3.5 text-right">Auditoria</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-ivory/80">
                {logs.map((log) => {
                  const actionMeta = ACTION_LABELS[log.actionType] || {
                    label: log.actionType,
                    badgeClass: 'bg-white/10 text-ivory border-white/20',
                    icon: <History className="w-3.5 h-3.5 text-gold" />,
                  };

                  return (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-mono text-[11px] text-ivory/60 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-ivory/40" />
                          <span>{new Date(log.createdAt).toLocaleString('pt-BR')}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-sans uppercase tracking-wider font-semibold border rounded-xs ${actionMeta.badgeClass}`}
                        >
                          {actionMeta.icon}
                          <span>{actionMeta.label}</span>
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-medium text-ivory">{log.performedByName}</div>
                        <div className="text-[10px] font-mono text-ivory/50 flex items-center gap-1">
                          <span>{log.performedByEmail}</span>
                          {log.performedByRole && (
                            <span className="text-gold font-sans uppercase">({log.performedByRole})</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-medium text-ivory">{log.targetName || 'Sistema'}</div>
                        <div className="text-[10px] font-mono text-ivory/50">
                          {log.targetType.toUpperCase()} {log.targetId ? `· ID: ${log.targetId.substring(0, 8)}...` : ''}
                        </div>
                      </td>

                      <td className="px-6 py-4 max-w-xs">
                        <div className="text-ivory/80 truncate text-xs">
                          {log.reason || (log.details ? JSON.stringify(log.details) : '—')}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 bg-[#181818] hover:bg-gold hover:text-black-matte text-ivory/70 border border-white/10 transition-colors rounded-xs cursor-pointer inline-flex items-center gap-1 text-[11px]"
                          title="Ver Registro Completo"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Dossiê</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        <div className="px-6 py-3.5 border-t border-white/5 bg-[#121212] flex items-center justify-between text-xs text-ivory/60">
          <span>
            Página <strong>{page}</strong> de <strong>{totalPages}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 bg-[#181818] hover:bg-white/10 text-ivory border border-white/10 rounded-xs disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 bg-[#181818] hover:bg-white/10 text-ivory border border-white/10 rounded-xs disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes do Log de Auditoria */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-[#111111] border border-gold/40 p-6 md:p-8 max-w-2xl w-full shadow-2xl rounded-sm space-y-5 text-ivory"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-gold" />
                <h3 className="font-serif-lumiardi text-xl text-ivory">
                  Registro Forense de Auditoria
                </h3>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-ivory/50 hover:text-gold cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-sans">
              <div className="p-3 bg-[#181818] border border-white/10 space-y-1">
                <span className="text-[10px] text-ivory/40 uppercase font-mono block">Protocolo de Registro:</span>
                <span className="font-mono text-gold font-semibold">{selectedLog.id}</span>
              </div>

              <div className="p-3 bg-[#181818] border border-white/10 space-y-1">
                <span className="text-[10px] text-ivory/40 uppercase font-mono block">Timestamp ISO:</span>
                <span className="font-mono text-ivory">{selectedLog.createdAt}</span>
              </div>

              <div className="p-3 bg-[#181818] border border-white/10 space-y-1">
                <span className="text-[10px] text-ivory/40 uppercase font-mono block">Avaliador Responsável:</span>
                <span className="font-medium text-ivory">{selectedLog.performedByName}</span>
                <span className="text-[10px] text-ivory/50 block font-mono">{selectedLog.performedByEmail}</span>
              </div>

              <div className="p-3 bg-[#181818] border border-white/10 space-y-1">
                <span className="text-[10px] text-ivory/40 uppercase font-mono block">Entidade Alvo:</span>
                <span className="font-medium text-ivory">{selectedLog.targetName}</span>
                <span className="text-[10px] text-ivory/50 block font-mono">Tipo: {selectedLog.targetType}</span>
              </div>
            </div>

            {selectedLog.reason && (
              <div className="p-4 bg-[#141414] border border-gold/30 space-y-1 text-xs">
                <span className="text-[10px] font-mono text-gold uppercase tracking-wider block font-semibold">
                  Justificativa Formal / Motivo Protocolado:
                </span>
                <p className="text-ivory leading-relaxed font-sans">{selectedLog.reason}</p>
              </div>
            )}

            {selectedLog.details && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-ivory/40 uppercase tracking-wider block">
                  Metadados / Payload Bruto:
                </span>
                <pre className="p-4 bg-[#090909] border border-white/10 font-mono text-[11px] text-emerald-400 overflow-x-auto rounded-xs max-h-48">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-gold hover:bg-gold-light text-black-matte font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer rounded-xs"
              >
                Fechar Registro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
