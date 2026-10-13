import crypto from 'crypto';
import type { PoolClient } from 'pg';
import { pool, initDatabase, withTransaction } from '@/lib/db';
import { BillingService, DbExecutor } from '@/lib/payments/billingService';
import { getPlan, isPlanId, LUMIARDI_PLANS } from '@/lib/payments/plansConfig';
import type { BillingInterval, PlanId, SubscriptionRecord } from '@/lib/payments/types';

export type CouponDiscountType = 'percentage' | 'fixed' | 'trial_months' | 'free_period';
export type CouponTargetRole = 'agency' | 'creator' | 'all';

export const COUPON_DISCOUNT_TYPES: CouponDiscountType[] = ['percentage', 'fixed', 'trial_months', 'free_period'];
export const COUPON_TARGET_ROLES: CouponTargetRole[] = ['agency', 'creator', 'all'];

export interface CouponRecord {
  id: string;
  code: string;
  discount_type: CouponDiscountType;
  discount_value: number;
  active: boolean;
  max_uses: number | null;
  times_used: number;
  expires_at: string | null;
  target_role: CouponTargetRole;
  applicable_plan: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
}

/** Quem está aplicando o cupom: restrições de público e plano só valem com esse contexto. */
export interface CouponContext {
  planId: string;
  role: 'criadora' | 'agencia' | string;
}

export type CouponValidationResult =
  | {
      valid: true;
      code: string;
      discountType: CouponDiscountType;
      discountValue: number;
      discountAmount: number;
      finalPrice: number;
      /** true para trial_months/free_period: não há cobrança, o acesso é liberado via resgate */
      grantsFreePeriod: boolean;
      freeMonths?: number;
      freeDays?: number;
      message: string;
    }
  | {
      valid: false;
      message: string;
      code: 'coupon_invalid' | 'coupon_wrong_role' | 'coupon_wrong_plan';
    };

const INVALID: CouponValidationResult = { valid: false, message: 'Cupom inválido ou expirado.', code: 'coupon_invalid' };

/** Valor mínimo cobrável após desconto (limite das operadoras). */
export const MIN_CHARGE_BRL = 5;

const COUPON_COLUMNS =
  'id, code, discount_type, discount_value, active, max_uses, times_used, expires_at, target_role, applicable_plan, description, created_by, created_at, updated_at';

function normalizeCode(rawCode: string | undefined | null): string | null {
  if (!rawCode || typeof rawCode !== 'string') return null;
  const code = rawCode.trim().toUpperCase();
  return code && code.length <= 64 ? code : null;
}

function memberRoleToTarget(role: string): CouponTargetRole {
  return role === 'agencia' ? 'agency' : 'creator';
}

export function isFreePeriodType(type: string): type is 'trial_months' | 'free_period' {
  return type === 'trial_months' || type === 'free_period';
}

/** Fim do período gratuito a partir de `from` (meses de calendário para trial_months, dias para free_period). */
export function freePeriodEnd(type: 'trial_months' | 'free_period', value: number, from = new Date()): Date {
  const end = new Date(from.getTime());
  if (type === 'trial_months') end.setMonth(end.getMonth() + value);
  else end.setDate(end.getDate() + value);
  return end;
}

function describeFreePeriod(type: 'trial_months' | 'free_period', value: number): string {
  if (type === 'trial_months') return `${value} ${value === 1 ? 'mês' : 'meses'} grátis`;
  return `${value} ${value === 1 ? 'dia' : 'dias'} grátis`;
}

/**
 * Regra pura de validação (sem I/O): status, prazo, limite de usos, público e plano,
 * e cálculo do abatimento em centavos.
 */
