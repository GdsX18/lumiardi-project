'use client';

import React from 'react';
import Image from 'next/image';
import {
  AlertTriangle,
  Ban,
  Briefcase,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Play,
  Sparkles,
  TrendingUp,
  UserRound,
  Video,
  XCircle,
  ZoomIn,
  ShieldCheck,
} from 'lucide-react';
import type { PreInterviewAnswers } from '@/types';
import type { MediaItem } from '@/components/admin/MediaLightboxModal';
import { LUMIARDI_PLANS } from '@/lib/payments/plansConfig';
import type { PlanId } from '@/lib/payments/types';

export interface CandidateApplication {
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
  planId?: string | null;
  planBillingInterval?: string | null;
  /** Sala do Google Meet salva no último convite enviado */
  meetLink?: string | null;
  twoFactorEnabled?: boolean;
  kycSelfieUrl?: string | null;
  preInterview?: PreInterviewAnswers | null;
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
    address?: { country?: string; state?: string; city?: string } | null;
    photos?: Array<{ id: string; url: string; title: string }>;
    videoUrl?: string;
    bio?: string;
    hobbies?: string;
    exposureOpinion?: string;
    monthlyRevenueEstimate?: string | null;
    commissionRate?: string | null;
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

// ─── Helpers de dados ──────────────────────────────────────────────

const NOT_INFORMED = 'Não informado';

/** Placeholders gravados pelo backend ('-', 'Sob Consulta') contam como vazio. */
export function filled(value: unknown): value is string | number {
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'string') return false;
  const v = value.trim();
  return v !== '' && v !== '-' && v !== 'Sob Consulta' && v !== 'null' && v !== 'undefined';
}

function ageFrom(birthDate?: string): number | null {
  if (!filled(birthDate)) return null;
  const raw = String(birthDate).trim();
  let y: number, m: number, d: number;
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const br = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (iso) [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  else if (br) [d, m, y] = [Number(br[1]), Number(br[2]), Number(br[3])];
  else return null;
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age--;
  return age >= 0 && age < 120 ? age : null;
}

function formatDateBR(value?: string): string | null {
  if (!filled(value)) return null;
  const iso = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return iso ? `${iso[3]}/${iso[2]}/${iso[1]}` : String(value);
}

/** Converte @handle ou URL em link externo seguro (apenas http/https). */
function socialUrl(value: string, base?: string): string | null {
  const raw = value.trim();
  if (/^https?:\/\//i.test(raw)) {
    try {
      const u = new URL(raw);
      return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : null;
    } catch {
      return null;
    }
  }
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(raw) && !raw.startsWith('@')) return `https://${raw}`;
  if (!base) return null;
  const handle = raw.replace(/^@+/, '').replace(/^\/+|\/+$/g, '');
  return /^[\w.-]+$/.test(handle) ? `${base}${handle}` : null;
}

const SOCIAL_DEFS: Array<{ key: keyof NonNullable<PreInterviewAnswers['platforms']>; label: string; base?: string }> = [
  { key: 'instagram', label: 'Instagram', base: 'https://instagram.com/' },
  { key: 'twitter', label: 'X / Twitter', base: 'https://x.com/' },
  { key: 'onlyfans', label: 'OnlyFans', base: 'https://onlyfans.com/' },
  { key: 'privacy', label: 'Privacy', base: 'https://privacy.com.br/profile/' },
  { key: 'fatalModels', label: 'Fatal Models' },
  { key: 'fatalFans', label: 'Fatal Fans' },
  { key: 'other', label: 'Outra' },
];

/** Texto livre de limites vira badges quando é uma lista curta; senão fica como parágrafo. */
function splitList(text?: string): string[] | null {
  if (!filled(text)) return null;
  const parts = String(text)
    .split(/[\n;•]|,(?![^(]*\))/)
    .map((p) => p.replace(/^[-–\s]+/, '').trim())
    .filter(Boolean);
  if (parts.length < 2 || parts.length > 15 || parts.some((p) => p.length > 60)) return null;
  return parts;
}

