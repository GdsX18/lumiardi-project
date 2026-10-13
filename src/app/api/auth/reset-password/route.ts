import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimitPersistent, getClientIp } from '@/lib/security/rateLimiter';
import { resetPasswordWithToken } from '@/lib/security/passwordReset';
import { weakPasswordResponse } from '@/lib/registration';

export async function POST(request: NextRequest) {
  try {
    const limit = await checkRateLimitPersistent(`pwreset:apply:${getClientIp(request.headers)}`, {
      windowMs: 15 * 60 * 1000,
      maxRequests: 10,
    });
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.', code: 'rate_limited' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    // A senha é só hasheada (nunca renderizada): não passa pelo sanitizer, que a alteraria
    const password = typeof body.password === 'string' ? body.password : '';

    const weak = weakPasswordResponse(password);
    if (weak) return weak;

    const result = await resetPasswordWithToken(token, password);
    if (result === 'invalid_token') {
      return NextResponse.json(
        { error: 'Este link de redefinição é inválido, já foi usado ou expirou. Solicite um novo.', code: 'reset_token_invalid' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Senha redefinida com sucesso. Faça login com a nova senha.' });
  } catch (err) {
    console.error('[reset-password] Erro inesperado:', err);
    const unavailable = err instanceof Error && err.message === 'DATABASE_UNAVAILABLE';
    return NextResponse.json(
      { error: 'Falha ao redefinir a senha.', code: unavailable ? 'service_unavailable' : 'generic' },
      { status: unavailable ? 503 : 500 }
    );
  }
}
