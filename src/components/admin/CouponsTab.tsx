'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Ticket,
  Plus,
  RefreshCw,
  X,
  CheckCircle2,
  AlertTriangle,
  Gift,
  Percent,
  History,
  Power,
  Shuffle,
  Building2,
  Users,
} from 'lucide-react';
import { LUMIARDI_PLANS } from '@/lib/payments/plansConfig';

type DiscountType = 'percentage' | 'fixed' | 'trial_months' | 'free_period';
type TargetRole = 'agency' | 'creator' | 'all';

interface CouponRow {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  active: boolean;
  max_uses: number | null;
  times_used: number;
  expires_at: string | null;
  target_role: TargetRole;
  applicable_plan: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
  redemptions: number;
  last_redeemed_at: string | null;
}

interface RedemptionRow {
  id: string;
  coupon_code: string;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  user_role: string | null;
  plan_id: string | null;
  billing_interval: string | null;
  original_amount: number;
  discount_amount: number;
  final_amount: number;
  currency: string;
  free_until: string | null;
  created_at: string;
}

const TYPE_LABEL: Record<DiscountType, string> = {
  percentage: 'Percentual (%)',
  fixed: 'Valor fixo (R$)',
  trial_months: 'Meses grátis',
  free_period: 'Dias grátis',
};

const TARGET_LABEL: Record<TargetRole, string> = {
  agency: 'Agências',
  creator: 'Criadoras',
  all: 'Todos',
};

const PLAN_OPTIONS = Object.values(LUMIARDI_PLANS).map((p) => ({ id: p.id, name: p.name, category: p.category }));