function evaluateCoupon(coupon: CouponRecord | null, price: number, ctx: CouponContext): CouponValidationResult {
  if (!coupon || !coupon.active) return INVALID;

  if (coupon.expires_at) {
    const expiresAt = new Date(coupon.expires_at).getTime();
    if (!isNaN(expiresAt) && expiresAt < Date.now()) return INVALID;
  }

  // Limite de usos (NULL ou 0 = ilimitado)
  const maxUses = coupon.max_uses === null || coupon.max_uses === undefined ? 0 : Number(coupon.max_uses);
  if (maxUses > 0 && Number(coupon.times_used || 0) >= maxUses) return INVALID;

  const target = (coupon.target_role || 'all') as CouponTargetRole;
  if (target !== 'all' && target !== memberRoleToTarget(ctx.role)) {
    return {
      valid: false,
      code: 'coupon_wrong_role',
      message: target === 'agency' ? 'Este cupom é exclusivo para agências.' : 'Este cupom é exclusivo para criadoras.',
    };
  }

  // getPlan normaliza ids desconhecidos: compara com o plano que de fato será cobrado
  if (coupon.applicable_plan && coupon.applicable_plan !== getPlan(ctx.planId).id) {
    return {
      valid: false,
      code: 'coupon_wrong_plan',
      message: `Este cupom é válido apenas para o plano ${getPlan(coupon.applicable_plan).name}.`,
    };
  }

  const discountValue = Number(coupon.discount_value);
  if (!Number.isFinite(discountValue) || discountValue <= 0) return INVALID;
  if (!COUPON_DISCOUNT_TYPES.includes(coupon.discount_type)) return INVALID;
  if (coupon.discount_type === 'percentage' && discountValue > 100) return INVALID;

  if (isFreePeriodType(coupon.discount_type)) {
    if (!Number.isInteger(discountValue)) return INVALID;
    return {
      valid: true,
      code: coupon.code,
      discountType: coupon.discount_type,
      discountValue,
      discountAmount: Math.round(price * 100) / 100,
      finalPrice: 0,
      grantsFreePeriod: true,
      freeMonths: coupon.discount_type === 'trial_months' ? discountValue : undefined,
      freeDays: coupon.discount_type === 'free_period' ? discountValue : undefined,
      message: `Cupom aplicado: ${describeFreePeriod(coupon.discount_type, discountValue)} no plano ${getPlan(ctx.planId).name}!`,
    };
  }

  let discountAmount =
    coupon.discount_type === 'percentage' ? (price * discountValue) / 100 : Math.min(discountValue, price);

  // Arredondamento em centavos para conciliação monetária
  discountAmount = Math.round(discountAmount * 100) / 100;
  const finalPrice = Math.max(0, Math.round((price - discountAmount) * 100) / 100);

  return {
    valid: true,
    code: coupon.code,
    discountType: coupon.discount_type,
    discountValue,
    discountAmount,
    finalPrice,
    grantsFreePeriod: false,
    message: 'Cupom aplicado com sucesso!',
  };
}

async function findCoupon(code: string, db: DbExecutor = pool, forUpdate = false): Promise<CouponRecord | null> {
  const res = await db.query(
    `SELECT ${COUPON_COLUMNS} FROM coupons WHERE UPPER(code) = $1 LIMIT 1${forUpdate ? ' FOR UPDATE' : ''}`,
    [code]
  );
  return (res.rows[0] as CouponRecord | undefined) || null;
}

export interface CouponRedemptionInput {
  couponCode: string;
  userId: string;
  planId: string;
  billingInterval: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  currency?: string;
  subscriptionId?: string;
  /** Id da cobrança no gateway: torna o registro idempotente em reenvios de webhook */
  paymentReference?: string;
  freeUntil?: Date;
}

export interface CreateCouponInput {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  targetRole: CouponTargetRole;
  applicablePlan: string | null;
  maxUses: number | null;
  expiresAt: string | null;
  description: string | null;
}

export class CouponService {
  /**
   * Valida se o cupom existe, está ativo, dentro do prazo, do limite de usos, do público
   * (agência/criadora) e do plano, calculando o abatimento e o valor final exato a pagar.
   */
  static async validateCoupon(
    rawCode: string | undefined | null,
    planPrice: number,
    ctx: CouponContext
  ): Promise<CouponValidationResult> {
    const code = normalizeCode(rawCode);
    if (!code) return INVALID;

    const price = Number(planPrice);
    if (!Number.isFinite(price) || price <= 0) {
      return { valid: false, code: 'coupon_invalid', message: 'Preço do plano inválido para cálculo do cupom.' };
    }

    await initDatabase();
    return evaluateCoupon(await findCoupon(code), price, ctx);
  }

