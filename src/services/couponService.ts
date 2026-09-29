import { pool, initDatabase, fallbackStore } from '@/lib/db';

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

export class CouponService {
  /**
   * Valida se o cupom existe, está ativo, dentro do prazo e do limite de usos,
   * calculando o abatimento e o valor final exato a pagar.
   */
  static async validateCoupon(
    rawCode: string | undefined | null,
    planPrice: number
  ): Promise<CouponValidationResult> {
    if (!rawCode || typeof rawCode !== 'string') {
      return { valid: false, message: 'Cupom inválido ou expirado.' };
    }

    const code = rawCode.trim().toUpperCase();
    if (!code) {
      return { valid: false, message: 'Cupom inválido ou expirado.' };
    }

    const price = Number(planPrice);
    if (isNaN(price) || price < 0) {
      return { valid: false, message: 'Preço do plano inválido para cálculo do cupom.' };
    }

    let coupon: CouponRecord | null = null;

    try {
      await initDatabase();
      const res = await pool.query(
        'SELECT id, code, discount_type, discount_value, active, max_uses, times_used, expires_at, created_at FROM coupons WHERE UPPER(code) = $1 LIMIT 1',
        [code]
      );
      if (res.rows.length > 0) {
        coupon = res.rows[0] as CouponRecord;
      }
    } catch (err) {
      console.warn('[CouponService] Falha na consulta PostgreSQL de cupom, usando fallbackStore:', err);
    }

    // Fallback de memória resiliente
    if (!coupon && fallbackStore.coupons.has(code)) {
      coupon = fallbackStore.coupons.get(code) as unknown as CouponRecord;
    }

    if (!coupon) {
      return { valid: false, message: 'Cupom inválido ou expirado.' };
    }

    // 1. Verifica se está ativo
    if (!coupon.active) {
      return { valid: false, message: 'Cupom inválido ou expirado.' };
    }

    // 2. Valida expiração temporal
    if (coupon.expires_at) {
      const expiresAt = new Date(coupon.expires_at).getTime();
      if (!isNaN(expiresAt) && expiresAt < Date.now()) {
        return { valid: false, message: 'Cupom inválido ou expirado.' };
      }
    }

    // 3. Valida limite de usos (se definido)
    if (coupon.max_uses !== null && coupon.max_uses !== undefined) {
      const maxUses = Number(coupon.max_uses);
      const timesUsed = Number(coupon.times_used || 0);
      if (maxUses > 0 && timesUsed >= maxUses) {
        return { valid: false, message: 'Cupom inválido ou expirado.' };
      }
    }

    // 4. Cálculo matemático do abatimento e preço final
    const discountValue = Number(coupon.discount_value);
    let discountAmount = 0;

    if (coupon.discount_type === 'percentage') {
      discountAmount = (price * discountValue) / 100;
    } else {
      discountAmount = Math.min(discountValue, price);
    }

    // Arredondamento preciso de 2 casas decimais para conciliação monetária
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
   * Incrementa o contador de utilizações (times_used) após a confirmação
   * da cobrança no gateway de pagamento.
   */
  static async incrementCouponUses(rawCode: string | undefined | null): Promise<boolean> {
    if (!rawCode || typeof rawCode !== 'string') return false;
    const code = rawCode.trim().toUpperCase();

    let updated = false;

    try {
      await initDatabase();
      const res = await pool.query(
        'UPDATE coupons SET times_used = times_used + 1 WHERE UPPER(code) = $1',
        [code]
      );
      if (res.rowCount && res.rowCount > 0) {
        updated = true;
      }
    } catch (err) {
      console.warn('[CouponService] Erro ao incrementar times_used no PostgreSQL:', err);
    }

    // Atualiza também no fallback de memória
    if (fallbackStore.coupons.has(code)) {
      const fb = fallbackStore.coupons.get(code);
      if (fb) {
        fb.times_used = Number(fb.times_used || 0) + 1;
        updated = true;
      }
    }

    return updated;
  }

  /**
   * Busca detalhes do cupom por código
   */
  static async getCoupon(rawCode: string): Promise<CouponRecord | null> {
    if (!rawCode) return null;
    const code = rawCode.trim().toUpperCase();

    try {
      await initDatabase();
      const res = await pool.query(
        'SELECT * FROM coupons WHERE UPPER(code) = $1 LIMIT 1',
        [code]
      );
      if (res.rows.length > 0) {
        return res.rows[0] as CouponRecord;
      }
    } catch (err) {
      console.warn('[CouponService] Erro ao buscar cupom no PostgreSQL:', err);
    }

    if (fallbackStore.coupons.has(code)) {
      return fallbackStore.coupons.get(code) as unknown as CouponRecord;
    }

    return null;
  }
}

