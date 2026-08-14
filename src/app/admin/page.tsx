'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  ShieldCheck,
  Users,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  FileText,
  Eye,
  Check,
  X,
  ExternalLink,
  Download,
  AlertTriangle,
  Sparkles,
  LogOut,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Globe,
  Video,
  Play,
  RotateCcw,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface Application {
  id: string;
  email: string;
  fullName: string;
  role: 'criadora' | 'agencia';
  curationStatus: 'EM_CURATORIA' | 'APROVADO' | 'REJEITADO';
  phone?: string;
  documentType?: string;
  documentName?: string;
  documentUrl?: string;
  rejectionReason?: string;
  createdAt: string;
  profile?: {
    artisticName?: string;
    corporateName?: string;
    responsibleName?: string;
    category?: string;
    instagram?: string;
    birthDate?: string;
    documentNumber?: string;
    cnpj?: string;
    gender?: string;
    measurements?: { height?: string; weight?: string; waist?: string; bust?: string; hips?: string } | null;
    address?: { country?: string; state?: string; city?: string };
    photos?: Array<{ id: string; url: string; title: string }>;
    videoUrl?: string;
    bio?: string;
    exposureOpinion?: string;
    monthlyRevenueEstimate?: string;
    commissionRate?: string;
    specialties?: string[];
  };
}