  /**
   * Reserva atomicamente um uso do cupom, respeitando `max_uses` mesmo com checkouts concorrentes.
   * Retorna false se o cupom esgotou/expirou entre a validação e a cobrança.
   */
  static async reserveCouponUse(rawCode: string | undefined | null, db: DbExecutor = pool): Promise<boolean> {
    const code = normalizeCode(rawCode);
    if (!code) return false;
    await initDatabase();
    const res = await db.query(
      `UPDATE coupons SET times_used = times_used + 1
       WHERE UPPER(code) = $1
         AND active = true
         AND (expires_at IS NULL OR expires_at > NOW())
         AND (max_uses IS NULL OR max_uses = 0 OR times_used < max_uses)
       RETURNING id`,
      [code]
    );
    return (res.rowCount ?? 0) > 0;
  }

  /** Devolve um uso reservado quando a cobrança não se concretiza. */
  static async releaseCouponUse(rawCode: string | undefined | null): Promise<void> {
    const code = normalizeCode(rawCode);
    if (!code) return;
    try {
      await pool.query(
        'UPDATE coupons SET times_used = GREATEST(times_used - 1, 0) WHERE UPPER(code) = $1',
        [code]
      );
    } catch (err) {
      console.error('[CouponService] Falha ao devolver uso do cupom:', err);
    }
  }

  /**
   * Registra um uso do cupom após pagamento confirmado por webhook (Pix/cripto).
   * O pagamento já ocorreu, então o uso é contabilizado mesmo que o limite tenha sido atingido.
   */
  static async incrementCouponUses(rawCode: string | undefined | null): Promise<boolean> {
    const code = normalizeCode(rawCode);
    if (!code) return false;
    try {
      await initDatabase();
      const res = await pool.query('UPDATE coupons SET times_used = times_used + 1 WHERE UPPER(code) = $1', [code]);
      return (res.rowCount ?? 0) > 0;
    } catch (err) {
      console.error('[CouponService] Erro ao incrementar times_used no PostgreSQL:', err);
      return false;
    }
  }

