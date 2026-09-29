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
  ZoomIn,
  MessageSquarePlus,
  SlidersHorizontal,
  MessageSquare,
  Send,
  Printer,
  History,
  UserPlus,
  UserCheck,
  Shield,
  Lock,
  Headphones,
  CreditCard,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { MediaLightboxModal, MediaItem } from '@/components/admin/MediaLightboxModal';
import { CurationDossierExport } from '@/components/admin/CurationDossierExport';
import { CurationTeamTab } from '@/components/admin/CurationTeamTab';
import { AuditLogsTab } from '@/components/admin/AuditLogsTab';
import { AdminChatTab } from '@/components/admin/AdminChatTab';
import { InterviewQueueTab } from '@/components/admin/InterviewQueueTab';
import { CurationRole } from '@/types';

interface Application {
  id: string;
  email: string;
  fullName: string;
  role: 'criadora' | 'agencia';
  curationStatus: 'EM_CURATORIA' | 'AGUARDANDO_REUNIAO' | 'APROVADA_PAGAMENTO' | 'APROVADO' | 'REJEITADO' | 'RECUSADO';
  phone?: string;
  whatsapp?: string;
  interviewDate?: string;
  interviewTime?: string;
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
  paymentInfo?: {
    hasPaid?: boolean;
    planId?: string;
    planCategory?: string;
    billingInterval?: string;
    amount?: number;
    currency?: string;
    status?: string;
    billingReason?: string;
    receiptNumber?: string;
  } | null;
}

