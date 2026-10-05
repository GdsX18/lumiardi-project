import { NextRequest, NextResponse } from 'next/server';
import { verifyTOTP } from '@/lib/security/totp';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { initDatabase, pool } from '@/lib/db';
import { cache } from '@/lib/cache';
import { sanitizeInput } from '@/lib/security';
import { createEnrollmentToken, encryptTOTPSecret } from '@/lib/security/twoFactor';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const token = sanitizeInput(rawBody.token);
    const secret = sanitizeInput(rawBody.secret);

    if (!token || !secret) {
      return NextResponse.json(
        { error: 'Código de 6 dígitos e segredo são obrigatórios.', code: 'invalid_input' },
        { status: 400 }
      );
    }

    const isValid = verifyTOTP(token, secret);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Código de autenticação inválido ou expirado. Tente novamente.', code: 'two_factor_invalid' },
        { status: 400 }
      );
    }

    // Cadastro (ainda sem conta): o token cifrado acompanha a candidatura até /register.
    // Nunca grava em uma sessão eventualmente aberta no navegador.
    if (rawBody.purpose === 'enrollment') {
      return NextResponse.json({
        success: true,
        enrollmentToken: createEnrollmentToken(secret),
        message: 'Autenticação em Dois Fatores (2FA) validada.',
      });
    }

    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    // Conta já existente (painel): grava o segredo cifrado e passa a exigir o código no login
    if (session && (session.role === 'criadora' || session.role === 'agencia')) {
      await initDatabase();
      await pool.query(
        'UPDATE users SET two_factor_secret = $1, two_factor_enabled = TRUE, updated_at = NOW() WHERE id = $2',
        [encryptTOTPSecret(secret), session.id]
      );
      await cache.delete(`user:${session.id}`);
      return NextResponse.json({
        success: true,
        message: 'Autenticação em Dois Fatores (2FA) ativada com sucesso!',
      });
    }

    return NextResponse.json(
      { error: 'Faça login para ativar o 2FA na sua conta.', code: 'unauthorized' },
      { status: 401 }
    );
  } catch (err: unknown) {
    console.error('[2FA verify] Erro:', err);
    return NextResponse.json({ error: 'Erro ao verificar código 2FA.', code: 'generic' }, { status: 500 });
  }
}
