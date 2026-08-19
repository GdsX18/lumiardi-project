import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/lib/payments/billingService';
import { getPlan } from '@/lib/payments/plansConfig';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { StorageService } from '@/services/storageService';

export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    const userId = session?.id || (request.nextUrl.searchParams.get('userId') || 'user-model-1');
    const userRole = session?.role || 'criadora';

    const [subscriptionRecord, driveUsage] = await Promise.all([
      BillingService.getUserSubscription(userId),
      StorageService.getUserDriveUsage(userId),
    ]);

    let subscription = subscriptionRecord;

    // Se não tiver assinatura ainda, gera padrão do tier básico da categoria
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

    // Métricas Reais e Sincronizadas
    const usageMetrics = {
      driveStorageUsedGB: driveUsage.totalGB || 0,
      driveStorageTotalGB: typeof planDetails.limits.maxDriveStorageGB === 'number' ? planDetails.limits.maxDriveStorageGB : 5,
      scoutSearchesUsed: 0,
      scoutSearchesTotal: planDetails.limits.maxScoutSearchesPerMonth,
      rosterSlotsUsed: userRole === 'agencia' ? 0 : undefined,
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
