import { NextRequest, NextResponse } from 'next/server';
import { CouponService } from '@/services/couponService';
import { sanitizeInput } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawCode = typeof body.code === 'string' ? sanitizeInput(body.code) : '';
    const planPrice = Number(body.planPrice);

    if (!rawCode || isNaN(planPrice) || planPrice < 0) {
      return NextResponse.json(
        { valid: false, message: 'Cupom inválido ou expirado.' },
        { status: 400 }
      );
    }

    const result = await CouponService.validateCoupon(rawCode, planPrice);

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, message: result.message || 'Cupom inválido ou expirado.' },
        { status: 400 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[API validate-coupon] Erro ao validar cupom:', error);
    return NextResponse.json(
      { valid: false, message: 'Cupom inválido ou expirado.' },
      { status: 400 }
    );
  }
}

