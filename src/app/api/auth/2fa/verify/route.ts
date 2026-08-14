import { NextRequest, NextResponse } from 'next/server';
import { verifyTOTP } from '@/lib/security/totp';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { fallbackStore, pool, initDatabase } from '@/lib/db';
import { sanitizeInput } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const token = sanitizeInput(rawBody.token);
    const secret = sanitizeInput(rawBody.secret);

    if (!token || !secret) {
      return NextResponse.json(
        { error: 'Código de 6 dígitos e segredo são obrigatórios.' },
        { status: 400 }
      );
    }

    const isValid = verifyTOTP(token, secret);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Código de autenticação inválido ou expirado. Tente novamente.' },
        { status: 400 }
      );
    }

    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    if (session?.email) {
      const email = session.email.toLowerCase();
      const user = fallbackStore.users.get(email) || {};
      user.two_factor_enabled = true;
      user.two_factor_secret = secret;
      delete user.temp_2fa_secret;
      fallbackStore.users.set(email, user);
    }

    return NextResponse.json({
      success: true,
      message: 'Autenticação em Dois Fatores (2FA) ativada com sucesso!',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao verificar código 2FA';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
