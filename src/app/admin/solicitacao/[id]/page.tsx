'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldCheck,
  ArrowLeft,
  Mail,
  Phone,
  FileText,
  MapPin,
  Globe,
  Download,
  Check,
  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/applications/${id}`);
        if (res.ok) {
          const data = await res.json();
          setApp(data.application);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  const handleApprove = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/applications/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APROVADO' }),
      });
      if (res.ok) {
        setApp((prev: any) => ({ ...prev, curationStatus: 'APROVADO' }));
        setMsg('Credencial aprovada com sucesso!');
        setTimeout(() => setMsg(null), 4000);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/applications/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJEITADO', rejectionReason }),
      });
      if (res.ok) {
        setApp((prev: any) => ({ ...prev, curationStatus: 'REJEITADO', rejectionReason }));
        setShowRejectModal(false);
        setMsg('Credencial recusada com justificativa registrada.');
        setTimeout(() => setMsg(null), 4000);
      }
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070707] text-ivory flex items-center justify-center text-xs font-sans text-ivory/50">
        Carregando detalhes do protocolo...
      </div>
    );
  }

  if (!app) {
    return (
      <div className="min-h-screen bg-[#070707] text-ivory flex flex-col items-center justify-center p-6 space-y-4">
        <p className="text-sm text-ivory/70">Solicitação não encontrada.</p>
        <Link href="/admin" className="text-gold text-xs underline">
          Voltar para o Painel de Curadoria
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070707] text-ivory flex flex-col selection:bg-gold selection:text-black-matte">
      {/* Header */}
      <header className="border-b border-white/[0.08] bg-[#0A0A0A] px-6 py-4 flex items-center justify-between">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-xs font-sans text-ivory/60 hover:text-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Mesa de Curadoria</span>
        </Link>

        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-gold" />
          <span className="text-xs font-sans text-ivory/70">Protocolo #{app.id}</span>
        </div>
      </header>

      {msg && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-950 border border-emerald-500 text-emerald-300 px-4 py-2 text-xs font-sans rounded-sm">
          {msg}
        </div>
      )}

      {/* Conteúdo */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div>
            <h1 className="font-serif-lumiardi text-3xl font-light text-ivory">
              {app.fullName}
            </h1>
            <p className="text-xs text-ivory/50 font-sans mt-1">
              Submetido em {new Date(app.createdAt).toLocaleDateString('pt-BR')} • {app.email}
            </p>
          </div>

          <div>
            {app.curationStatus === 'APROVADO' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold uppercase tracking-wider rounded-xs">
                <CheckCircle2 className="w-4 h-4" /> Aprovado
              </span>
            ) : app.curationStatus === 'REJEITADO' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-semibold uppercase tracking-wider rounded-xs">
                <XCircle className="w-4 h-4" /> Recusado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-semibold uppercase tracking-wider rounded-xs">
                <Clock className="w-4 h-4" /> Em Curadoria
              </span>
            )}
          </div>
        </div>

        {/* Ficha */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#111111] border border-white/[0.08] rounded-sm space-y-1">
            <span className="text-[10px] text-ivory/40 uppercase">E-mail</span>
            <p className="text-xs text-ivory flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-gold" /> {app.email}
            </p>
          </div>

          <div className="p-4 bg-[#111111] border border-white/[0.08] rounded-sm space-y-1">
            <span className="text-[10px] text-ivory/40 uppercase">Telefone / WhatsApp</span>
            <p className="text-xs text-ivory flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-gold" /> {app.phone || '-'}
            </p>
          </div>

          <div className="p-4 bg-[#111111] border border-white/[0.08] rounded-sm space-y-1">
            <span className="text-[10px] text-ivory/40 uppercase">
              {app.role === 'agencia' ? 'CNPJ' : 'Documento / CPF'}
            </span>
            <p className="text-xs text-ivory flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-gold" /> {app.profile?.documentNumber || '-'}
            </p>
          </div>
        </div>

        {/* Informações Complementares */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-[#111111] border border-white/[0.08] rounded-sm space-y-1">
            <span className="text-[10px] text-ivory/40 uppercase">
              {app.role === 'agencia' ? 'Categoria / Atuação' : 'Categoria Artística'}
            </span>
            <p className="text-xs text-ivory">
              {app.profile?.category || (app.role === 'agencia' ? 'Agência de Casting & Modelos' : 'Modelo & Criadora VIP')}
            </p>
          </div>

          <div className="p-4 bg-[#111111] border border-white/[0.08] rounded-sm space-y-1">
            <span className="text-[10px] text-ivory/40 uppercase">Instagram</span>
            <p className="text-xs text-gold">
              {app.profile?.instagram || '-'}
            </p>
          </div>
        </div>

        {/* Documentos */}
        <div className="p-5 bg-[#111111] border border-gold/30 rounded-sm flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-ivory">
              {app.documentType || (app.role === 'agencia' ? 'Contrato Social & CNPJ' : 'Documento de Identificação')}
            </h3>
            <p className="text-xs text-ivory/50 mt-0.5">
              {app.documentName || (app.role === 'agencia' ? 'contrato_social_cnpj.pdf' : 'documento_identidade.pdf')}
            </p>
          </div>
          <button
            onClick={() => alert(`Visualizando documento de auditoria: ${app.documentName || 'Documento Oficial'}`)}
            className="px-4 py-2 bg-gold/10 hover:bg-gold text-gold hover:text-black-matte border border-gold/30 text-xs font-sans font-medium transition-colors flex items-center gap-2 rounded-sm cursor-pointer"
          >
            <Download className="w-4 h-4" /> Visualizar Documento
          </button>
        </div>

        {/* Mesa de Ações */}
        <div className="p-6 bg-[#111111] border border-white/[0.08] rounded-sm flex items-center justify-end gap-4">
          <Button
            variant="secondary"
            onClick={() => setShowRejectModal(true)}
            disabled={processing}
            className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs uppercase"
          >
            <X className="w-4 h-4 mr-1.5" /> Recusar Credencial
          </Button>

          <Button
            variant="primary"
            onClick={handleApprove}
            disabled={processing || app.curationStatus === 'APROVADO'}
            className="text-xs uppercase font-bold"
          >
            <Check className="w-4 h-4 mr-1.5" />
            {processing ? 'Processando...' : app.curationStatus === 'APROVADO' ? 'Já Aprovado' : 'Aprovar Credencial'}
          </Button>
        </div>
      </main>

      {/* Modal de Recusa */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-rose-500/40 p-6 max-w-md w-full space-y-4 rounded-sm">
            <h3 className="font-serif-lumiardi text-lg text-ivory">Recusar Credencial</h3>
            <textarea
              rows={4}
              placeholder="Justificativa da recusa..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full bg-[#181818] border border-white/[0.1] focus:border-rose-500 p-3 text-xs text-ivory outline-none rounded-sm"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-1.5 text-xs text-ivory/60"
              >
                Cancelar
              </button>
              <Button
                variant="secondary"
                onClick={handleReject}
                disabled={!rejectionReason.trim() || processing}
                className="bg-rose-600 hover:bg-rose-700 text-white border-none text-xs"
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
