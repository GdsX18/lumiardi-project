import { NextRequest, NextResponse } from 'next/server';
import { CouponService, CouponDiscountType, CouponTargetRole, CreateCouponInput } from '@/services/couponService';
import { AuditLogService } from '@/lib/audit/auditService';
import { getVerifiedAdminSession } from '@/lib/apiAuth';
import { getClientIp } from '@/lib/security/rateLimiter';
import { sanitizeInput } from '@/lib/security';
import type { SessionUser } from '@/lib/auth';

/** Emitir e alterar cupons mexe em receita: só supervisores e administradores. */
function canManageCoupons(session: SessionUser): boolean {
  return session.curationRole === 'admin' || session.curationRole === 'supervisor';
}

function parseOptionalInt(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  return Number(value);
}

function parseOptionalDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  // Data sem hora (yyyy-mm-dd) vale até o fim do dia no horário de Brasília
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T23:59:59-03:00` : value;
}

export async function GET() {
  try {
    const session = await getVerifiedAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Acesso restrito à Curadoria.', code: 'unauthorized' }, { status: 401 });
    }

    const [coupons, redemptions] = await Promise.all([CouponService.listCoupons(), CouponService.listRedemptions()]);
    return NextResponse.json({ coupons, redemptions, canManage: canManageCoupons(session) });
  } catch (error) {
    console.error('[Admin Coupons] Erro ao listar cupons:', error);
    return NextResponse.json({ error: 'Erro ao carregar cupons.', code: 'generic' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getVerifiedAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Acesso restrito à Curadoria.', code: 'unauthorized' }, { status: 401 });
    }
    if (!canManageCoupons(session)) {
      return NextResponse.json(
        { error: 'Apenas Supervisores e Administradores podem emitir cupons.', code: 'forbidden' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const input: CreateCouponInput = {
      code: sanitizeInput(body.code).toUpperCase().replace(/\s+/g, ''),
      discountType: body.discountType as CouponDiscountType,
      discountValue: Number(body.discountValue),
      targetRole: (body.targetRole || 'all') as CouponTargetRole,
      applicablePlan: body.applicablePlan ? sanitizeInput(body.applicablePlan) : null,
      maxUses: parseOptionalInt(body.maxUses),
      expiresAt: parseOptionalDate(body.expiresAt),
      description: body.description ? sanitizeInput(body.description).slice(0, 300) : null,
    };

    const invalid = CouponService.validateCouponInput(input);
    if (invalid) {
      return NextResponse.json({ error: invalid, code: 'invalid_input' }, { status: 400 });
    }

    if (await CouponService.getCoupon(input.code)) {
      return NextResponse.json({ error: `O código ${input.code} já existe.`, code: 'coupon_code_in_use' }, { status: 409 });
    }

    const coupon = await CouponService.createCoupon(input, session.email || session.id);

    await AuditLogService.logAction({
      userId: session.id,
      userName: session.name,
      userEmail: session.email,
      userRole: session.curationRole || 'admin',
      actionType: 'CRIOU_CUPOM',
      targetId: coupon.id,
      targetName: coupon.code,
      targetType: 'CUPOM',
      details: { ...input },
      ipAddress: getClientIp(req.headers),
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error) {
    const pgCode = (error as { code?: string })?.code;
    if (pgCode === '23505') {
      return NextResponse.json({ error: 'Este código de cupom já existe.', code: 'coupon_code_in_use' }, { status: 409 });
    }
    console.error('[Admin Coupons] Erro ao criar cupom:', error);
    return NextResponse.json({ error: 'Erro ao criar cupom.', code: 'generic' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getVerifiedAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Acesso restrito à Curadoria.', code: 'unauthorized' }, { status: 401 });
    }
    if (!canManageCoupons(session)) {
      return NextResponse.json(
        { error: 'Apenas Supervisores e Administradores podem alterar cupons.', code: 'forbidden' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const id = typeof body.id === 'string' ? body.id : '';
    if (!id) {
      return NextResponse.json({ error: 'ID do cupom é obrigatório.', code: 'invalid_input' }, { status: 400 });
    }

    const patch: { active?: boolean; maxUses?: number | null; expiresAt?: string | null } = {};
    if (typeof body.active === 'boolean') patch.active = body.active;
    if ('maxUses' in body) {
      const maxUses = parseOptionalInt(body.maxUses);
      if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) {
        return NextResponse.json({ error: 'Limite de usos inválido.', code: 'invalid_input' }, { status: 400 });
      }
      patch.maxUses = maxUses;
    }
    if ('expiresAt' in body) {
      const expiresAt = parseOptionalDate(body.expiresAt);
      if (expiresAt && isNaN(new Date(expiresAt).getTime())) {
        return NextResponse.json({ error: 'Data de expiração inválida.', code: 'invalid_input' }, { status: 400 });
      }
      patch.expiresAt = expiresAt;
    }

    const coupon = await CouponService.updateCoupon(id, patch);
    if (!coupon) {
      return NextResponse.json({ error: 'Cupom não encontrado.', code: 'not_found' }, { status: 404 });
    }

    await AuditLogService.logAction({
      userId: session.id,
      userName: session.name,
      userEmail: session.email,
      userRole: session.curationRole || 'admin',
      actionType: patch.active === false ? 'DESATIVOU_CUPOM' : 'ALTEROU_CUPOM',
      targetId: coupon.id,
      targetName: coupon.code,
      targetType: 'CUPOM',
      details: patch,
      ipAddress: getClientIp(req.headers),
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error) {
    console.error('[Admin Coupons] Erro ao atualizar cupom:', error);
    return NextResponse.json({ error: 'Erro ao atualizar cupom.', code: 'generic' }, { status: 500 });
  }
}
