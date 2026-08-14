import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/lib/payments/billingService';
import { getPlan } from '@/lib/payments/plansConfig';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    const userId = session?.id || (request.nextUrl.searchParams.get('userId') || 'user-model-1');
    const userRole = session?.role || 'criadora';

    let subscription = await BillingService.getUserSubscription(userId);

    // Se não tiver assinatura ainda, gera padrão de degustação (Trial/Glow)
    if (!subscription) {
      const defaultPlanId = userRole === 'agencia' ? 'select' : 'glow';
      const plan = getPlan(defaultPlanId);

      subscription = {
        id: `sub_default_${userId}`,
        userId,
        gateway: 'ccbill',
        planId: plan.id,
        planCategory: plan.category,
        status: 'active',
        billingInterval: 'monthly',
        amount: userRole === 'agencia' ? plan.priceBRL.monthly : plan.priceBRL.monthly,
        currency: 'BRL',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const planDetails = getPlan(subscription.planId);

    // Métricas de uso e limites
    const usageMetrics = {
      driveStorageUsedGB: userRole === 'agencia' ? 14.2 : 3.8,
      driveStorageTotalGB: planDetails.limits.maxDriveStorageGB,
      scoutSearchesUsed: 12,
      scoutSearchesTotal: planDetails.limits.maxScoutSearchesPerMonth,
      rosterSlotsUsed: userRole === 'agencia' ? 3 : undefined,
      rosterSlotsTotal: userRole === 'agencia' ? planDetails.limits.maxRosterSlots : undefined,
    };

    return NextResponse.json({
      success: true,
      subscription,
      plan: planDetails,
      usageMetrics,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao obter dados de assinatura';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