function benefitLabel(type: DiscountType, value: number): string {
  switch (type) {
    case 'percentage':
      return `${value}% OFF`;
    case 'fixed':
      return `- R$ ${value.toFixed(2).replace('.', ',')}`;
    case 'trial_months':
      return `${value} ${value === 1 ? 'mês' : 'meses'} grátis`;
    case 'free_period':
      return `${value} ${value === 1 ? 'dia' : 'dias'} grátis`;
  }
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function randomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = 'LUM';
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

const EMPTY_FORM = {
  code: '',
  discountType: 'trial_months' as DiscountType,
  discountValue: '3',
  targetRole: 'agency' as TargetRole,
  applicablePlan: 'select',
  maxUses: '',
  expiresAt: '',
  description: '',
};

const inputClass =
  'w-full bg-[#181818] border border-white/15 focus:border-gold px-3 py-2 text-xs text-ivory outline-none rounded-xs';
const labelClass = 'block text-[11px] font-sans text-ivory/70 uppercase tracking-wider mb-1';

export const CouponsTab: React.FC = () => {
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionRow[]>([]);
  const [canManage, setCanManage] = useState(false);
  // Referência de "agora" para status Expirado (Date.now no render é impuro)
  const [loadedAt, setLoadedAt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/coupons');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erro ao carregar cupons.');
      setCoupons(data.coupons || []);
      setRedemptions(data.redemptions || []);
      setCanManage(Boolean(data.canManage));
      setLoadedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha na comunicação com o servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const visibleCoupons = useMemo(
    () => (showInactive ? coupons : coupons.filter((c) => c.active)),
    [coupons, showInactive]
  );

  const stats = useMemo(
    () => ({
      active: coupons.filter((c) => c.active).length,
      freePeriod: coupons.filter((c) => c.active && (c.discount_type === 'trial_months' || c.discount_type === 'free_period')).length,
      uses: coupons.reduce((sum, c) => sum + (c.times_used || 0), 0),
    }),
    [coupons]
  );

  const plansForTarget = PLAN_OPTIONS.filter((p) =>
    form.targetRole === 'all' ? true : form.targetRole === 'agency' ? p.category === 'agencias' : p.category === 'criadoras'
  );

  const valueSuffix =
    form.discountType === 'percentage' ? '%' : form.discountType === 'fixed' ? 'R$' : form.discountType === 'trial_months' ? 'meses' : 'dias';

  const openModal = () => {
    setForm({ ...EMPTY_FORM, code: randomCode() });
    setFormError(null);
    setShowModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          discountType: form.discountType,
          discountValue: Number(form.discountValue.replace(',', '.')),
          targetRole: form.targetRole,
          applicablePlan: form.applicablePlan || null,
          maxUses: form.maxUses,
          expiresAt: form.expiresAt,
          description: form.description,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erro ao criar cupom.');
      setShowModal(false);
      flash(`Cupom ${data.coupon?.code || form.code} criado com sucesso.`);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro inesperado ao salvar.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (coupon: CouponRow) => {
    setTogglingId(coupon.id);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: coupon.id, active: !coupon.active }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erro ao atualizar cupom.');
      flash(`Cupom ${coupon.code} ${coupon.active ? 'desativado' : 'reativado'}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar cupom.');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-lumiardi text-2xl text-ivory flex items-center gap-2">
            <Ticket className="w-5 h-5 text-gold" />
            Gestão de Cupons & Parcerias
          </h2>
          <p className="text-xs text-ivory/60 font-sans mt-1">
            Emita cupons de desconto ou de período gratuito por público e plano. Todo uso fica registrado no histórico.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            title="Atualizar"
            className="p-2 bg-[#121212] hover:bg-white/[0.06] border border-white/[0.1] text-ivory/60 hover:text-gold rounded-sm transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {canManage && (
            <button
              onClick={openModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-gold text-black-matte text-xs font-sans uppercase tracking-widest font-bold rounded-sm shadow-md shadow-gold/20 hover:brightness-110 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Criar Novo Cupom
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-sans flex items-center gap-2 rounded-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-sans flex items-center gap-2 rounded-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Cupons ativos', value: stats.active, icon: Ticket },
          { label: 'Períodos gratuitos ativos', value: stats.freePeriod, icon: Gift },
          { label: 'Utilizações totais', value: stats.uses, icon: History },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="p-4 bg-[#121212] border border-white/[0.08] rounded-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gold/10 border border-gold/30 text-gold flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <div className="font-serif-lumiardi text-2xl text-ivory leading-none">{value}</div>
              <div className="text-[10px] uppercase tracking-widest text-ivory/50 mt-1">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Lista de cupons */}
      <div className="bg-[#0D0D0D] border border-white/[0.08] rounded-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
          <span className="text-[11px] uppercase tracking-widest text-ivory/70 font-sans">
            {showInactive ? 'Todos os cupons' : 'Cupons ativos'}
          </span>
          <label className="flex items-center gap-2 text-[11px] text-ivory/60 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="accent-[#D4AF37]"
            />
            Mostrar inativos
          </label>
        </div>

        {loading && coupons.length === 0 ? (
          <div className="p-8 text-center text-xs text-ivory/50">Carregando cupons...</div>
        ) : visibleCoupons.length === 0 ? (
          <div className="p-8 text-center text-xs text-ivory/50">Nenhum cupom {showInactive ? 'cadastrado' : 'ativo'}.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-sans">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-ivory/50 border-b border-white/[0.06]">
                  <th className="px-4 py-2.5 font-medium">Código</th>
                  <th className="px-4 py-2.5 font-medium">Benefício</th>
                  <th className="px-4 py-2.5 font-medium">Público / Plano</th>
                  <th className="px-4 py-2.5 font-medium">Usos</th>
                  <th className="px-4 py-2.5 font-medium">Validade</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  {canManage && <th className="px-4 py-2.5 font-medium text-right">Ações</th>}
                </tr>
              </thead>
              <tbody>
                {visibleCoupons.map((c) => {
                  const isFree = c.discount_type === 'trial_months' || c.discount_type === 'free_period';
                  const expired = c.expires_at ? new Date(c.expires_at).getTime() < loadedAt : false;
                  const exhausted = c.max_uses ? c.times_used >= c.max_uses : false;
                  return (
                    <tr key={c.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] align-top">
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold tracking-wider text-gold">{c.code}</div>
                        {c.description && <div className="text-[11px] text-ivory/50 mt-0.5 max-w-[260px]">{c.description}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs border text-[10px] uppercase tracking-wider font-semibold ${
                            isFree
                              ? 'bg-gold/10 border-gold/40 text-[#F5D77F]'
                              : 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300'
                          }`}
                        >
                          {isFree ? <Gift className="w-3 h-3" /> : <Percent className="w-3 h-3" />}
                          {benefitLabel(c.discount_type, c.discount_value)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ivory/80">
                        <div className="flex items-center gap-1.5">
                          {c.target_role === 'agency' ? (
                            <Building2 className="w-3 h-3 text-ivory/50" />
                          ) : (
                            <Users className="w-3 h-3 text-ivory/50" />
                          )}
                          {TARGET_LABEL[c.target_role] || 'Todos'}
                        </div>
                        <div className="text-[11px] text-ivory/50 mt-0.5">
                          {c.applicable_plan ? LUMIARDI_PLANS[c.applicable_plan as keyof typeof LUMIARDI_PLANS]?.name || c.applicable_plan : 'Qualquer plano'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ivory/80 font-mono">
                        {c.times_used} / {c.max_uses ?? '∞'}
                      </td>
                      <td className="px-4 py-3 text-ivory/70">{c.expires_at ? formatDate(c.expires_at) : 'Sem expiração'}</td>
                      <td className="px-4 py-3">
                        {!c.active ? (
                          <span className="text-[10px] uppercase tracking-wider text-ivory/40">Inativo</span>
                        ) : expired ? (
                          <span className="text-[10px] uppercase tracking-wider text-amber-400">Expirado</span>
                        ) : exhausted ? (
                          <span className="text-[10px] uppercase tracking-wider text-amber-400">Esgotado</span>
                        ) : (
                          <span className="text-[10px] uppercase tracking-wider text-emerald-400">Ativo</span>
                        )}
                      </td>
                      {canManage && (
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleToggle(c)}
                            disabled={togglingId === c.id}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] border rounded-xs transition-colors cursor-pointer disabled:opacity-50 ${
                              c.active
                                ? 'text-ivory/60 border-white/10 hover:text-rose-400 hover:border-rose-400/40'
                                : 'text-gold border-gold/30 hover:bg-gold/10'
                            }`}
                          >
                            <Power className="w-3 h-3" />
                            {c.active ? 'Desativar' : 'Reativar'}
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

      {/* Histórico de utilizações */}
      <div className="bg-[#0D0D0D] border border-white/[0.08] rounded-sm">
        <div className="px-4 py-3 border-b border-white/[0.08] flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-gold" />
          <span className="text-[11px] uppercase tracking-widest text-ivory/70 font-sans">Histórico de utilizações</span>
        </div>
        {redemptions.length === 0 ? (
          <div className="p-8 text-center text-xs text-ivory/50">Nenhuma utilização registrada ainda.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-sans">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-ivory/50 border-b border-white/[0.06]">
                  <th className="px-4 py-2.5 font-medium">Data</th>
                  <th className="px-4 py-2.5 font-medium">Cupom</th>
                  <th className="px-4 py-2.5 font-medium">Conta</th>
                  <th className="px-4 py-2.5 font-medium">Plano</th>
                  <th className="px-4 py-2.5 font-medium">Desconto</th>
                  <th className="px-4 py-2.5 font-medium">Valor pago</th>
                  <th className="px-4 py-2.5 font-medium">Grátis até</th>
                </tr>
              </thead>
              <tbody>
                {redemptions.map((r) => (
                  <tr key={r.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-ivory/70">{formatDate(r.created_at)}</td>
                    <td className="px-4 py-3 font-mono text-gold">{r.coupon_code}</td>
                    <td className="px-4 py-3">
                      <div className="text-ivory/90">{r.user_name || '—'}</div>
                      <div className="text-[11px] text-ivory/50">{r.user_email || r.user_id || 'Conta removida'}</div>
                    </td>
                    <td className="px-4 py-3 text-ivory/80">
                      {r.plan_id ? LUMIARDI_PLANS[r.plan_id as keyof typeof LUMIARDI_PLANS]?.name || r.plan_id : '—'}
                    </td>
                    <td className="px-4 py-3 text-emerald-400">- {formatBRL(r.discount_amount)}</td>
                    <td className="px-4 py-3 text-ivory/80">{formatBRL(r.final_amount)}</td>
                    <td className="px-4 py-3 text-ivory/70">{r.free_until ? formatDate(r.free_until) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Criar Novo Cupom */}
      {showModal && (
        <div
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-[#111111] border border-gold/40 p-6 md:p-8 max-w-lg w-full shadow-2xl rounded-sm space-y-5 text-ivory max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-gold" />
                <h3 className="font-serif-lumiardi text-xl text-ivory">Criar Novo Cupom</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-ivory/50 hover:text-gold cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className={labelClass}>Código do cupom</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    maxLength={40}
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })}
                    className={`${inputClass} font-mono tracking-wider uppercase`}
                  />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, code: randomCode() })}
                    title="Gerar código aleatório"
                    className="px-3 bg-[#181818] border border-white/15 hover:border-gold text-ivory/60 hover:text-gold rounded-xs cursor-pointer"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Tipo de benefício</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => {
                      const discountType = e.target.value as DiscountType;
                      const defaults: Record<DiscountType, string> = { percentage: '10', fixed: '50', trial_months: '3', free_period: '30' };
                      setForm({ ...form, discountType, discountValue: defaults[discountType] });
                    }}
                    className={`${inputClass} cursor-pointer`}
                  >
                    {(Object.keys(TYPE_LABEL) as DiscountType[]).map((type) => (
                      <option key={type} value={type}>
                        {TYPE_LABEL[type]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Valor ({valueSuffix})</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value.replace(/[^\d.,]/g, '') })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Público</label>
                  <select
                    value={form.targetRole}
                    onChange={(e) => {
                      const targetRole = e.target.value as TargetRole;
                      const planStillValid = PLAN_OPTIONS.some(
                        (p) =>
                          p.id === form.applicablePlan &&
                          (targetRole === 'all' || (targetRole === 'agency' ? p.category === 'agencias' : p.category === 'criadoras'))
                      );
                      setForm({ ...form, targetRole, applicablePlan: planStillValid ? form.applicablePlan : '' });
                    }}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="agency">Agências</option>
                    <option value="creator">Criadoras</option>
                    <option value="all">Todos</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Plano específico</label>
                  <select
                    value={form.applicablePlan}
                    onChange={(e) => setForm({ ...form, applicablePlan: e.target.value })}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="">Qualquer plano</option>
                    {plansForTarget.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Limite de usos</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Ilimitado"
                    value={form.maxUses}
                    onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Expira em</label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    className={`${inputClass} [color-scheme:dark]`}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Descrição interna (parceria / origem)</label>
                <input
                  type="text"
                  maxLength={300}
                  placeholder="Ex: Parceria Agência X — campanha de lançamento"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={inputClass}
                />
              </div>

              {(form.discountType === 'trial_months' || form.discountType === 'free_period') && (
                <p className="text-[11px] text-ivory/50 leading-relaxed bg-gold/5 border border-gold/20 p-2.5 rounded-xs">
                  Cupom de período gratuito: no checkout não há cobrança. O acesso é liberado imediatamente pelo período
                  definido (uma vez por conta) e fica registrado com fatura de R$ 0,00.
                </p>
              )}

              {formError && (
                <div className="p-2.5 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 rounded-xs">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs text-ivory/70 border border-white/15 hover:text-ivory rounded-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gold text-black-matte text-xs uppercase tracking-widest font-bold rounded-xs hover:brightness-110 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Salvando...' : 'Criar Cupom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