interface Metrics {
  pending: number;
  approvedModels: number;
  approvedAgencies: number;
  rejected: number;
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'criadora' | 'agencia'>('criadora');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [metrics, setMetrics] = useState<Metrics>({
    pending: 0,
    approvedModels: 0,
    approvedAgencies: 0,
    rejected: 0,
  });
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // Estados de Ação de Decisão
  const [processingDecision, setProcessingDecision] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Carrega métricas e solicitações
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, aRes] = await Promise.all([
        fetch('/api/admin/metrics'),
        fetch(`/api/admin/applications?type=${activeTab}${statusFilter !== 'ALL' ? `&status=${statusFilter}` : ''}`),
      ]);

      if (mRes.ok) {
        const mData = await mRes.json();
        setMetrics(mData.metrics);
      }

      if (aRes.ok) {
        const aData = await aRes.json();
        setApplications(aData.applications || []);
      }
    } catch (e) {
      console.error('Erro ao carregar dados do admin:', e);
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Ação de Aprovação
  const handleApprove = async (appId: string) => {
    setProcessingDecision(true);
    try {
      const res = await fetch(`/api/admin/applications/${appId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APROVADO' }),
      });

      if (res.ok) {
        setActionSuccessMsg('Credencial aprovada com sucesso! Acesso concedido no sistema.');
        setTimeout(() => setActionSuccessMsg(null), 4000);
        await loadData();
        if (selectedApp?.id === appId) {
          setSelectedApp((prev) => (prev ? { ...prev, curationStatus: 'APROVADO' } : null));
        }
      }
    } catch (e) {
      console.error('Erro ao aprovar credencial:', e);
    } finally {
      setProcessingDecision(false);
    }
  };

  // Ação de Recusa com Motivo
  const handleReject = async () => {
    if (!selectedApp || !rejectionReason.trim()) return;
    setProcessingDecision(true);
    try {
      const res = await fetch(`/api/admin/applications/${selectedApp.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJEITADO', rejectionReason }),
      });

      if (res.ok) {
        setActionSuccessMsg('Credencial recusada com justificativa formal registrada.');
        setShowRejectModal(false);
        setRejectionReason('');
        setTimeout(() => setActionSuccessMsg(null), 4000);
        await loadData();
        setSelectedApp((prev) => (prev ? { ...prev, curationStatus: 'REJEITADO', rejectionReason } : null));
      }
    } catch (e) {
      console.error('Erro ao recusar credencial:', e);
    } finally {
      setProcessingDecision(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  };

  // Filtro em tempo real no cliente
  const filteredApps = applications.filter((app) => {
    const term = searchTerm.toLowerCase();
    return (
      app.fullName.toLowerCase().includes(term) ||
      app.email.toLowerCase().includes(term) ||
      (app.profile?.artisticName && app.profile.artisticName.toLowerCase().includes(term)) ||
      (app.profile?.instagram && app.profile.instagram.toLowerCase().includes(term))
    );
  });

  return (
    <div className="min-h-screen bg-[#070707] text-ivory flex flex-col selection:bg-gold selection:text-black-matte">
      {/* Header Executivo da Curadoria */}
      <header className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/[0.08] px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8">
            <Image
              src="/Lumiardi logo2-Trasparente.png"
              alt="Lumiardi Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif-lumiardi text-lg tracking-[0.15em] uppercase text-ivory font-medium">
                LUMIARDI
              </span>
              <span className="bg-gold/20 text-gold text-[10px] font-sans px-2 py-0.5 uppercase tracking-widest border border-gold/40 font-semibold rounded-xs">
                Mesa de Curadoria & Compliance
              </span>
            </div>
            <span className="text-[10px] font-sans text-ivory/40 block">
              Portal Administrativo de Auditoria de Contas
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs font-sans text-ivory/60 bg-[#121212] px-3 py-1.5 border border-white/[0.06] rounded-sm">
            <ShieldCheck className="w-4 h-4 text-gold" />
            <span>Auditor Conectado: <strong>curadoria@lumiardi.com</strong></span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-sans text-ivory/70 hover:text-rose-400 bg-[#141414] hover:bg-rose-500/10 border border-white/[0.08] hover:border-rose-500/30 px-3 py-1.5 transition-all rounded-sm cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Encerrar Sessão</span>
          </button>
        </div>
      </header>

      {/* Notificação Toast de Sucesso */}
      {actionSuccessMsg && (
        <div className="fixed top-20 right-8 z-50 bg-[#111827] border border-emerald-500 text-emerald-300 px-4 py-3 text-xs font-sans shadow-2xl flex items-center gap-2 rounded-sm animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8">
        {/* 1. Métricas Globais da Curadoria */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pendentes */}
          <div className="bg-[#0C0C0C] border border-gold/40 p-4 md:p-5 relative overflow-hidden rounded-sm group hover:border-gold transition-colors">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gold/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-sans uppercase tracking-widest text-gold font-semibold">
                Cadastros Pendentes
              </span>
              <Clock className="w-4 h-4 text-gold" />
            </div>
            <div className="font-serif-lumiardi text-3xl md:text-4xl text-ivory font-light">
              {metrics.pending}
            </div>
            <span className="text-[10px] font-sans text-ivory/40 mt-1 block">
              Aguardando validação documental
            </span>
          </div>

          {/* Modelos Aprovadas */}
          <div className="bg-[#0C0C0C] border border-white/[0.08] p-4 md:p-5 relative overflow-hidden rounded-sm hover:border-emerald-500/40 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-sans uppercase tracking-widest text-emerald-400 font-semibold">
                Modelos Aprovadas
              </span>
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="font-serif-lumiardi text-3xl md:text-4xl text-ivory font-light">
              {metrics.approvedModels}
            </div>
            <span className="text-[10px] font-sans text-ivory/40 mt-1 block">
              Credenciais ativas no casting
            </span>
          </div>

          {/* Agências Aprovadas */}
          <div className="bg-[#0C0C0C] border border-white/[0.08] p-4 md:p-5 relative overflow-hidden rounded-sm hover:border-sky-500/40 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-sans uppercase tracking-widest text-sky-400 font-semibold">
                Agências Aprovadas
              </span>
              <Building2 className="w-4 h-4 text-sky-400" />
            </div>
            <div className="font-serif-lumiardi text-3xl md:text-4xl text-ivory font-light">
              {metrics.approvedAgencies}
            </div>
            <span className="text-[10px] font-sans text-ivory/40 mt-1 block">
              Parceiras corporativas ativas
            </span>
          </div>

          {/* Recusados */}
          <div className="bg-[#0C0C0C] border border-white/[0.08] p-4 md:p-5 relative overflow-hidden rounded-sm hover:border-rose-500/40 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-sans uppercase tracking-widest text-rose-400 font-semibold">
                Cadastros Recusados
              </span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="font-serif-lumiardi text-3xl md:text-4xl text-ivory font-light">
              {metrics.rejected}
            </div>
            <span className="text-[10px] font-sans text-ivory/40 mt-1 block">
              Com justificativa protocolada
            </span>
          </div>
        </section>

        {/* 2. Abas e Barra de Filtros */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
            {/* Abas */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('criadora')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-sans uppercase tracking-widest transition-all rounded-sm cursor-pointer ${
                  activeTab === 'criadora'
                    ? 'bg-gold text-black-matte font-bold shadow-md shadow-gold/20'
                    : 'bg-[#121212] text-ivory/70 hover:text-ivory border border-white/[0.08]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Novas Criadoras / Modelos</span>
              </button>

              <button
                onClick={() => setActiveTab('agencia')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-sans uppercase tracking-widest transition-all rounded-sm cursor-pointer ${
                  activeTab === 'agencia'
                    ? 'bg-gold text-black-matte font-bold shadow-md shadow-gold/20'
                    : 'bg-[#121212] text-ivory/70 hover:text-ivory border border-white/[0.08]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Novas Agências Corporativas</span>
              </button>
            </div>

            {/* Filtro de Status & Busca */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ivory/40" />
                <input
                  type="text"
                  placeholder="Buscar por nome, e-mail ou @"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-[#121212] border border-white/[0.12] focus:border-gold pl-9 pr-3 py-1.5 text-xs text-ivory placeholder-ivory/30 outline-none rounded-sm w-48 md:w-64"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#121212] border border-white/[0.12] focus:border-gold px-3 py-1.5 text-xs text-ivory outline-none rounded-sm cursor-pointer"
              >
                <option value="ALL">Todos os Status</option>
                <option value="EM_CURATORIA">Pendentes (Em Curadoria)</option>
                <option value="APROVADO">Aprovados</option>
                <option value="REJEITADO">Recusados</option>
              </select>

              <button
                onClick={loadData}
                title="Atualizar Dados"
                className="p-2 bg-[#121212] hover:bg-white/[0.06] border border-white/[0.1] text-ivory/60 hover:text-gold rounded-sm transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 3. Tabela de Solicitações Recebidas */}
          <div className="bg-[#0A0A0A] border border-white/[0.08] overflow-hidden rounded-sm">
            {loading ? (
              <div className="p-12 text-center text-xs font-sans text-ivory/50 space-y-2">
                <div className="inline-block animate-spin text-gold font-bold">↻</div>
                <p>Carregando solicitações de credencial...</p>
              </div>
            ) : filteredApps.length === 0 ? (
              <div className="p-12 text-center text-xs font-sans text-ivory/40 space-y-1">
                <p className="text-sm text-ivory/70 font-medium">Nenhuma solicitação encontrada.</p>
                <p>Altere os filtros de busca ou aguarde novas submissões no site.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-[#101010] text-[10px] text-ivory/50 uppercase tracking-widest font-semibold">
                      <th className="py-3.5 px-4">Candidato / Organização</th>
                      <th className="py-3.5 px-4">Categoria / Nicho</th>
                      <th className="py-3.5 px-4">Documento Anexado</th>
                      <th className="py-3.5 px-4">Data Submissão</th>
                      <th className="py-3.5 px-4">Status Atual</th>
                      <th className="py-3.5 px-4 text-right">Ação de Auditoria</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredApps.map((app) => {
                      const isPending = app.curationStatus === 'EM_CURATORIA';
                      const isApproved = app.curationStatus === 'APROVADO';

                      return (
                        <tr
                          key={app.id}
                          className="hover:bg-white/[0.02] transition-colors group"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-sm bg-gold/10 border border-gold/30 text-gold flex items-center justify-center font-serif-lumiardi font-bold text-xs shrink-0">
                                {app.fullName.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="overflow-hidden">
                                <span className="font-medium text-ivory block truncate group-hover:text-gold transition-colors">
                                  {app.fullName}
                                </span>
                                <span className="text-[10px] text-ivory/40 block truncate">
                                  {app.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="text-ivory/80 font-medium">
                              {app.profile?.category || (app.role === 'criadora' ? 'Modelo VIP' : 'Agência')}
                            </span>
                            {app.profile?.instagram && (
                              <span className="text-[10px] text-gold/80 block">
                                {app.profile.instagram}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2 text-ivory/70">
                              <FileText className="w-3.5 h-3.5 text-gold shrink-0" />
                              <span className="truncate max-w-[140px] text-[11px]">
                                {app.documentName || 'doc_comprovante.pdf'}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-ivory/50 text-[11px]">
                            {new Date(app.createdAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>

                          <td className="py-3.5 px-4">
                            {isPending ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-semibold uppercase tracking-wider rounded-xs">
                                <Clock className="w-3 h-3" /> Em Curadoria
                              </span>
                            ) : isApproved ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold uppercase tracking-wider rounded-xs">
                                <CheckCircle2 className="w-3 h-3" /> Aprovado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-semibold uppercase tracking-wider rounded-xs">
                                <XCircle className="w-3 h-3" /> Recusado
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <Button
                              size="sm"
                              variant={isPending ? 'primary' : 'secondary'}
                              onClick={() => setSelectedApp(app)}
                              className="text-[10px] uppercase tracking-wider py-1.5 px-3 cursor-pointer"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Analisar
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 4. MODAL / DRAWER DE ANÁLISE DETALHADA DO CADASTRO */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-[#0D0D0D] border border-gold/40 w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden rounded-sm animate-scaleIn">
            {/* Header do Modal */}
            <div className="px-6 py-4 border-b border-white/[0.08] bg-[#111111] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gold/10 border border-gold/40 text-gold flex items-center justify-center font-serif-lumiardi font-bold text-sm">
                  {selectedApp.fullName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-serif-lumiardi text-lg md:text-xl text-ivory font-medium">
                    {selectedApp.fullName}
                  </h2>
                  <span className="text-[11px] font-sans text-ivory/50">
                    Protocolo: <strong>#{selectedApp.id}</strong> • Submetido em{' '}
                    {new Date(selectedApp.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-[10px] font-sans px-2.5 py-1 uppercase tracking-widest font-semibold rounded-xs border ${
                    selectedApp.curationStatus === 'APROVADO'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : selectedApp.curationStatus === 'REJEITADO'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {selectedApp.curationStatus}
                </span>

                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-1.5 text-ivory/40 hover:text-ivory hover:bg-white/[0.06] transition-colors rounded-sm cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Seção 1: Dados Pessoais / Corporativos */}
              <div className="space-y-3">
                <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-gold font-semibold block">
                  {selectedApp.role === 'agencia' ? '1. Dados Institucionais da Agência' : '1. Ficha Cadastral e Identificação'}
                </span>

                {selectedApp.role === 'agencia' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="p-3 bg-[#141414] border border-white/[0.06] rounded-sm">
                      <span className="text-[10px] text-ivory/40 block">Razão Social / Agência</span>
                      <span className="text-xs font-medium text-ivory flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-3 h-3 text-gold" /> {selectedApp.fullName}
                      </span>
                    </div>

                    <div className="p-3 bg-[#141414] border border-white/[0.06] rounded-sm">
                      <span className="text-[10px] text-ivory/40 block">Responsável de Casting</span>
                      <span className="text-xs font-medium text-ivory flex items-center gap-1.5 mt-0.5">
                        <Users className="w-3 h-3 text-gold" /> {selectedApp.profile?.responsibleName || selectedApp.fullName}
                      </span>
                    </div>

                    <div className="p-3 bg-[#141414] border border-white/[0.06] rounded-sm">
                      <span className="text-[10px] text-ivory/40 block">CNPJ / Registro Fiscal</span>
                      <span className="text-xs font-medium text-ivory flex items-center gap-1.5 mt-0.5">
                        <FileText className="w-3 h-3 text-gold" /> {selectedApp.profile?.documentNumber || '-'}
                      </span>
                    </div>

                    <div className="p-3 bg-[#141414] border border-white/[0.06] rounded-sm">
                      <span className="text-[10px] text-ivory/40 block">E-mail Corporativo</span>
                      <span className="text-xs font-medium text-ivory flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3 h-3 text-gold" /> {selectedApp.email}
                      </span>
                    </div>

                    <div className="p-3 bg-[#141414] border border-white/[0.06] rounded-sm">
                      <span className="text-[10px] text-ivory/40 block">WhatsApp / Telefone</span>
                      <span className="text-xs font-medium text-ivory flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-gold" /> {selectedApp.phone || '-'}
                      </span>
                    </div>

                    <div className="p-3 bg-[#141414] border border-white/[0.06] rounded-sm">
                      <span className="text-[10px] text-ivory/40 block">Instagram Oficial</span>
                      <span className="text-xs font-medium text-gold flex items-center gap-1.5 mt-0.5">
                        <Globe className="w-3 h-3 text-gold" /> {selectedApp.profile?.instagram || '-'}
                      </span>
                    </div>

                    <div className="p-3 bg-[#141414] border border-white/[0.06] rounded-sm sm:col-span-2">
                      <span className="text-[10px] text-ivory/40 block">Categoria / Especialidades</span>
                      <span className="text-xs font-medium text-ivory mt-0.5 block">
                        {selectedApp.profile?.category || 'Agência de Casting & Modelos'}
                      </span>
                    </div>

                    <div className="p-3 bg-[#141414] border border-white/[0.06] rounded-sm">
                      <span className="text-[10px] text-ivory/40 block">Comissão Padrão</span>
                      <span className="text-xs font-medium text-emerald-400 mt-0.5 block">20%</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="p-3 bg-[#141414] border border-white/[0.06] rounded-sm">
                      <span className="text-[10px] text-ivory/40 block">Nome Artístico / Completo</span>
                      <span className="text-xs font-medium text-ivory flex items-center gap-1.5 mt-0.5">
                        <Users className="w-3 h-3 text-gold" /> {selectedApp.profile?.artisticName || selectedApp.fullName}
                      </span>
                    </div>

                    <div className="p-3 bg-[#141414] border border-white/[0.06] rounded-sm">
                      <span className="text-[10px] text-ivory/40 block">E-mail Cadastrado</span>
                      <span className="text-xs font-medium text-ivory flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3 h-3 text-gold" /> {selectedApp.email}
                      </span>
                    </div>

                    <div className="p-3 bg-[#141414] border border-white/[0.06] rounded-sm">
                      <span className="text-[10px] text-ivory/40 block">Telefone / WhatsApp</span>
                      <span className="text-xs font-medium text-ivory flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-gold" /> {selectedApp.phone || '-'}
                      </span>
                    </div>

                    <div className="p-3 bg-[#141414] border border-white/[0.06] rounded-sm">
                      <span className="text-[10px] text-ivory/40 block">CPF / Documento</span>
                      <span className="text-xs font-medium text-ivory flex items-center gap-1.5 mt-0.5">
                        <FileText className="w-3 h-3 text-gold" /> {selectedApp.profile?.documentNumber || '-'}
                      </span>
                    </div>

                    <div className="p-3 bg-[#141414] border border-white/[0.06] rounded-sm">
                      <span className="text-[10px] text-ivory/40 block">Localização</span>
                      <span className="text-xs font-medium text-ivory flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3 h-3 text-gold" />{' '}
                        {selectedApp.profile?.address?.city || 'São Paulo'}, {selectedApp.profile?.address?.state || 'SP'}
                      </span>
                    </div>

                    <div className="p-3 bg-[#141414] border border-white/[0.06] rounded-sm">
                      <span className="text-[10px] text-ivory/40 block">Instagram Profissional</span>
                      <span className="text-xs font-medium text-gold flex items-center gap-1.5 mt-0.5">
                        <Globe className="w-3 h-3 text-gold" /> {selectedApp.profile?.instagram || '-'}
                      </span>
                    </div>

                    <div className="p-3 bg-[#141414] border border-white/[0.06] rounded-sm sm:col-span-2">
                      <span className="text-[10px] text-ivory/40 block">Categoria Artística</span>
                      <span className="text-xs font-medium text-ivory mt-0.5 block">
                        {selectedApp.profile?.category || 'Modelo & Criadora VIP'}
                      </span>
                    </div>

                    <div className="p-3 bg-[#141414] border border-white/[0.06] rounded-sm">
                      <span className="text-[10px] text-ivory/40 block">Faturamento Mensal Estimado</span>
                      <span className="text-xs font-medium text-emerald-400 mt-0.5 block">
                        {selectedApp.profile?.monthlyRevenueEstimate || 'Sob Consulta'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Seção 2: Documentos Oficiais Anexados & Auditoria Biométrica */}
              <div className="space-y-3">
                <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-gold font-semibold block">
                  2. Central de Documentos, Biometria (+18) & Blindagem 2FA
                </span>
                
                <div className="p-4 bg-[#141414] border border-gold/30 rounded-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-sm bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-medium text-ivory block">
                          {selectedApp.documentType || (selectedApp.role === 'agencia' ? 'Contrato Social & Cartão CNPJ' : 'Documento Oficial de Identificação')}
                        </span>
                        <span className="text-[10px] text-ivory/50 block">
                          Arquivo: {selectedApp.documentName || 'documento_oficial.jpg'} (Custódia 18 U.S.C. § 2257)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => alert(`Visualizando documento de auditoria: ${selectedApp.documentName || 'Documento Oficial'}`)}
                        className="px-3 py-1.5 bg-[#1C1C1C] hover:bg-gold hover:text-black-matte border border-gold/30 text-gold text-xs font-sans font-medium transition-colors flex items-center gap-1.5 rounded-sm cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Inspecionar Documento</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
                    <div className="flex items-center gap-2 p-2 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>Biometria 3D Facial (+18):</strong> Homologada ✓</span>
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>Blindagem 2FA (TOTP):</strong> Ativada ✓</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 3: Mídia, Fotos e Vídeo Showreel */}
              {selectedApp.role === 'criadora' && (
                <div className="space-y-3">
                  <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-gold font-semibold block">
                    3. Fotos Padronizadas & Vídeo de Prévia
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Fotos */}
                    <div className="space-y-2">
                      <span className="text-[11px] text-ivory/60 font-sans block">
                        Ensaio Fotográfico Submetido:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative aspect-[3/4] bg-black border border-white/[0.08] overflow-hidden rounded-sm">
                          <Image
                            src={selectedApp.profile?.photos?.[0]?.url || '/images/creator_elena.jpg'}
                            alt="Foto 01"
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="relative aspect-[3/4] bg-black border border-white/[0.08] overflow-hidden rounded-sm">
                          <Image
                            src={selectedApp.profile?.photos?.[1]?.url || '/images/creator_sophia.jpg'}
                            alt="Foto 02"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Vídeo Showreel */}
                    <div className="space-y-2">
                      <span className="text-[11px] text-ivory/60 font-sans block">
                        Vídeo de Apresentação / Showreel:
                      </span>
                      <div className="relative aspect-[4/3] bg-black border border-gold/30 overflow-hidden rounded-sm flex items-center justify-center group">
                        <video
                          src={selectedApp.profile?.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'}
                          controls
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Medidas */}
                  {selectedApp.profile?.measurements && (
                    <div className="p-3.5 bg-[#141414] border border-white/[0.06] rounded-sm">
                      <span className="text-[10px] uppercase tracking-wider text-ivory/50 font-semibold block mb-2">
                        Ficha Técnica Corporal:
                      </span>
                      <div className="grid grid-cols-5 gap-2 text-center text-xs font-sans">
                        <div className="bg-[#181818] p-2 border border-white/[0.04]">
                          <span className="text-[10px] text-ivory/40 block">Altura</span>
                          <span className="font-semibold text-gold">{selectedApp.profile.measurements.height || '175'} cm</span>
                        </div>
                        <div className="bg-[#181818] p-2 border border-white/[0.04]">
                          <span className="text-[10px] text-ivory/40 block">Peso</span>
                          <span className="font-semibold text-gold">{selectedApp.profile.measurements.weight || '55'} kg</span>
                        </div>
                        <div className="bg-[#181818] p-2 border border-white/[0.04]">
                          <span className="text-[10px] text-ivory/40 block">Cintura</span>
                          <span className="font-semibold text-gold">{selectedApp.profile.measurements.waist || '60'} cm</span>
                        </div>
                        <div className="bg-[#181818] p-2 border border-white/[0.04]">
                          <span className="text-[10px] text-ivory/40 block">Busto</span>
                          <span className="font-semibold text-gold">{selectedApp.profile.measurements.bust || '88'} cm</span>
                        </div>
                        <div className="bg-[#181818] p-2 border border-white/[0.04]">
                          <span className="text-[10px] text-ivory/40 block">Quadril</span>
                          <span className="font-semibold text-gold">{selectedApp.profile.measurements.hips || '90'} cm</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Justificativa de Recusa Anterior se houver */}
              {selectedApp.rejectionReason && (
                <div className="p-3.5 bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs font-sans space-y-1 rounded-sm">
                  <span className="font-semibold text-rose-400 block uppercase tracking-wider text-[10px]">
                    Motivo da Recusa Anterior:
                  </span>
                  <p>{selectedApp.rejectionReason}</p>
                </div>
              )}
            </div>

            {/* Rodapé do Modal: Mesa de Decisão */}
            <div className="px-6 py-4 border-t border-white/[0.08] bg-[#111111] flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] font-sans text-ivory/40">
                A aprovação liberará o login imediato do usuário no painel operacional.
              </span>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  variant="secondary"
                  onClick={() => setShowRejectModal(true)}
                  disabled={processingDecision}
                  className="flex-1 sm:flex-none border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs uppercase tracking-wider py-2.5 px-4 cursor-pointer"
                >
                  <X className="w-4 h-4 mr-1.5" />
                  Recusar Credencial
                </Button>

                <Button
                  variant="primary"
                  onClick={() => handleApprove(selectedApp.id)}
                  disabled={processingDecision || selectedApp.curationStatus === 'APROVADO'}
                  className="flex-1 sm:flex-none text-xs font-bold uppercase tracking-wider py-2.5 px-5 cursor-pointer shadow-lg shadow-gold/20"
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  {processingDecision ? 'Processando...' : selectedApp.curationStatus === 'APROVADO' ? 'Já Aprovado' : 'Aprovar Credencial'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL DE JUSTIFICATIVA DE RECUSA */}
      {showRejectModal && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-rose-500/50 p-6 max-w-md w-full shadow-2xl rounded-sm space-y-4 animate-scaleIn">
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-serif-lumiardi text-lg text-ivory font-medium">
                Recusar Credencial
              </h3>
            </div>

            <p className="text-xs text-ivory/60 font-sans leading-relaxed">
              Informe a justificativa formal para a recusa. Este motivo ficará registrado no protocolo do candidato:
            </p>

            <textarea
              rows={4}
              required
              placeholder="Ex: Documento de identificação ilegível / Inconsistência nos dados informados..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full bg-[#181818] border border-white/[0.12] focus:border-rose-500 p-3 text-xs text-ivory outline-none rounded-sm"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-xs font-sans text-ivory/60 hover:text-ivory cursor-pointer"
              >
                Cancelar
              </button>

              <Button
                variant="secondary"
                disabled={!rejectionReason.trim() || processingDecision}
                onClick={handleReject}
                className="bg-rose-600 hover:bg-rose-700 text-white border-none text-xs uppercase tracking-wider py-2 px-4 cursor-pointer"
              >
                {processingDecision ? 'Registrando...' : 'Confirmar Recusa'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