  /**
   * Grava o vínculo cupom ↔ conta ↔ assinatura no histórico de utilizações.
   * Idempotente por `paymentReference` (reenvio de webhook não duplica a linha).
   */
  static async recordRedemption(input: CouponRedemptionInput, db: DbExecutor = pool): Promise<void> {
    const code = normalizeCode(input.couponCode);
    if (!code) return;
    await db.query(
      `INSERT INTO coupon_redemptions (
         id, coupon_id, coupon_code, user_id, plan_id, billing_interval,
         original_amount, discount_amount, final_amount, currency, subscription_id, payment_reference, free_until
       )
       SELECT $1, c.id, c.code, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
       FROM coupons c WHERE UPPER(c.code) = $2
       ON CONFLICT DO NOTHING`,
      [
        `red_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        code,
        input.userId,
        input.planId,
        input.billingInterval,
        input.originalAmount,
        input.discountAmount,
        input.finalAmount,
        input.currency || 'BRL',
        input.subscriptionId || null,
        input.paymentReference || null,
        input.freeUntil ? input.freeUntil.toISOString() : null,
      ]
    );
  }

  /**
   * Resgata um cupom de período gratuito (trial_months/free_period): sem cobrança no gateway,
   * cria a assinatura com o período estendido, a fatura de R$ 0,00, o vínculo no histórico
   * e libera o acesso — tudo numa única transação, com o cupom travado (FOR UPDATE).
   */
  static async redeemFreePeriod(params: {
    rawCode: string;
    userId: string;
    role: string;
    planId: PlanId;
  }): Promise<
    | { ok: true; subscription: SubscriptionRecord; freeUntil: Date; couponCode: string; message: string }
    | { ok: false; code: string; message: string }
  > {
    const invalid = { ok: false as const, code: 'coupon_invalid', message: 'Cupom inválido ou expirado.' };
    const code = normalizeCode(params.rawCode);
    if (!code) return invalid;

    const plan = getPlan(params.planId);
    const billingInterval: BillingInterval = 'monthly';
    const listPrice = plan.priceBRL.monthly;

    return withTransaction(async (client: PoolClient) => {
      const coupon = await findCoupon(code, client, true);
      const evaluation = evaluateCoupon(coupon, listPrice, { planId: plan.id, role: params.role });
      if (!evaluation.valid) return { ok: false as const, code: evaluation.code, message: evaluation.message };
      if (!coupon || !evaluation.grantsFreePeriod || !isFreePeriodType(coupon.discount_type)) {
        return {
          ok: false as const,
          code: 'coupon_requires_payment',
          message: 'Este cupom concede desconto no pagamento, não período gratuito.',
        };
      }

      const already = await client.query(
        'SELECT 1 FROM coupon_redemptions WHERE coupon_id = $1 AND user_id = $2 AND free_until IS NOT NULL LIMIT 1',
        [coupon.id, params.userId]
      );
      if (already.rows.length > 0) {
        return {
          ok: false as const,
          code: 'coupon_already_redeemed',
          message: 'Este cupom de período gratuito já foi utilizado nesta conta.',
        };
      }

      if (!(await this.reserveCouponUse(code, client))) return invalid;

      const freeUntil = freePeriodEnd(coupon.discount_type, Number(coupon.discount_value));
      const periodLabel = describeFreePeriod(coupon.discount_type, Number(coupon.discount_value));
      const subscription = await BillingService.createOrRenewSubscription(
        {
          userId: params.userId,
          gateway: 'coupon',
          gatewaySubscriptionId: `coupon_${coupon.code}_${params.userId}`,
          planId: plan.id,
          planCategory: plan.category,
          billingInterval,
          amount: 0,
          currency: 'BRL',
          periodEnd: freeUntil,
          billingReason: `Período gratuito — Plano ${plan.name} (${periodLabel}) — Cupom ${coupon.code}`,
          metadata: {
            couponCode: coupon.code,
            couponType: coupon.discount_type,
            couponValue: Number(coupon.discount_value),
            freeUntil: freeUntil.toISOString(),
            listPriceMonthly: listPrice,
          },
        },
        client
      );

      await this.recordRedemption(
        {
          couponCode: coupon.code,
          userId: params.userId,
          planId: plan.id,
          billingInterval,
          originalAmount: listPrice,
          discountAmount: listPrice,
          finalAmount: 0,
          subscriptionId: subscription.id,
          freeUntil,
        },
        client
      );

      // Só promove quem a curadoria aprovou para pagamento (ou renovação de membro)
      await client.query(
        `UPDATE users SET curation_status = 'APROVADO', updated_at = NOW()
         WHERE id = $1 AND curation_status IN ('APROVADA_PAGAMENTO', 'APROVADO')`,
        [params.userId]
      );

      return {
        ok: true as const,
        subscription,
        freeUntil,
        couponCode: coupon.code,
        message: `Plano ${plan.name} liberado: ${periodLabel} com o cupom ${coupon.code}.`,
      };
    });
  }

  /**
   * Busca detalhes do cupom por código
   */
  static async getCoupon(rawCode: string): Promise<CouponRecord | null> {
    const code = normalizeCode(rawCode);
    if (!code) return null;
    await initDatabase();
    return findCoupon(code);
  }

  // ─── Gestão (Portal da Curadoria) ──────────────────────────────────────────

  static async listCoupons(): Promise<(CouponRecord & { redemptions: number; last_redeemed_at: string | null })[]> {
    await initDatabase();
    const res = await pool.query(
      `SELECT ${COUPON_COLUMNS.split(', ').map((c) => `c.${c}`).join(', ')},
              COUNT(r.id)::int AS redemptions, MAX(r.created_at) AS last_redeemed_at
       FROM coupons c LEFT JOIN coupon_redemptions r ON r.coupon_id = c.id
       GROUP BY c.id
       ORDER BY c.active DESC, c.created_at DESC`
    );
    return res.rows.map((r) => ({
      ...r,
      discount_value: Number(r.discount_value),
      max_uses: r.max_uses === null ? null : Number(r.max_uses),
      times_used: Number(r.times_used || 0),
    }));
  }

  static async listRedemptions(limit = 200) {
    await initDatabase();
    const res = await pool.query(
      `SELECT r.id, r.coupon_code, r.user_id, u.full_name AS user_name, u.email AS user_email, u.role AS user_role,
              r.plan_id, r.billing_interval, r.original_amount, r.discount_amount, r.final_amount, r.currency,
              r.subscription_id, r.free_until, r.created_at
       FROM coupon_redemptions r LEFT JOIN users u ON u.id = r.user_id
       ORDER BY r.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return res.rows.map((r) => ({
      ...r,
      original_amount: Number(r.original_amount || 0),
      discount_amount: Number(r.discount_amount || 0),
      final_amount: Number(r.final_amount || 0),
    }));
  }

  /** Valida a entrada do formulário da Curadoria; devolve mensagem de erro ou null. */
  static validateCouponInput(input: CreateCouponInput): string | null {
    if (!/^[A-Z0-9_-]{3,40}$/.test(input.code)) {
      return 'O código deve ter de 3 a 40 caracteres: letras, números, hífen ou sublinhado.';
    }
    if (!COUPON_DISCOUNT_TYPES.includes(input.discountType)) return 'Tipo de desconto inválido.';
    if (!COUPON_TARGET_ROLES.includes(input.targetRole)) return 'Público-alvo inválido.';
    const v = input.discountValue;
    if (!Number.isFinite(v) || v <= 0) return 'Informe um valor de desconto maior que zero.';
    if (input.discountType === 'percentage' && v > 100) return 'O percentual não pode passar de 100%.';
    if (input.discountType === 'trial_months' && (!Number.isInteger(v) || v > 24)) {
      return 'Meses grátis: informe um número inteiro de 1 a 24.';
    }
    if (input.discountType === 'free_period' && (!Number.isInteger(v) || v > 730)) {
      return 'Dias grátis: informe um número inteiro de 1 a 730.';
    }
    if (input.applicablePlan) {
      const plan = isPlanId(input.applicablePlan) ? LUMIARDI_PLANS[input.applicablePlan] : undefined;
      if (!plan) return 'Plano inválido.';
      if (input.targetRole === 'agency' && plan.category !== 'agencias') return 'Esse plano não é um plano de agência.';
      if (input.targetRole === 'creator' && plan.category !== 'criadoras') return 'Esse plano não é um plano de criadora.';
    }
    if (input.maxUses !== null && (!Number.isInteger(input.maxUses) || input.maxUses < 1)) {
      return 'Limite de usos deve ser um número inteiro positivo (ou vazio para ilimitado).';
    }
    if (input.expiresAt && isNaN(new Date(input.expiresAt).getTime())) return 'Data de expiração inválida.';
    return null;
  }

  static async createCoupon(input: CreateCouponInput, createdBy: string): Promise<CouponRecord> {
    await initDatabase();
    const res = await pool.query(
      `INSERT INTO coupons (id, code, discount_type, discount_value, active, max_uses, times_used, expires_at,
                            target_role, applicable_plan, description, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, true, $5, 0, $6, $7, $8, $9, $10, NOW(), NOW())
       RETURNING ${COUPON_COLUMNS}`,
      [
        `coupon-${crypto.randomBytes(6).toString('hex')}`,
        input.code,
        input.discountType,
        input.discountValue,
        input.maxUses,
        input.expiresAt,
        input.targetRole,
        input.applicablePlan,
        input.description,
        createdBy,
      ]
    );
    return res.rows[0] as CouponRecord;
  }

  /** Ativa/desativa e ajusta limite de usos e validade (código, tipo e valor ficam imutáveis). */
  static async updateCoupon(
    id: string,
    patch: { active?: boolean; maxUses?: number | null; expiresAt?: string | null }
  ): Promise<CouponRecord | null> {
    await initDatabase();
    const sets: string[] = [];
    const values: unknown[] = [];
    if (typeof patch.active === 'boolean') {
      values.push(patch.active);
      sets.push(`active = $${values.length}`);
    }
    if (patch.maxUses !== undefined) {
      values.push(patch.maxUses);
      sets.push(`max_uses = $${values.length}`);
    }
    if (patch.expiresAt !== undefined) {
      values.push(patch.expiresAt);
      sets.push(`expires_at = $${values.length}`);
    }
    if (sets.length === 0) return null;
    values.push(id);
    const res = await pool.query(
      `UPDATE coupons SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING ${COUPON_COLUMNS}`,
      values
    );
    return (res.rows[0] as CouponRecord | undefined) || null;
  }
}
