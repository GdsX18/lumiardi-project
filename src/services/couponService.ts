import { pool, initDatabase } from '@/lib/db';

export interface CouponRecord {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  active: boolean;
  max_uses: number | null;
  times_used: number;
  expires_at: string | null;
  created_at: string;
}

export type CouponValidationResult =
  | {
      valid: true;
      code: string;
      discountType: 'percentage' | 'fixed';
      discountValue: number;
      discountAmount: number;
      finalPrice: number;
      message: string;
    }
  | {
      valid: false;
      message: string;
    };

const INVALID: CouponValidationResult = { valid: false, message: 'Cupom inválido ou expirado.' };

/** Valor mínimo cobrável após desconto (limite das operadoras). */
export const MIN_CHARGE_BRL = 5;

function normalizeCode(rawCode: string | undefined | null): string | null {
  if (!rawCode || typeof rawCode !== 'string') return null;
  const code = rawCode.trim().toUpperCase();
  return code && code.length <= 64 ? code : null;
}

export class CouponService {
  /**
   * Valida se o cupom existe, está ativo, dentro do prazo e do limite de usos,
   * calculando o abatimento e o valor final exato a pagar.
   */
  static async validateCoupon(
    rawCode: string | undefined | null,
    planPrice: number
  ): Promise<CouponValidationResult> {
    const code = normalizeCode(rawCode);
    if (!code) return INVALID;

    const price = Number(planPrice);
    if (!Number.isFinite(price) || price <= 0) {
      return { valid: false, message: 'Preço do plano inválido para cálculo do cupom.' };
    }

    await initDatabase();
    const res = await pool.query(
      'SELECT id, code, discount_type, discount_value, active, max_uses, times_used, expires_at, created_at FROM coupons WHERE UPPER(code) = $1 LIMIT 1',
      [code]
    );
    const coupon = (res.rows[0] as CouponRecord | undefined) || null;

    if (!coupon || !coupon.active) return INVALID;

    // Expiração
    if (coupon.expires_at) {
      const expiresAt = new Date(coupon.expires_at).getTime();
      if (!isNaN(expiresAt) && expiresAt < Date.now()) return INVALID;
    }

    // Limite de usos (NULL ou 0 = ilimitado)
    const maxUses = coupon.max_uses === null || coupon.max_uses === undefined ? 0 : Number(coupon.max_uses);
    if (maxUses > 0 && Number(coupon.times_used || 0) >= maxUses) return INVALID;

    // Valor do desconto precisa ser coerente: percentual em (0, 100], fixo > 0
    const discountValue = Number(coupon.discount_value);
    if (!Number.isFinite(discountValue) || discountValue <= 0) return INVALID;
    if (coupon.discount_type === 'percentage' && discountValue > 100) return INVALID;
    if (coupon.discount_type !== 'percentage' && coupon.discount_type !== 'fixed') return INVALID;

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
      message: 'Cupom aplicado com sucesso!',
    };
  }

  /**
   * Reserva atomicamente um uso do cupom, respeitando `max_uses` mesmo com checkouts concorrentes.
   * Retorna false se o cupom esgotou/expirou entre a validação e a cobrança.
   */
  static async reserveCouponUse(rawCode: string | undefined | null): Promise<boolean> {
    const code = normalizeCode(rawCode);
    if (!code) return false;
    await initDatabase();
    const res = await pool.query(
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
   * Busca detalhes do cupom por código
   */
  static async getCoupon(rawCode: string): Promise<CouponRecord | null> {
    const code = normalizeCode(rawCode);
    if (!code) return null;
    await initDatabase();
    const res = await pool.query('SELECT * FROM coupons WHERE UPPER(code) = $1 LIMIT 1', [code]);
    return (res.rows[0] as CouponRecord | undefined) || null;
  }
}