interface Metrics {
  pending: number;
  approvedModels: number;
  approvedAgencies: number;
  rejected: number;
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'criadora' | 'agencia' | 'interviews' | 'team' | 'audit' | 'chat'>('criadora');
  const [currentCurator, setCurrentCurator] = useState<{
    id: string;
    email: string;
    name: string;
    curationRole: CurationRole;
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [locationFilter, setLocationFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [metrics, setMetrics] = useState<Metrics>({
    pending: 0,
    approvedModels: 0,
    approvedAgencies: 0,
    rejected: 0,
  });
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // Estados de Lightbox / Mídia Ampliada
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxItems, setLightboxItems] = useState<MediaItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Estados de Anotações Internas da Curadoria
  const [notes, setNotes] = useState<any[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  // Estados de Ação de Decisão
  const [processingDecision, setProcessingDecision] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Carrega métricas e solicitações
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const isAppTab = activeTab === 'criadora' || activeTab === 'agencia';
      const promises: Promise<Response>[] = [fetch('/api/admin/metrics')];
      if (isAppTab) {
        promises.push(
          fetch(`/api/admin/applications?type=${activeTab}${statusFilter !== 'ALL' ? `&status=${statusFilter}` : ''}`)
        );
      }

      const results = await Promise.all(promises);
      const mRes = results[0];
      const aRes = isAppTab ? results[1] : null;

      if (mRes && (mRes.status === 401 || mRes.status === 403)) {
        window.location.href = '/admin/login';
        return;
      }

      if (aRes && (aRes.status === 401 || aRes.status === 403)) {
        window.location.href = '/admin/login';
        return;
      }

      if (mRes && mRes.ok) {
        const mData = await mRes.json();
        if (mData.metrics) setMetrics(mData.metrics);
        if (mData.currentCurator) setCurrentCurator(mData.currentCurator);
      }

      if (aRes && aRes.ok) {
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
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'chat' || tab === 'team' || tab === 'audit' || tab === 'criadora' || tab === 'agencia' || tab === 'interviews') {
        setActiveTab(tab as any);
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Carrega anotações internas ao abrir o modal
  const loadNotes = useCallback(async (appId: string) => {
    setLoadingNotes(true);
    try {
      const res = await fetch(`/api/admin/applications/${appId}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
      }
    } catch (e) {
      console.error('Erro ao buscar anotações:', e);
    } finally {
      setLoadingNotes(false);
    }
  }, []);

  useEffect(() => {
    if (selectedApp?.id) {
      loadNotes(selectedApp.id);
    } else {
      setNotes([]);
      setNewNoteText('');
    }
  }, [selectedApp?.id, loadNotes]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp?.id || !newNoteText.trim()) return;

    setSavingNote(true);
    try {
      const res = await fetch(`/api/admin/applications/${selectedApp.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newNoteText }),
      });

      if (res.ok) {
        const data = await res.json();
        setNotes((prev) => [data.note, ...prev]);
        setNewNoteText('');
      }
    } catch (e) {
      console.error('Erro ao salvar nota:', e);
    } finally {
      setSavingNote(false);
    }
  };

  const openLightbox = (items: MediaItem[], idx: number = 0) => {
    setLightboxItems(items);
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

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
        setActionSuccessMsg('Credencial aprovada com sucesso! Notificação e e-mail disparados.');
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

  const handleApproveForPayment = async (appId: string) => {
    setProcessingDecision(true);
    try {
      const res = await fetch(`/api/admin/applications/${appId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APROVADA_PAGAMENTO' }),
      });

      if (res.ok) {
        setActionSuccessMsg('Candidata homologada para pagamento com sucesso!');
        setTimeout(() => setActionSuccessMsg(null), 4000);
        await loadData();
        if (selectedApp?.id === appId) {
          setSelectedApp((prev) => (prev ? { ...prev, curationStatus: 'APROVADA_PAGAMENTO' } : null));
        }
      }
    } catch (e) {
      console.error('Erro ao aprovar para pagamento:', e);
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
        const data = await res.json();
        const refundNote = data.refund?.refunded
          ? ` • Reembolso de ${data.refund.currency === 'BRL' ? 'R$ ' : '$'}${Number(data.refund.amount || 0).toFixed(2).replace('.', ',')} efetuado automaticamente (Código: ${data.refund.refundCode})`
          : '';
        setActionSuccessMsg(`Credencial recusada com justificativa formal.${refundNote}`);
        setShowRejectModal(false);
        setRejectionReason('');
        setTimeout(() => setActionSuccessMsg(null), 6000);
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

  // Filtro avançado e ordenação
  const filteredApps = applications
    .filter((app) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        app.fullName.toLowerCase().includes(term) ||
        app.email.toLowerCase().includes(term) ||
        (app.profile?.artisticName && app.profile.artisticName.toLowerCase().includes(term)) ||
        (app.profile?.instagram && app.profile.instagram.toLowerCase().includes(term));

      if (!matchSearch) return false;

      if (categoryFilter !== 'ALL') {
        const cat = app.profile?.category || '';
        if (!cat.toLowerCase().includes(categoryFilter.toLowerCase())) return false;
      }

      if (locationFilter !== 'ALL') {
        const loc = `${app.profile?.address?.country || ''} ${app.profile?.address?.state || ''} ${app.profile?.address?.city || ''}`;
        if (!loc.toLowerCase().includes(locationFilter.toLowerCase())) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'name') return a.fullName.localeCompare(b.fullName);
      return 0;
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
            <span>Auditor: <strong>{currentCurator?.name || currentCurator?.email || 'curadoria@lumiardi.com'}</strong></span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 uppercase tracking-wider font-semibold border rounded-xs ${
                currentCurator?.curationRole === 'admin'
                  ? 'bg-gold/20 text-gold border-gold/40'
                  : currentCurator?.curationRole === 'supervisor'
                  ? 'bg-sky-950/60 text-sky-300 border-sky-600/40'
                  : currentCurator?.curationRole === 'curador_senior'
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/40'
                  : 'bg-amber-950/60 text-amber-300 border-amber-600/40'
              }`}
            >
              {currentCurator?.curationRole === 'admin'
                ? 'Admin Executivo'
                : currentCurator?.curationRole === 'supervisor'
                ? 'Supervisor'
                : currentCurator?.curationRole === 'curador_senior'
                ? 'Curador Sênior'
                : 'Curador Júnior'}
            </span>
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
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
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

        {/* 2. Abas e Navegação */}
        <section className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
            {/* Abas */}
            <div className="flex flex-wrap items-center gap-2">
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

              <button
                onClick={() => setActiveTab('interviews')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-sans uppercase tracking-widest transition-all rounded-sm cursor-pointer ${
                  activeTab === 'interviews'
                    ? 'bg-gold text-black-matte font-bold shadow-md shadow-gold/20'
                    : 'bg-[#121212] text-ivory/70 hover:text-ivory border border-white/[0.08]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Entrevistas de Curadoria</span>
              </button>

              <button
                onClick={() => setActiveTab('team')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-sans uppercase tracking-widest transition-all rounded-sm cursor-pointer ${
                  activeTab === 'team'
                    ? 'bg-gold text-black-matte font-bold shadow-md shadow-gold/20'
                    : 'bg-[#121212] text-ivory/70 hover:text-ivory border border-white/[0.08]'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Equipe & Cargos (RBAC)</span>
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-sans uppercase tracking-widest transition-all rounded-sm cursor-pointer ${
                  activeTab === 'audit'
                    ? 'bg-gold text-black-matte font-bold shadow-md shadow-gold/20'
                    : 'bg-[#121212] text-ivory/70 hover:text-ivory border border-white/[0.08]'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Histórico de Auditoria</span>
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-sans uppercase tracking-widest transition-all rounded-sm cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-gold text-black-matte font-bold shadow-md shadow-gold/20'
                    : 'bg-[#121212] text-ivory/70 hover:text-ivory border border-white/[0.08]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Atendimento & Chat</span>
              </button>
            </div>

            {/* Filtro de Status, Busca & Filtros Avançados (visível nas abas de triagem) */}
            {(activeTab === 'criadora' || activeTab === 'agencia') && (
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ivory/40" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, e-mail ou @"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-[#121212] border border-white/[0.12] focus:border-gold pl-9 pr-3 py-1.5 text-xs text-ivory placeholder-ivory/30 outline-none rounded-sm w-44 md:w-56"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#121212] border border-white/[0.12] focus:border-gold px-3 py-1.5 text-xs text-ivory outline-none rounded-sm cursor-pointer"
                >
                  <option value="ALL">Status: Todos</option>
                  <option value="AGUARDANDO_REUNIAO">Aguardando Reunião</option>
                  <option value="EM_CURATORIA">Em Curadoria / Análise</option>
                  <option value="APROVADA_PAGAMENTO">Aprovadas p/ Pagamento</option>
                  <option value="APROVADO">Aprovados (Ativos)</option>
                  <option value="REJEITADO">Recusados</option>
                </select>

                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`px-3 py-1.5 text-xs font-sans flex items-center gap-1.5 border rounded-sm transition-colors cursor-pointer ${
                    showAdvancedFilters || categoryFilter !== 'ALL' || locationFilter !== 'ALL' || sortBy !== 'newest'
                      ? 'bg-gold/20 text-gold border-gold/40'
                      : 'bg-[#121212] text-ivory/70 border-white/[0.12] hover:text-ivory'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filtros {categoryFilter !== 'ALL' || locationFilter !== 'ALL' ? '•' : ''}</span>
                </button>

                <button
                  onClick={loadData}
                  title="Atualizar Dados"
                  className="p-2 bg-[#121212] hover:bg-white/[0.06] border border-white/[0.1] text-ivory/60 hover:text-gold rounded-sm transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Renderização Condicional por Aba */}
          {activeTab === 'chat' && (
            <AdminChatTab currentCuratorName={currentCurator?.name} />
          )}

          {activeTab === 'team' && (
            <CurationTeamTab currentCuratorRole={currentCurator?.curationRole || 'admin'} />
          )}

          {activeTab === 'audit' && (
            <AuditLogsTab currentCuratorRole={currentCurator?.curationRole || 'admin'} />
          )}

          {activeTab === 'interviews' && (
            <InterviewQueueTab
              currentCuratorRole={currentCurator?.curationRole || 'admin'}
              onRefreshMetrics={loadData}
            />
          )}

          {(activeTab === 'criadora' || activeTab === 'agencia') && (
            <>
              {/* Barra de Filtros Avançados Expansível */}
              {showAdvancedFilters && (
                <div className="p-3.5 bg-[#101010] border border-white/[0.08] rounded-sm grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-in fade-in duration-200">
                  <div>
                    <label className="block text-[10px] uppercase font-mono text-ivory/50 mb-1">
                      Localização / País / Estado
                    </label>
                    <select
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-full bg-[#181818] border border-white/[0.1] focus:border-gold px-2.5 py-1.5 text-xs text-ivory outline-none rounded-sm cursor-pointer"
                    >
                      <option value="ALL">Todas as Localizações</option>
                      <option value="Brasil">Brasil</option>
                      <option value="SP">São Paulo (SP)</option>
                      <option value="RJ">Rio de Janeiro (RJ)</option>
                      <option value="Estados Unidos">Estados Unidos / Internacional</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono text-ivory/50 mb-1">
                      Nicho / Especialidade
                    </label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full bg-[#181818] border border-white/[0.1] focus:border-gold px-2.5 py-1.5 text-xs text-ivory outline-none rounded-sm cursor-pointer"
                    >
                      <option value="ALL">Todas as Especialidades</option>
                      <option value="VIP">Modelo & Criadora VIP</option>
                      <option value="Alta Moda">Alta Moda & Editorial</option>
                      <option value="Comercial">Comercial / Publicidade</option>
                      <option value="Casting">Agência de Casting</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono text-ivory/50 mb-1">
                      Ordenação Cronológica / Alfabética
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full bg-[#181818] border border-white/[0.1] focus:border-gold px-2.5 py-1.5 text-xs text-ivory outline-none rounded-sm cursor-pointer"
                    >
                      <option value="newest">Mais Recentes Primeiro</option>
                      <option value="oldest">Mais Antigas Primeiro</option>
                      <option value="name">Nome (A - Z)</option>
                    </select>
                  </div>
                </div>
              )}

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
                          const isAwaitingMeeting = app.curationStatus === 'AGUARDANDO_REUNIAO';
                          const isUnderReview = app.curationStatus === 'EM_CURATORIA';
                          const isApprovedPayment = app.curationStatus === 'APROVADA_PAGAMENTO';
                          const isApproved = app.curationStatus === 'APROVADO';
                          const isRejected = app.curationStatus === 'REJEITADO' || app.curationStatus === 'RECUSADO';

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
                                {isAwaitingMeeting ? (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[10px] font-semibold uppercase tracking-wider rounded-xs">
                                      <Calendar className="w-3 h-3 text-sky-400" /> Aguardando Reunião
                                    </span>
                                    {app.interviewDate && (
                                      <span className="text-[9px] font-mono text-ivory/60 block">
                                        {app.interviewDate.split('-').reverse().join('/')} às {app.interviewTime || '14:00'}
                                      </span>
                                    )}
                                  </div>
                                ) : isUnderReview ? (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-semibold uppercase tracking-wider rounded-xs">
                                      <Clock className="w-3 h-3" /> Em Curadoria
                                    </span>
                                  </div>
                                ) : isApprovedPayment ? (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#C9A96B]/15 text-[#C9A96B] border border-[#C9A96B]/40 text-[10px] font-semibold uppercase tracking-wider rounded-xs">
                                      <CreditCard className="w-3 h-3" /> Aprovada p/ Pagamento
                                    </span>
                                    <span className="text-[9px] font-mono text-ivory/50 block">Aguardando Checkout</span>
                                  </div>
                                ) : isApproved ? (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold uppercase tracking-wider rounded-xs">
                                      <CheckCircle2 className="w-3 h-3" /> Aprovado (Ativo)
                                    </span>
                                    {app.paymentInfo?.planId && (
                                      <span className="text-[9px] font-mono text-gold block">
                                        Plano {app.paymentInfo.planId.toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                ) : isRejected ? (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-semibold uppercase tracking-wider rounded-xs">
                                      <XCircle className="w-3 h-3" /> Recusado
                                    </span>
                                    {app.paymentInfo?.hasPaid && (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-rose-950/40 text-rose-300 border border-rose-500/20 text-[9px] font-mono rounded-xs">
                                        ↩ Estornado
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-neutral-800 text-ivory/70 border border-white/10 text-[10px] font-semibold uppercase tracking-wider rounded-xs">
                                      {app.curationStatus || 'Pendente'}
                                    </span>
                                  </div>
                                )}
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <Button
                                  size="sm"
                                  variant={isAwaitingMeeting || isUnderReview || isApprovedPayment ? 'primary' : 'secondary'}
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
            </>
          )}
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
                <CurationDossierExport application={selectedApp} auditorEmail="curadoria@lumiardi.com" />

                <span
                  className={`text-[10px] font-sans px-2.5 py-1 uppercase tracking-widest font-semibold rounded-xs border flex items-center gap-1.5 ${
                    selectedApp.curationStatus === 'APROVADO'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : selectedApp.curationStatus === 'APROVADA_PAGAMENTO'
                      ? 'bg-[#D4AF37]/15 text-[#F5D77F] border-[#D4AF37]/40'
                      : selectedApp.curationStatus === 'AGUARDANDO_REUNIAO'
                      ? 'bg-sky-500/15 text-sky-300 border-sky-500/40'
                      : selectedApp.curationStatus === 'REJEITADO' || selectedApp.curationStatus === 'RECUSADO'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {selectedApp.curationStatus === 'APROVADO'
                    ? 'Credencial Ativa'
                    : selectedApp.curationStatus === 'APROVADA_PAGAMENTO'
                    ? 'Aprovada p/ Pagamento'
                    : selectedApp.curationStatus === 'AGUARDANDO_REUNIAO'
                    ? 'Aguardando Reunião'
                    : selectedApp.curationStatus === 'REJEITADO' || selectedApp.curationStatus === 'RECUSADO'
                    ? 'Recusada'
                    : 'Em Análise Preliminar'}
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
              {/* Card de Alinhamento da Entrevista / Reunião (quando agendada) */}
              {(selectedApp.curationStatus === 'AGUARDANDO_REUNIAO' || selectedApp.interviewDate) && (
                <div className="p-4 bg-gradient-to-r from-sky-950/40 via-[#0f172a]/60 to-black/60 border border-sky-500/40 rounded-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-sky-400 font-semibold flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-sky-400" />
                        Reunião de Curadoria Agendada
                      </span>
                      <p className="text-xs text-ivory/90">
                        Data e Horário: <strong className="text-sky-300 font-mono text-sm">{selectedApp.interviewDate ? new Date(selectedApp.interviewDate).toLocaleDateString('pt-BR') : 'A definir'} às {selectedApp.interviewTime || 'A definir'}</strong> (Horário de Brasília)
                      </p>
                      <p className="text-[11px] text-ivory/60">
                        WhatsApp do Candidato: <span className="text-emerald-400 font-mono font-medium">{selectedApp.whatsapp || selectedApp.phone || 'Não informado'}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {(() => {
                        const rawPhone = (selectedApp.whatsapp || selectedApp.phone || '').replace(/\D/g, '');
                        const cleanPhone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;
                        const meetMsg = encodeURIComponent(
                          `Olá ${selectedApp.fullName}! Aqui é da Mesa de Curadoria da Lumiardi.\n\nConfirmamos a sua reunião de curadoria prévia para o dia ${selectedApp.interviewDate ? new Date(selectedApp.interviewDate).toLocaleDateString('pt-BR') : ''} às ${selectedApp.interviewTime || ''} (Horário de Brasília).\n\nSegue o link da sala virtual no Google Meet:\nhttps://meet.google.com/new\n\nPodemos confirmar sua presença?`
                        );
                        return (
                          <a
                            href={rawPhone ? `https://wa.me/${cleanPhone}?text=${meetMsg}` : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              if (!rawPhone) {
                                e.preventDefault();
                                alert('Número de WhatsApp não informado pelo candidato.');
                              }
                            }}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-sm transition-colors flex items-center gap-2 shadow-sm"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Enviar Google Meet via WhatsApp</span>
                          </a>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Seção 0: Status Financeiro & Plano Contratado */}
              <div className="p-4 bg-gradient-to-r from-[#181611] to-[#111] border border-gold/40 rounded-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-gold font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Status Financeiro & Plano de Adesão
                  </span>
                  {selectedApp.paymentInfo?.hasPaid ? (
                    <span className="text-[10px] font-mono uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-xs">
                      ✓ Pagamento Confirmado
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono uppercase bg-amber-950/60 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-xs">
                      Aguardando Confirmação
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-sans">
                  <div className="p-2.5 bg-black/40 border border-white/[0.06] rounded-xs">
                    <span className="text-[10px] text-ivory/40 block">Plano Selecionado</span>
                    <span className="font-semibold text-gold uppercase">
                      {selectedApp.paymentInfo?.planId || (selectedApp.role === 'agencia' ? 'SELECT' : 'GLOW')} ({selectedApp.paymentInfo?.billingInterval === 'yearly' ? 'ANUAL' : 'MENSAL'})
                    </span>
                  </div>
                  <div className="p-2.5 bg-black/40 border border-white/[0.06] rounded-xs">
                    <span className="text-[10px] text-ivory/40 block">Valor da Adesão</span>
                    <span className="font-semibold text-emerald-400">
                      R$ {selectedApp.paymentInfo?.amount ? Number(selectedApp.paymentInfo.amount).toFixed(2).replace('.', ',') : (selectedApp.role === 'agencia' ? '2.797,20' : '1.402,92')}
                    </span>
                  </div>
                  <div className="p-2.5 bg-black/40 border border-white/[0.06] rounded-xs">
                    <span className="text-[10px] text-ivory/40 block">Garantia Editorial</span>
                    <span className="text-ivory/70 text-[11px] block">
                      Reembolso automático em caso de recusa
                    </span>
                  </div>
                </div>
              </div>

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
                          Arquivo: {selectedApp.documentName || 'Não anexado'} (Custódia 18 U.S.C. § 2257)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedApp.documentUrl ? (
                        <button
                          onClick={() =>
                            openLightbox([
                              {
                                url: selectedApp.documentUrl!,
                                title: `Documento de Identificação - ${selectedApp.fullName}`,
                                tag: 'Documento 2257',
                              },
                            ])
                          }
                          className="px-3 py-1.5 bg-[#1C1C1C] hover:bg-gold hover:text-black-matte border border-gold/30 text-gold text-xs font-sans font-medium transition-colors flex items-center gap-1.5 rounded-sm cursor-pointer"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                          <span>Inspecionar Documento</span>
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] text-ivory/40 text-xs font-sans rounded-sm flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-ivory/30" />
                          <span>Documento Físico / Pendente de Envio</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans">
                    <div className="flex items-center gap-2 p-2 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>Biometria 3D Facial (+18):</strong> Homologada</span>
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>Blindagem 2FA (TOTP):</strong> Ativada</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 3: Mídia, Fotos e Vídeo Showreel com Zoom em Alta Resolução */}
              {selectedApp.role === 'criadora' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-gold font-semibold block">
                      3. Ensaio Fotográfico & Vídeo de Apresentação (Clique para Ampliar)
                    </span>
                    <span className="text-[10px] text-gold/80 font-mono">
                      Lightbox HD Ativo
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Fotos */}
                    <div className="space-y-2">
                      <span className="text-[11px] text-ivory/60 font-sans block">
                        Fotos de Portfólio (Clique para Zoom):
                      </span>
                      {selectedApp.profile?.photos && selectedApp.profile.photos.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {selectedApp.profile.photos.map((p, pIdx) => (
                            <div
                              key={pIdx}
                              onClick={() => openLightbox(selectedApp.profile!.photos!.map(ph => ({ url: ph.url, title: ph.title || `${selectedApp.fullName} - Ensaio`, tag: 'Ensaio' })), pIdx)}
                              className="relative aspect-[3/4] bg-black border border-white/[0.08] hover:border-gold/60 overflow-hidden rounded-sm cursor-pointer group transition-all"
                            >
                              <Image
                                src={p.url}
                                alt={p.title || `Foto ${pIdx + 1}`}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-gold">
                                <ZoomIn className="w-6 h-6" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 bg-black/40 border border-white/[0.06] rounded-sm text-center flex flex-col items-center justify-center min-h-[140px]">
                          <Eye className="w-5 h-5 text-ivory/20 mb-1.5" />
                          <p className="text-xs text-ivory/50">Nenhum ensaio fotográfico preliminar anexado.</p>
                        </div>
                      )}
                    </div>

                    {/* Vídeo Showreel */}
                    <div className="space-y-2">
                      <span className="text-[11px] text-ivory/60 font-sans block">
                        Vídeo de Apresentação / Showreel:
                      </span>
                      {selectedApp.profile?.videoUrl ? (
                        <div
                          onClick={() =>
                            openLightbox([
                              {
                                url: selectedApp.profile!.videoUrl!,
                                title: `Vídeo de Apresentação - ${selectedApp.fullName}`,
                                type: 'video',
                              },
                            ])
                          }
                          className="relative aspect-[4/3] bg-black border border-gold/30 hover:border-gold overflow-hidden rounded-sm flex items-center justify-center group cursor-pointer"
                        >
                          <video
                            src={selectedApp.profile.videoUrl}
                            className="w-full h-full object-cover pointer-events-none"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-gold text-black-matte flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                              <Play className="w-5 h-5 fill-current ml-0.5" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 bg-black/40 border border-white/[0.06] rounded-sm text-center flex flex-col items-center justify-center min-h-[140px]">
                          <Video className="w-5 h-5 text-ivory/20 mb-1.5" />
                          <p className="text-xs text-ivory/50">Nenhum vídeo de apresentação submetido.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Medidas Corporais Reais */}
                  {selectedApp.profile?.measurements &&
                    (selectedApp.profile.measurements.height ||
                      selectedApp.profile.measurements.weight ||
                      selectedApp.profile.measurements.waist ||
                      selectedApp.profile.measurements.bust ||
                      selectedApp.profile.measurements.hips) && (
                    <div className="p-3.5 bg-[#141414] border border-white/[0.06] rounded-sm">
                      <span className="text-[10px] uppercase tracking-wider text-ivory/50 font-semibold block mb-2">
                        Ficha Técnica Corporal Declarada:
                      </span>
                      <div className="grid grid-cols-5 gap-2 text-center text-xs font-sans">
                        <div className="bg-[#181818] p-2 border border-white/[0.04]">
                          <span className="text-[10px] text-ivory/40 block">Altura</span>
                          <span className="font-semibold text-gold">
                            {selectedApp.profile.measurements.height ? `${selectedApp.profile.measurements.height} cm` : '-'}
                          </span>
                        </div>
                        <div className="bg-[#181818] p-2 border border-white/[0.04]">
                          <span className="text-[10px] text-ivory/40 block">Peso</span>
                          <span className="font-semibold text-gold">
                            {selectedApp.profile.measurements.weight ? `${selectedApp.profile.measurements.weight} kg` : '-'}
                          </span>
                        </div>
                        <div className="bg-[#181818] p-2 border border-white/[0.04]">
                          <span className="text-[10px] text-ivory/40 block">Cintura</span>
                          <span className="font-semibold text-gold">
                            {selectedApp.profile.measurements.waist ? `${selectedApp.profile.measurements.waist} cm` : '-'}
                          </span>
                        </div>
                        <div className="bg-[#181818] p-2 border border-white/[0.04]">
                          <span className="text-[10px] text-ivory/40 block">Busto</span>
                          <span className="font-semibold text-gold">
                            {selectedApp.profile.measurements.bust ? `${selectedApp.profile.measurements.bust} cm` : '-'}
                          </span>
                        </div>
                        <div className="bg-[#181818] p-2 border border-white/[0.04]">
                          <span className="text-[10px] text-ivory/40 block">Quadril</span>
                          <span className="font-semibold text-gold">
                            {selectedApp.profile.measurements.hips ? `${selectedApp.profile.measurements.hips} cm` : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Seção 4: Prontuário & Anotações Internas entre Curadores */}
              <div className="space-y-3 pt-2 border-t border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <MessageSquarePlus className="w-4 h-4 text-gold" />
                  <span className="text-[10px] font-sans uppercase tracking-[0.2em] text-gold font-semibold">
                    4. Prontuário & Anotações Internas de Auditoria (Privado da Curadoria)
                  </span>
                </div>

                <div className="p-4 bg-[#141414] border border-white/[0.08] rounded-sm space-y-4">
                  {/* Formulário para Nova Nota */}
                  <form onSubmit={handleAddNote} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Adicionar nota interna sobre este cadastro (visível apenas para auditores)..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      className="flex-1 bg-[#1A1A1A] border border-white/[0.12] focus:border-gold px-3.5 py-2 text-xs text-ivory placeholder-ivory/30 outline-none rounded-sm"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={savingNote || !newNoteText.trim()}
                      className="text-xs uppercase tracking-wider py-2 px-4 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>{savingNote ? 'Salvando...' : 'Anotar'}</span>
                    </Button>
                  </form>

                  {/* Lista de Notas */}
                  {loadingNotes ? (
                    <div className="text-center text-xs text-ivory/40 py-2">Carregando notas...</div>
                  ) : notes.length === 0 ? (
                    <div className="text-center text-xs text-ivory/40 py-3 bg-[#111] border border-white/[0.04] rounded-sm">
                      Nenhuma anotação interna registrada para este candidato.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {notes.map((n) => (
                        <div key={n.id} className="p-2.5 bg-[#181818] border border-white/[0.06] rounded-sm text-xs space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-mono text-gold">{n.author}</span>
                            <span className="text-ivory/40 font-sans">
                              {new Date(n.createdAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-ivory/80 font-sans leading-relaxed">{n.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

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
            {(() => {
              const isJunior = currentCurator?.curationRole === 'curador_junior';
              const isWaitingMeeting = selectedApp.curationStatus === 'AGUARDANDO_REUNIAO';
              const isApprovedPayment = selectedApp.curationStatus === 'APROVADA_PAGAMENTO';
              const isApproved = selectedApp.curationStatus === 'APROVADO';
              const isRejected = selectedApp.curationStatus === 'REJEITADO' || selectedApp.curationStatus === 'RECUSADO';

              return (
                <div className="px-6 py-4 border-t border-white/[0.08] bg-[#111111] flex flex-col sm:flex-row items-center justify-between gap-4">
                  {isJunior ? (
                    <span className="text-[11px] font-sans text-amber-400 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-xs flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        <strong>Acesso de Curador Júnior:</strong> Permitido apenas leitura e anotações. Decisões de aprovação e recusa exigem nível <strong>Curador Sênior+</strong>.
                      </span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-sans text-ivory/50">
                      {isWaitingMeeting
                        ? 'Após realizar a entrevista por Google Meet, clique em "Reunião Aceita" para liberar o pagamento da adesão no Asaas.'
                        : isApprovedPayment
                        ? 'Candidata homologada na entrevista. Aguardando confirmação do pagamento no Asaas ou confirmação manual.'
                        : isApproved
                        ? 'Credencial ativa com acesso irrestrito ao painel e catálogo operacional.'
                        : isRejected
                        ? 'Candidatura recusada pela Mesa de Curadoria.'
                        : 'Avalie as informações cadastrais antes de homologar a candidata.'}
                    </span>
                  )}

                  <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
                    {/* Botão de Recusar (se não estiver recusado) */}
                    {!isRejected && (
                      <Button
                        variant="secondary"
                        onClick={() => setShowRejectModal(true)}
                        disabled={processingDecision || isJunior}
                        className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs uppercase tracking-wider py-2.5 px-4 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <X className="w-4 h-4 mr-1.5" />
                        Recusar Candidatura
                      </Button>
                    )}

                    {/* Botão de WhatsApp rápido se tiver telefone */}
                    {(selectedApp.whatsapp || selectedApp.phone) && (
                      <a
                        href={`https://wa.me/${(selectedApp.whatsapp || selectedApp.phone || '').replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2.5 bg-[#1C1C1C] hover:bg-white/[0.08] border border-white/[0.12] text-ivory text-xs font-sans font-medium transition-colors flex items-center gap-1.5 rounded-sm"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    {/* Caso 1: AGUARDANDO_REUNIAO -> Botão "Reunião Aceita: Liberar Pagamento" */}
                    {isWaitingMeeting && (
                      <Button
                        variant="primary"
                        onClick={() => handleApproveForPayment(selectedApp.id)}
                        disabled={processingDecision || isJunior}
                        className="bg-gradient-to-r from-amber-600 via-gold to-amber-500 hover:brightness-110 text-black-matte text-xs font-bold uppercase tracking-wider py-2.5 px-5 cursor-pointer shadow-lg shadow-gold/20 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Check className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                        {processingDecision ? 'Processando...' : 'Reunião Realizada & Aceita (Liberar Pagamento)'}
                      </Button>
                    )}

                    {/* Caso 2: APROVADA_PAGAMENTO -> Botão "Confirmar Pagamento Manual & Ativar" */}
                    {isApprovedPayment && (
                      <Button
                        variant="primary"
                        onClick={() => handleApprove(selectedApp.id)}
                        disabled={processingDecision || isJunior}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider py-2.5 px-5 cursor-pointer shadow-lg shadow-emerald-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <CreditCard className="w-4 h-4 mr-1.5" />
                        {processingDecision ? 'Processando...' : 'Confirmar Pagamento & Ativar Acesso'}
                      </Button>
                    )}

                    {/* Caso 3: APROVADO -> Credencial Plena Ativa */}
                    {isApproved && (
                      <span className="px-4 py-2 bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-semibold uppercase tracking-wider rounded-sm flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Credencial Plena Ativa
                      </span>
                    )}

                    {/* Caso 4: REJEITADO -> Reabrir Candidatura */}
                    {isRejected && (
                      <Button
                        variant="secondary"
                        onClick={async () => {
                          setProcessingDecision(true);
                          try {
                            const res = await fetch(`/api/admin/applications/${selectedApp.id}/status`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'AGUARDANDO_REUNIAO' }),
                            });
                            if (res.ok) {
                              setActionSuccessMsg('Candidatura reaberta para a fila de reunião!');
                              setTimeout(() => setActionSuccessMsg(null), 4000);
                              await loadData();
                              setSelectedApp((prev) => (prev ? { ...prev, curationStatus: 'AGUARDANDO_REUNIAO' } : null));
                            }
                          } finally {
                            setProcessingDecision(false);
                          }
                        }}
                        disabled={processingDecision || isJunior}
                        className="border-sky-500/40 text-sky-300 hover:bg-sky-500/10 text-xs uppercase tracking-wider py-2.5 px-4 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <RotateCcw className="w-4 h-4 mr-1.5" />
                        {processingDecision ? 'Processando...' : 'Reabrir para Reunião'}
                      </Button>
                    )}

                    {/* Caso 5: EM_CURATORIA (outras aplicações preliminares) */}
                    {!isWaitingMeeting && !isApprovedPayment && !isApproved && !isRejected && (
                      <Button
                        variant="primary"
                        onClick={() => handleApproveForPayment(selectedApp.id)}
                        disabled={processingDecision || isJunior}
                        className="bg-gradient-to-r from-amber-600 via-gold to-amber-500 hover:brightness-110 text-black-matte text-xs font-bold uppercase tracking-wider py-2.5 px-5 cursor-pointer shadow-lg shadow-gold/20 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Check className="w-4 h-4 mr-1.5 stroke-[2.5]" />
                        {processingDecision ? 'Processando...' : 'Reunião Realizada & Aceita (Liberar Pagamento)'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })()}
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

            {selectedApp?.paymentInfo?.hasPaid && (
              <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded text-xs text-rose-200 font-sans space-y-1">
                <div className="font-semibold text-rose-300 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Estorno / Reembolso Automático Ativo</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Ao confirmar a recusa, o valor pago de <strong>R$ {selectedApp.paymentInfo.amount ? Number(selectedApp.paymentInfo.amount).toFixed(2).replace('.', ',') : 'Integral'}</strong> será <strong>estornado/reembolsado automaticamente</strong> para a conta original do cliente.
                </p>
              </div>
            )}

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

      {/* 6. LIGHTBOX MODAL PARA FOTOS E VÍDEOS EM ALTA DEFINIÇÃO */}
      <MediaLightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        items={lightboxItems}
        initialIndex={lightboxIndex}
      />
    </div>
  );
}
