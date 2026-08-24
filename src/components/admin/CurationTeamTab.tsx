'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Users,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Key,
  Mail,
  User,
  X,
  Lock,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AdminUser, CurationRole } from '@/types';

interface CurationTeamTabProps {
  currentCuratorRole?: CurationRole;
}

const ROLE_INFO: Record<
  CurationRole,
  { label: string; badgeVariant: 'gold' | 'outline' | 'dark' | 'bronze'; desc: string; permissions: string[] }
> = {
  curador_junior: {
    label: 'Curador Júnior',
    badgeVariant: 'bronze',
    desc: 'Triagem inicial e anotações internas.',
    permissions: ['Visualizar Dossiês', 'Adicionar Anotações Internas'],
  },
  curador_senior: {
    label: 'Curador Sênior',
    badgeVariant: 'outline',
    desc: 'Decisão executiva sobre aprovação e recusa.',
    permissions: ['Visualizar Dossiês', 'Adicionar Anotações', 'Aprovar / Recusar Credenciais'],
  },
  supervisor: {
    label: 'Supervisor',
    badgeVariant: 'outline',
    desc: 'Supervisão técnica e auditoria de conformidade.',
    permissions: ['Todas permissões do Sênior', 'Acesso a Logs de Auditoria', 'Métricas de Compliance'],
  },
  admin: {
    label: 'Admin Executivo',
    badgeVariant: 'gold',
    desc: 'Gestão total do sistema e da equipe de curadoria.',
    permissions: ['Acesso Total', 'Gestão de Equipe & RBAC', 'Logs e Auditoria', 'Aprovar / Recusar'],
  },
};