function planLabel(app: CandidateApplication) {
  const planId = (app.paymentInfo?.planId || app.planId || '').toLowerCase();
  const interval = app.paymentInfo?.billingInterval || app.planBillingInterval || '';
  const def = planId ? LUMIARDI_PLANS[planId as PlanId] : undefined;
  const intervalLabel = interval === 'yearly' ? 'Anual' : interval === 'monthly' ? 'Mensal' : null;
  let price: string | null = null;
  if (app.paymentInfo?.amount) {
    price = `R$ ${Number(app.paymentInfo.amount).toFixed(2).replace('.', ',')}`;
  } else if (def && (interval === 'yearly' || interval === 'monthly')) {
    price = `R$ ${def.priceBRL[interval].toFixed(2).replace('.', ',')}/mês (tabela)`;
  }
  return { name: def?.name || (planId ? planId.toUpperCase() : null), intervalLabel, price };
}

// ─── Primitivas visuais ────────────────────────────────────────────

type Tone = 'gold' | 'rose' | 'sky' | 'neutral';

const TONE_STYLES: Record<Tone, { border: string; title: string; bg: string }> = {
  gold: { border: 'border-gold/30', title: 'text-gold', bg: 'bg-[#121110]' },
  rose: { border: 'border-rose-500/35', title: 'text-rose-300', bg: 'bg-[#140d0e]' },
  sky: { border: 'border-sky-500/35', title: 'text-sky-300', bg: 'bg-[#0c1117]' },
  neutral: { border: 'border-white/[0.08]', title: 'text-ivory/70', bg: 'bg-[#121212]' },
};

