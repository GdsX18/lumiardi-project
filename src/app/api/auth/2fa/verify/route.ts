import { NextRequest, NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/apiAuth';
import { verifyTOTP } from '@/lib/security/totp';
import { SESSION_COOKIE_NAME } from '@/lib/auth';
import { initDatabase, pool } from '@/lib/db';
import { cache } from '@/lib/cache';
import { sanitizeInput } from '@/lib/security';
import { createEnrollmentToken, decryptTOTPSecret, encryptTOTPSecret } from '@/lib/security/twoFactor';

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
    const session = await getActiveSession(cookie);

    // Conta já existente (painel): grava o segredo cifrado e passa a exigir o código no login
    if (session && (session.role === 'criadora' || session.role === 'agencia')) {
      await initDatabase();
      const current = await pool.query('SELECT two_factor_enabled, two_factor_secret, is_demo FROM users WHERE id = $1', [session.id]);
      const row = current.rows[0];
      if (!row) {
        return NextResponse.json({ error: 'Faça login para ativar o 2FA na sua conta.', code: 'unauthorized' }, { status: 401 });
      }
      // Conta demo é compartilhada: ninguém pode prender o 2FA dela num aparelho
      if (row.is_demo) {
        return NextResponse.json({ error: 'O 2FA não pode ser alterado em contas de demonstração.', code: 'forbidden' }, { status: 403 });
      }
      // Trocar um 2FA já ativo exige o código do aparelho atual: só a sessão não basta
      if (row.two_factor_enabled) {
        const existingSecret = decryptTOTPSecret(row.two_factor_secret);
        const currentToken = sanitizeInput(rawBody.currentToken);
        if (!currentToken) {
          return NextResponse.json(
            { error: 'Informe o código do aplicativo autenticador atual para trocar o 2FA.', code: 'two_factor_current_required' },
            { status: 400 }
          );
        }
        if (!existingSecret || !verifyTOTP(currentToken, existingSecret)) {
          return NextResponse.json(
            { error: 'O código do autenticador atual está incorreto.', code: 'two_factor_current_invalid' },
            { status: 400 }
          );
        }
      }
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
