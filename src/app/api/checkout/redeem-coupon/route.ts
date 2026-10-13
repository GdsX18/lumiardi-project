import { NextRequest, NextResponse } from 'next/server';
import { CouponService } from '@/services/couponService';
import { StorageService } from '@/services/storageService';
import { requirePayableUser } from '@/lib/payments/checkoutGuard';
import { getPlan } from '@/lib/payments/plansConfig';
import type { PlanId } from '@/lib/payments/types';
import { sanitizeInput } from '@/lib/security';
import { SessionUser, setSessionCookie } from '@/lib/auth';
import { cache } from '@/lib/cache';
import { checkRateLimitPersistent, getClientIp } from '@/lib/security/rateLimiter';

/**
 * Resgate de cupom de período gratuito (trial_months / free_period).
 * Sem cobrança: assinatura + fatura de R$ 0,00 + histórico + liberação do acesso numa transação.
 */
export async function POST(request: NextRequest) {
  try {
    const limit = await checkRateLimitPersistent(`coupon:${getClientIp(request.headers)}`, {
      windowMs: 10 * 60 * 1000,
      maxRequests: 20,
    });
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Muitas tentativas. Aguarde alguns minutos.', code: 'rate_limited' }, { status: 429 });
    }

    // Identidade e aprovação da curadoria lidas da sessão assinada + banco (nunca do body)
    const guard = await requirePayableUser(request);
    if (!guard.ok) return guard.response;
    const { id: userId, role, session } = guard.user;

    const rawBody = await request.json().catch(() => ({}));
    const couponCode = typeof rawBody.couponCode === 'string' ? sanitizeInput(rawBody.couponCode) : '';
    const plan = getPlan(sanitizeInput(rawBody.planId) || '');
    if (!couponCode) {
      return NextResponse.json({ error: 'Informe o código do cupom.', code: 'coupon_invalid' }, { status: 400 });
    }

    // O plano precisa ser da categoria da conta (agência só ativa plano de agência)
    if ((role === 'agencia') !== (plan.category === 'agencias')) {
      return NextResponse.json(
        { error: 'Este plano não está disponível para o seu tipo de conta.', code: 'coupon_wrong_plan' },
        { status: 400 }
      );
    }

    const result = await CouponService.redeemFreePeriod({
      rawCode: couponCode,
      userId,
      role,
      planId: plan.id as PlanId,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.message, code: result.code }, { status: 400 });
    }

    await cache.delete(`sub:${userId}`).catch(() => {});

    const freeUntilLabel = result.freeUntil.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    try {
      await StorageService.createNotification({
        userId,
        title: 'Acesso Oficial Liberado — Período Gratuito Ativo',
        desc: `${result.message} Seu acesso ao Plano ${plan.name} está liberado até ${freeUntilLabel}.`,
        category: 'Pagamentos',
        type: 'success',
        link: '/dashboard',
        linkText: 'Acessar Meu Painel',
      });
    } catch (e) {
      console.warn('[Redeem Coupon] Erro ao criar notificação:', e);
    }

    const updatedSession: SessionUser = { ...session, curationStatus: 'APROVADO' };
    const response = NextResponse.json({
      success: true,
      subscription: result.subscription,
      couponCode: result.couponCode,
      freeUntil: result.freeUntil.toISOString(),
      planName: plan.name,
      amountPaid: 0,
      message: result.message,
    });
    setSessionCookie(response, updatedSession);
    return response;
  } catch (err) {
    console.error('[Redeem Coupon] Erro ao resgatar cupom:', err);
    const unavailable = err instanceof Error && err.message === 'DATABASE_UNAVAILABLE';
    return NextResponse.json(
      { error: 'Não foi possível ativar o período gratuito. Tente novamente.', code: unavailable ? 'service_unavailable' : 'generic' },
      { status: unavailable ? 503 : 500 }
    );
  }
}