export function DossierSection({
  letter,
  title,
  icon: Icon,
  tone = 'gold',
  aside,
  children,
}: {
  letter?: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: Tone;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  const t = TONE_STYLES[tone];
  return (
    <section className={`border ${t.border} ${t.bg} rounded-sm`}>
      <header className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-white/[0.06]">
        <h3 className={`text-[10px] font-sans uppercase tracking-[0.2em] font-semibold flex items-center gap-2 ${t.title}`}>
          {letter && (
            <span className="w-5 h-5 inline-flex items-center justify-center border border-current/40 rounded-xs text-[10px] font-mono">
              {letter}
            </span>
          )}
          <Icon className="w-3.5 h-3.5" />
          {title}
        </h3>
        {aside}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Field({
  label,
  value,
  mono,
  accent,
  wide,
  children,
}: {
  label: string;
  value?: React.ReactNode;
  mono?: boolean;
  accent?: 'gold' | 'emerald' | 'rose';
  wide?: boolean;
  children?: React.ReactNode;
}) {
  const content = children ?? value;
  const empty = children === undefined && !(typeof value === 'number' || (typeof value === 'string' ? filled(value) : !!value));
  const color = accent === 'gold' ? 'text-gold' : accent === 'emerald' ? 'text-emerald-400' : accent === 'rose' ? 'text-rose-300' : 'text-ivory';
  return (
    <div className={`min-w-0 ${wide ? 'sm:col-span-2' : ''}`}>
      <dt className="text-[10px] uppercase tracking-wider text-ivory/45 font-sans">{label}</dt>
      <dd className={`mt-0.5 text-[13px] leading-snug break-words ${mono ? 'font-mono' : 'font-sans'} ${empty ? 'text-ivory/30 italic' : color}`}>
        {empty ? NOT_INFORMED : content}
      </dd>
    </div>
  );
}

function Chip({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'gold' | 'rose' | 'neutral' | 'emerald' | 'amber' }) {
  const styles = {
    gold: 'bg-gold/10 text-[#F5D77F] border-gold/35',
    rose: 'bg-rose-500/10 text-rose-200 border-rose-500/35',
    neutral: 'bg-white/[0.04] text-ivory/80 border-white/[0.12]',
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/35',
    amber: 'bg-amber-500/10 text-amber-200 border-amber-500/35',
  }[tone];
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded-xs text-[11px] font-sans ${styles}`}>{children}</span>;
}

function StatusPill({ ok, okText, failText, warn }: { ok: boolean; okText: string; failText: string; warn?: boolean }) {
  return ok ? (
    <span className="inline-flex items-center gap-1.5 text-emerald-300">
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {okText}
    </span>
  ) : (
    <span className={`inline-flex items-center gap-1.5 ${warn ? 'text-amber-300' : 'text-rose-300'}`}>
      {warn ? <AlertTriangle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />} {failText}
    </span>
  );
}

// ─── Dossiê ────────────────────────────────────────────────────────

export function CandidateDossier({
  app,
  onOpenMedia,
}: {
  app: CandidateApplication;
  onOpenMedia: (items: MediaItem[], index?: number) => void;
}) {
  const isAgency = app.role === 'agencia';
  const pre = app.preInterview || null;
  const prof = app.profile || {};
  const age = ageFrom(prof.birthDate);
  const plan = planLabel(app);
  const location = [prof.address?.city, prof.address?.state, prof.address?.country].filter(filled).join(', ');

  const platforms = { ...(pre?.platforms || {}) };
  if (!filled(platforms.instagram) && filled(prof.instagram)) platforms.instagram = prof.instagram;
  const socials = SOCIAL_DEFS.filter((s) => filled(platforms[s.key])).map((s) => ({
    ...s,
    handle: String(platforms[s.key]).trim(),
    url: socialUrl(String(platforms[s.key]), s.base),
  }));

  const limits = pre?.personalLimits;
  const limitItems = splitList(limits);
  const category = pre?.category || prof.category;
  const specialties = (prof.specialties || []).filter(filled);
  const hobbies = pre?.hobbies || prof.hobbies;
  const exposure = pre?.exposureOpinion || prof.exposureOpinion;
  const revenue = pre?.monthlyRevenueEstimate || prof.monthlyRevenueEstimate;
  const gender = pre?.gender === 'Outro' && filled(pre?.genderOther) ? pre.genderOther : pre?.gender || prof.gender;
  const measurements = prof.measurements;
  const hasMeasurements = !!measurements && Object.values(measurements).some(filled);

  return (
    <div className="space-y-4">
      {!isAgency && !pre && (
        <div className="flex items-start gap-2.5 p-3 border border-amber-500/30 bg-amber-950/25 rounded-sm text-[12px] text-amber-200/90 font-sans">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            Ficha de pré-entrevista não registrada para esta candidata (cadastro anterior ao arquivamento completo das respostas).
            Confirme limites, nicho e objetivos diretamente na entrevista.
          </span>
        </div>
      )}

      {/* A — Identificação & Redes */}
      <DossierSection
        letter="A"
        title={isAgency ? 'Identificação Institucional & Redes' : 'Identificação & Redes'}
        icon={UserRound}
        aside={
          !isAgency && age !== null ? (
            age >= 18 ? <Chip tone="emerald">{age} anos · Maior de idade</Chip> : <Chip tone="rose">{age} anos · MENOR DE IDADE</Chip>
          ) : undefined
        }
      >
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
          {isAgency ? (
            <>
              <Field label="Razão social / Agência" value={prof.corporateName || app.fullName} />
              <Field label="Responsável" value={prof.responsibleName || app.fullName} />
              <Field label="CNPJ" value={prof.cnpj || prof.documentNumber} mono />
            </>
          ) : (
            <>
              <Field label="Nome artístico" value={pre?.artisticName || prof.artisticName} accent="gold" />
              <Field label="Nome civil" value={app.fullName} />
              <Field label="Nascimento" value={formatDateBR(prof.birthDate) || undefined} mono />
              <Field label="Localização" value={location} />
              <Field label="Identidade de gênero" value={gender} />
              <Field label="Idiomas" value={pre?.languages?.length ? pre.languages.join(' · ') : undefined} />
            </>
          )}
          <Field label="E-mail" value={app.email} mono />
          <Field label="WhatsApp" value={app.whatsapp || app.phone} mono />
          {!isAgency && <Field label="CPF" value={prof.documentNumber} mono />}
        </dl>

        <div className="mt-4 pt-3 border-t border-white/[0.06]">
          <span className="text-[10px] uppercase tracking-wider text-ivory/45 font-sans block mb-2">Redes & plataformas</span>
          {socials.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {socials.map((s) =>
                s.url ? (
                  <a
                    key={s.key}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="group inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 border border-gold/30 bg-gold/[0.06] hover:bg-gold/15 hover:border-gold/60 rounded-xs text-[12px] font-sans transition-colors"
                  >
                    <span className="text-[10px] uppercase tracking-wider text-gold/70">{s.label}</span>
                    <span className="text-ivory group-hover:text-[#F5D77F]">{s.handle}</span>
                    <ExternalLink className="w-3 h-3 text-gold/60" />
                  </a>
                ) : (
                  <span
                    key={s.key}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-white/[0.12] bg-white/[0.03] rounded-xs text-[12px] font-sans"
                  >
                    <span className="text-[10px] uppercase tracking-wider text-ivory/45">{s.label}</span>
                    <span className="text-ivory/85">{s.handle}</span>
                  </span>
                )
              )}
            </div>
          ) : (
            <span className="text-[13px] text-ivory/30 italic font-sans">{NOT_INFORMED}</span>
          )}
        </div>
      </DossierSection>

      {/* B — Alinhamento Editorial & Limites (crítico) */}
      {!isAgency && (
        <DossierSection letter="B" title="Alinhamento Editorial & Limites" icon={ShieldCheck} tone="rose"
          aside={<span className="text-[10px] font-sans uppercase tracking-wider text-rose-300/80">Ler antes da chamada</span>}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 border border-rose-500/40 bg-rose-950/30 rounded-sm space-y-3">
              <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-rose-300 flex items-center gap-1.5">
                <Ban className="w-3.5 h-3.5" /> Limites inegociáveis — NÃO faz
              </span>
              {limitItems ? (
                <div className="flex flex-wrap gap-1.5">
                  {limitItems.map((item, i) => (
                    <Chip key={i} tone="rose">{item}</Chip>
                  ))}
                </div>
              ) : filled(limits) ? (
                <p className="text-[13px] leading-relaxed text-rose-100 font-sans whitespace-pre-line">{limits}</p>
              ) : (
                <p className="text-[13px] text-rose-200/40 italic font-sans">{NOT_INFORMED} — pergunte explicitamente na entrevista.</p>
              )}
              <dl className="pt-2 border-t border-rose-500/20">
                <Field label="Postura sobre exposição" value={exposure} />
              </dl>
            </div>

            <div className="p-3.5 border border-gold/30 bg-gold/[0.04] rounded-sm space-y-3">
              <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-gold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> O que pretende produzir
              </span>
              <div className="flex flex-wrap gap-1.5">
                {filled(category) ? <Chip tone="gold">{category}</Chip> : <span className="text-[13px] text-ivory/30 italic">{NOT_INFORMED}</span>}
                {specialties.map((s) => (
                  <Chip key={s} tone="neutral">{s}</Chip>
                ))}
              </div>
              <dl className="grid grid-cols-1 gap-3 pt-2 border-t border-gold/15">
                {filled(pre?.categoryOtherExplanation) && <Field label="Detalhe do nicho" value={pre.categoryOtherExplanation} />}
                <Field label="Hobbies & interesses" value={hobbies} />
                <Field label="Objetivo principal na Lumiardi" value={pre?.mainGoal} accent="gold" />
              </dl>
            </div>
          </div>
        </DossierSection>
      )}

      {/* C — Perfil Comercial & Financeiro */}
      <DossierSection
        letter="C"
        title="Perfil Comercial & Financeiro"
        icon={TrendingUp}
        aside={
          app.paymentInfo?.hasPaid ? (
            <Chip tone="emerald">✓ Pagamento confirmado</Chip>
          ) : (
            <Chip tone="amber">Pagamento pendente</Chip>
          )
        }
      >
        {!isAgency && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/[0.06] border border-white/[0.06] rounded-sm overflow-hidden mb-4">
            <div className="bg-[#0f0f0f] p-3">
              <span className="text-[10px] uppercase tracking-wider text-ivory/45 block">Hoje · faturamento declarado</span>
              <span className={`mt-1 block text-sm font-semibold ${filled(revenue) ? 'text-emerald-400' : 'text-ivory/30 italic font-normal'}`}>
                {filled(revenue) ? revenue : NOT_INFORMED}
              </span>
              {filled(pre?.conversionRateEstimate) && (
                <span className="text-[11px] text-ivory/50 block mt-0.5">Conversão estimada: {pre.conversionRateEstimate}</span>
              )}
            </div>
            <div className="bg-[#0f0f0f] p-3">
              <span className="text-[10px] uppercase tracking-wider text-ivory/45 block">Meta pretendida</span>
              <span className={`mt-1 block text-sm font-semibold ${filled(pre?.mainGoal) ? 'text-[#F5D77F]' : 'text-ivory/30 italic font-normal'}`}>
                {filled(pre?.mainGoal) ? pre.mainGoal : NOT_INFORMED}
              </span>
            </div>
            <div className="bg-[#0f0f0f] p-3">
              <span className="text-[10px] uppercase tracking-wider text-ivory/45 block">Plano de adesão</span>
              <span className={`mt-1 block text-sm font-semibold ${plan.name ? 'text-gold' : 'text-ivory/30 italic font-normal'}`}>
                {plan.name || NOT_INFORMED}
                {plan.intervalLabel && <span className="text-ivory/60 font-normal"> · {plan.intervalLabel}</span>}
              </span>
              {plan.price && <span className="text-[11px] text-ivory/50 block mt-0.5">{plan.price}</span>}
            </div>
          </div>
        )}

        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
          {isAgency ? (
            <>
              <Field label="Plano de adesão" value={plan.name ? `${plan.name}${plan.intervalLabel ? ` · ${plan.intervalLabel}` : ''}` : undefined} accent="gold" />
              <Field label="Valor" value={plan.price || undefined} accent="emerald" />
              <Field label="Comissão padrão" value={prof.commissionRate} />
            </>
          ) : (
            <>
              <Field label="Disponibilidade">
                {pre?.availability?.length ? (
                  <span className="flex flex-wrap gap-1.5">
                    {pre.availability.map((p) => (
                      <Chip key={p}>
                        <Clock className="w-3 h-3 text-ivory/50" /> {p}
                      </Chip>
                    ))}
                  </span>
                ) : undefined}
              </Field>
              <Field
                label="Filhos"
                value={pre?.hasChildren === undefined ? undefined : pre.hasChildren ? `Sim${pre.childrenCount ? ` (${pre.childrenCount})` : ''}` : 'Não'}
              />
              <Field
                label="Representação"
                value={
                  pre?.isRepresented === undefined
                    ? undefined
                    : pre.isRepresented
                    ? `Agenciada${filled(pre.representedAgencyName) ? ` · ${pre.representedAgencyName}` : ''}`
                    : 'Independente'
                }
              />
            </>
          )}
          {app.paymentInfo?.receiptNumber && <Field label="Recibo" value={app.paymentInfo.receiptNumber} mono />}
        </dl>
      </DossierSection>

      {/* D — Compliance, Biometria & Documento */}
      <DossierSection letter="D" title="Compliance · 18 U.S.C. § 2257" icon={FileText} tone="neutral">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[13px] font-medium text-ivory block truncate">
              {app.documentType || (isAgency ? 'Contrato Social & Cartão CNPJ' : 'Documento oficial de identificação')}
            </span>
            <span className="text-[11px] text-ivory/45 block truncate font-mono">{app.documentName || 'Arquivo não anexado'}</span>
          </div>
          {app.documentUrl ? (
            <button
              onClick={() =>
                onOpenMedia([{ url: app.documentUrl!, title: `Documento de Identificação - ${app.fullName}`, tag: 'Documento 2257' }])
              }
              className="shrink-0 px-3 py-1.5 bg-[#1C1C1C] hover:bg-gold hover:text-black-matte border border-gold/30 text-gold text-xs font-sans font-medium transition-colors flex items-center gap-1.5 rounded-sm cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" /> Inspecionar documento
            </button>
          ) : (
            <Chip tone="amber">Documento pendente de envio</Chip>
          )}
        </div>
        <div className="mt-3 pt-3 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-2 text-[12px] font-sans">
          <StatusPill ok={!!app.documentUrl} okText="Documento arquivado" failText="Sem documento" />
          {!isAgency && (
            <StatusPill
              ok={!!app.kycSelfieUrl || !!pre}
              okText={app.kycSelfieUrl ? 'Biometria (+18) arquivada' : 'Biometria (+18) validada no cadastro'}
              failText="Biometria sem registro"
              warn
            />
          )}
          <StatusPill ok={!!app.twoFactorEnabled} okText="2FA (TOTP) ativo" failText="2FA não ativado" warn />
        </div>
      </DossierSection>

      {/* Book: fotos, vídeo e medidas */}
      {!isAgency && (
        <DossierSection title="Book & Apresentação" icon={Briefcase} tone="neutral">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prof.photos && prof.photos.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {prof.photos.map((p, i) => (
                  <button
                    key={p.id || i}
                    type="button"
                    onClick={() =>
                      onOpenMedia(
                        prof.photos!.map((ph) => ({ url: ph.url, title: ph.title || `${app.fullName} - Ensaio`, tag: 'Ensaio' })),
                        i
                      )
                    }
                    className="relative aspect-[3/4] bg-black border border-white/[0.08] hover:border-gold/60 overflow-hidden rounded-sm cursor-pointer group"
                  >
                    <Image src={p.url} alt={p.title || `Foto ${i + 1}`} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-gold">
                      <ZoomIn className="w-5 h-5" />
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-5 border border-dashed border-white/[0.1] rounded-sm text-center text-[12px] text-ivory/40 flex flex-col items-center justify-center gap-1.5">
                <Eye className="w-4 h-4 text-ivory/25" /> Nenhuma foto anexada
              </div>
            )}

            {prof.videoUrl ? (
              <button
                type="button"
                onClick={() => onOpenMedia([{ url: prof.videoUrl!, title: `Vídeo de Apresentação - ${app.fullName}`, type: 'video' }])}
                className="relative aspect-video bg-black border border-gold/30 hover:border-gold overflow-hidden rounded-sm flex items-center justify-center group cursor-pointer"
              >
                <video src={prof.videoUrl} className="w-full h-full object-cover pointer-events-none" />
                <span className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="w-11 h-11 rounded-full bg-gold text-black-matte flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </span>
                </span>
              </button>
            ) : (
              <div className="p-5 border border-dashed border-white/[0.1] rounded-sm text-center text-[12px] text-ivory/40 flex flex-col items-center justify-center gap-1.5">
                <Video className="w-4 h-4 text-ivory/25" /> Nenhum vídeo de apresentação
              </div>
            )}
          </div>

          {hasMeasurements && (
            <dl className="mt-4 pt-3 border-t border-white/[0.06] grid grid-cols-3 sm:grid-cols-5 gap-x-4 gap-y-2">
              <Field label="Altura" value={filled(measurements!.height) ? `${measurements!.height} cm` : undefined} mono />
              <Field label="Peso" value={filled(measurements!.weight) ? `${measurements!.weight} kg` : undefined} mono />
              <Field label="Busto" value={filled(measurements!.bust) ? `${measurements!.bust} cm` : undefined} mono />
              <Field label="Cintura" value={filled(measurements!.waist) ? `${measurements!.waist} cm` : undefined} mono />
              <Field label="Quadril" value={filled(measurements!.hips) ? `${measurements!.hips} cm` : undefined} mono />
            </dl>
          )}
        </DossierSection>
      )}
    </div>
  );
}