export const CurationTeamTab: React.FC<CurationTeamTabProps> = ({ currentCuratorRole = 'admin' }) => {
  const [members, setMembers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Estados de Modal Novo Membro
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<CurationRole>('curador_junior');
  const [submitting, setSubmitting] = useState(false);

  // Estados de Edição de Cargo
  const [editingMember, setEditingMember] = useState<AdminUser | null>(null);
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState<CurationRole>('curador_junior');
  const [savingRole, setSavingRole] = useState(false);

  const isAdmin = currentCuratorRole === 'admin';

  const loadTeam = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/team');
      if (res.ok) {
        const data = await res.json();
        setMembers(data.team || []);
      } else {
        const err = await res.json();
        setError(err.error || 'Erro ao carregar equipe');
      }
    } catch (e) {
      console.error('Erro ao buscar equipe:', e);
      setError('Falha na comunicação com o servidor');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim().toLowerCase(),
          password: newPassword,
          curationRole: newRole,
        }),
      });

      if (res.ok) {
        setSuccessMsg('Novo membro da curadoria cadastrado com sucesso!');
        setShowAddModal(false);
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        setNewRole('curador_junior');
        setTimeout(() => setSuccessMsg(null), 4000);
        await loadTeam();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao cadastrar membro');
      }
    } catch (e) {
      console.error('Erro ao criar membro:', e);
      alert('Erro inesperado ao salvar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveRole = async () => {
    if (!editingMember) return;
    setSavingRole(true);
    try {
      const res = await fetch('/api/admin/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingMember.id,
          curationRole: selectedRoleForEdit,
        }),
      });

      if (res.ok) {
        setSuccessMsg(`Cargo de ${editingMember.name} atualizado para ${ROLE_INFO[selectedRoleForEdit].label}!`);
        setEditingMember(null);
        setTimeout(() => setSuccessMsg(null), 4000);
        await loadTeam();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao alterar cargo');
      }
    } catch (e) {
      console.error('Erro ao atualizar cargo:', e);
    } finally {
      setSavingRole(false);
    }
  };

  const handleToggleActive = async (member: AdminUser) => {
    if (!isAdmin) return;
    const newStatus = !member.isActive;
    const confirmText = newStatus
      ? `Reativar o acesso de ${member.name}?`
      : `Desativar o acesso de ${member.name}? O usuário não poderá logar na mesa de curadoria.`;

    if (!confirm(confirmText)) return;

    try {
      const res = await fetch('/api/admin/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: member.id,
          isActive: newStatus,
        }),
      });

      if (res.ok) {
        setSuccessMsg(`Status de ${member.name} alterado com sucesso!`);
        setTimeout(() => setSuccessMsg(null), 4000);
        await loadTeam();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao atualizar status');
      }
    } catch (e) {
      console.error('Erro ao alterar status:', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner de Cabeçalho do RBAC */}
      <div className="p-6 bg-[#0E0E0E] border border-gold/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-mono tracking-widest text-gold font-bold px-2 py-0.5 bg-gold/10 border border-gold/30">
              Role-Based Access Control (RBAC)
            </span>
          </div>
          <h2 className="font-serif-lumiardi text-2xl md:text-3xl text-ivory font-light">
            Gestão de Equipe & Níveis de Acesso
          </h2>
          <p className="text-xs text-ivory/60 font-sans mt-1 max-w-2xl">
            Configure as credenciais e permissões operacionais dos avaliadores da mesa de curadoria, compliance e supervisão.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadTeam}
            title="Atualizar lista"
            className="p-2.5 bg-[#141414] hover:bg-[#202020] border border-white/10 text-ivory/70 hover:text-gold transition-colors rounded-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isAdmin && (
            <Button
              variant="primary"
              onClick={() => setShowAddModal(true)}
              className="text-xs uppercase tracking-wider py-2.5 px-4 font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-gold/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo Membro</span>
            </Button>
          )}
        </div>
      </div>

      {/* Alertas */}
      {successMsg && (
        <div className="bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 p-4 text-xs font-sans flex items-center justify-between gap-3 rounded-xs animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400/60 hover:text-emerald-300 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-950/70 border border-rose-500/40 text-rose-300 p-4 text-xs font-sans flex items-center justify-between gap-3 rounded-xs">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Matriz de Permissões */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {(Object.keys(ROLE_INFO) as CurationRole[]).map((r) => {
          const info = ROLE_INFO[r];
          return (
            <div
              key={r}
              className="p-4 bg-[#111111] border border-white/[0.08] hover:border-gold/30 transition-all rounded-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-serif-lumiardi text-sm text-ivory font-medium">
                  {info.label}
                </span>
                <Badge variant={info.badgeVariant}>{r}</Badge>
              </div>
              <p className="text-[11px] text-ivory/50 font-sans">{info.desc}</p>
              <div className="pt-2 border-t border-white/5 space-y-1">
                {info.permissions.map((perm, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-[10px] text-ivory/70 font-sans">
                    <CheckCircle2 className="w-3 h-3 text-gold shrink-0" />
                    <span>{perm}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabela de Membros da Equipe */}
      <div className="bg-[#0E0E0E] border border-white/[0.08] overflow-hidden rounded-sm">
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#121212]">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gold" />
            <h3 className="font-serif-lumiardi text-lg text-ivory">
              Membros Ativos da Curadoria ({members.length})
            </h3>
          </div>
          {!isAdmin && (
            <span className="text-[10px] text-ivory/50 font-mono">
              Visualização restrita · Apenas Admin pode alterar cargos
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-ivory/50 text-xs font-sans">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gold" />
            Carregando membros da curadoria...
          </div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center text-ivory/50 text-xs font-sans">
            Nenhum membro cadastrado na equipe.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#141414] text-ivory/40 uppercase tracking-widest text-[10px] border-b border-white/5">
                <tr>
                  <th className="px-6 py-3.5">Nome / Identificação</th>
                  <th className="px-6 py-3.5">E-mail Corporativo</th>
                  <th className="px-6 py-3.5">Cargo / Nível de Acesso</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Cadastrado em</th>
                  {isAdmin && <th className="px-6 py-3.5 text-right">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-ivory/80">
                {members.map((member) => {
                  const roleData = ROLE_INFO[member.curationRole] || ROLE_INFO.curador_junior;
                  return (
                    <tr key={member.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-medium text-ivory flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center text-gold font-bold text-xs shrink-0">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span>{member.name}</span>
                          {member.email === 'admin@lumiardi.com' && (
                            <span className="block text-[9px] text-gold font-mono uppercase">Master Root</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-[11px] text-ivory/70">
                        {member.email}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-sans uppercase tracking-wider font-semibold border rounded-xs ${
                            member.curationRole === 'admin'
                              ? 'bg-gold/20 text-gold border-gold/40'
                              : member.curationRole === 'supervisor'
                              ? 'bg-sky-950/60 text-sky-300 border-sky-600/40'
                              : member.curationRole === 'curador_senior'
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/40'
                              : 'bg-amber-950/60 text-amber-300 border-amber-600/40'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          <span>{roleData.label}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(member)}
                          disabled={!isAdmin || member.email === 'admin@lumiardi.com'}
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-xs transition-colors ${
                            member.isActive
                              ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/30'
                              : 'text-rose-400 bg-rose-950/40 border border-rose-500/30'
                          } ${isAdmin && member.email !== 'admin@lumiardi.com' ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                        >
                          {member.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{member.isActive ? 'Ativo' : 'Inativo'}</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 font-mono text-[10px] text-ivory/40">
                        {new Date(member.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMember(member);
                              setSelectedRoleForEdit(member.curationRole);
                            }}
                            className="p-1.5 bg-[#181818] hover:bg-gold hover:text-black-matte text-ivory/70 border border-white/10 transition-colors rounded-xs cursor-pointer inline-flex items-center gap-1 text-[11px]"
                            title="Alterar Cargo"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Alterar Cargo</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Novo Membro da Curadoria */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-[#111111] border border-gold/40 p-6 md:p-8 max-w-md w-full shadow-2xl rounded-sm space-y-6 text-ivory"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-gold" />
                <h3 className="font-serif-lumiardi text-xl text-ivory">Cadastrar Novo Membro</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-ivory/50 hover:text-gold cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-4">
              <div>
                <label className="block text-[11px] font-sans text-ivory/70 uppercase tracking-wider mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ivory/40" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Dra. Mariana Silva"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-[#181818] border border-white/15 focus:border-gold pl-9 pr-3 py-2 text-xs text-ivory outline-none rounded-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-sans text-ivory/70 uppercase tracking-wider mb-1">
                  E-mail Corporativo
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ivory/40" />
                  <input
                    type="email"
                    required
                    placeholder="Ex: mariana.silva@lumiardi.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-[#181818] border border-white/15 focus:border-gold pl-9 pr-3 py-2 text-xs text-ivory outline-none rounded-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-sans text-ivory/70 uppercase tracking-wider mb-1">
                  Senha Provisória
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ivory/40" />
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#181818] border border-white/15 focus:border-gold pl-9 pr-3 py-2 text-xs text-ivory outline-none rounded-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-sans text-ivory/70 uppercase tracking-wider mb-1">
                  Cargo / Nível de Acesso (RBAC)
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as CurationRole)}
                  className="w-full bg-[#181818] border border-white/15 focus:border-gold px-3 py-2 text-xs text-ivory outline-none rounded-xs cursor-pointer"
                >
                  <option value="curador_junior">Curador Júnior (Leitura de dossiês e anotações)</option>
                  <option value="curador_senior">Curador Sênior (Aprovação / Recusa com justificativa)</option>
                  <option value="supervisor">Supervisor (Sênior + Histórico de Auditoria)</option>
                  <option value="admin">Admin Executivo (Acesso Total + Gestão de Equipe)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-sans text-ivory/60 hover:text-ivory cursor-pointer"
                >
                  Cancelar
                </button>
                <Button
                  variant="primary"
                  disabled={submitting}
                  type="submit"
                  className="text-xs uppercase tracking-wider py-2 px-5 font-bold cursor-pointer"
                >
                  {submitting ? 'Salvando...' : 'Cadastrar Membro'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Alteração de Cargo */}
      {editingMember && (
        <div
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setEditingMember(null)}
        >
          <div
            className="bg-[#111111] border border-gold/40 p-6 max-w-md w-full shadow-2xl rounded-sm space-y-5 text-ivory"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-serif-lumiardi text-lg text-ivory">
                Alterar Cargo de {editingMember.name}
              </h3>
              <button onClick={() => setEditingMember(null)} className="text-ivory/50 hover:text-gold cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-[11px] font-sans text-ivory/70 uppercase tracking-wider">
                Selecione o Novo Cargo Operacional:
              </label>

              {(Object.keys(ROLE_INFO) as CurationRole[]).map((r) => {
                const info = ROLE_INFO[r];
                const isSelected = selectedRoleForEdit === r;
                return (
                  <div
                    key={r}
                    onClick={() => setSelectedRoleForEdit(r)}
                    className={`p-3 border rounded-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-gold/15 border-gold text-ivory'
                        : 'bg-[#151515] border-white/10 text-ivory/70 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-gold">{info.label}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-gold" />}
                    </div>
                    <p className="text-[11px] text-ivory/60">{info.desc}</p>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="px-4 py-2 text-xs font-sans text-ivory/60 hover:text-ivory cursor-pointer"
              >
                Cancelar
              </button>
              <Button
                variant="primary"
                disabled={savingRole || selectedRoleForEdit === editingMember.curationRole}
                onClick={handleSaveRole}
                className="text-xs uppercase tracking-wider py-2 px-5 font-bold cursor-pointer"
              >
                {savingRole ? 'Salvando...' : 'Salvar Alteração'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
