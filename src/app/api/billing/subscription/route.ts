import { NextRequest, NextResponse } from 'next/server';
import { BillingService } from '@/lib/payments/billingService';
import { getPlan } from '@/lib/payments/plansConfig';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { StorageService } from '@/services/storageService';
import { SubscriptionRecord } from '@/lib/payments/types';

/** Campos expostos ao cliente: nunca metadata (IDs de gateway, dados de cartão) */
function toPublicSubscription(sub: SubscriptionRecord) {
  return {
    id: sub.id,
    gateway: sub.gateway,
    planId: sub.planId,
    planCategory: sub.planCategory,
    status: sub.status,
    billingInterval: sub.billingInterval,
    amount: sub.amount,
    currency: sub.currency,
    currentPeriodStart: sub.currentPeriodStart,
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    createdAt: sub.createdAt,
    updatedAt: sub.updatedAt,
  };
}

export async function GET(request: NextRequest) {
  try {
    // Identidade exclusivamente da sessão assinada
    const session = decodeSession(request.cookies.get(SESSION_COOKIE_NAME)?.value);
    if (!session?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const userId = session.id;
    const userRole = session.role || 'criadora';

    const [subscription, driveUsage] = await Promise.all([
      BillingService.getUserSubscription(userId),
      StorageService.getUserDriveUsage(userId),
    ]);

    // Sem assinatura: exibe os limites do plano base da categoria, sem inventar uma assinatura ativa
    const planDetails = getPlan(subscription?.planId || (userRole === 'agencia' ? 'select' : 'glow'));

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
      subscription: subscription ? toPublicSubscription(subscription) : null,
      plan: planDetails,
      usageMetrics,
    });
  } catch (err: unknown) {
    console.error('[API Subscription] Erro:', err);
    return NextResponse.json({ error: 'Erro ao obter dados de assinatura' }, { status: 500 });
  }
}
