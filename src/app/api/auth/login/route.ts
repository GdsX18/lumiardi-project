import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { sanitizeInput } from '@/lib/security';
import { SessionUser, setSessionCookie } from '@/lib/auth';
import { checkRateLimitPersistent, getClientIp } from '@/lib/security/rateLimiter';
import { matchTOTPCounter } from '@/lib/security/totp';
import { pool } from '@/lib/db';
import { decryptTOTPSecret } from '@/lib/security/twoFactor';

const LOGIN_WINDOW = { windowMs: 15 * 60 * 1000, maxRequests: 10 };
// Limite por conta (somando todos os IPs) bem mais alto: segura força bruta distribuída sem deixar
// que 10 tentativas de um estranho bloqueiem o login da dona da conta
const ACCOUNT_WINDOW = { windowMs: 15 * 60 * 1000, maxRequests: 50 };
const VALID_STATUSES: SessionUser['curationStatus'][] = [
  'EM_CURATORIA',
  'AGUARDANDO_REUNIAO',
  'APROVADA_PAGAMENTO',
  'APROVADO',
  'REJEITADO',
];

function tooManyAttempts(resetTimeMs: number) {
  return NextResponse.json(
    { error: 'Muitas tentativas de acesso. Por motivos de segurança, aguarde alguns minutos.', code: 'rate_limited' },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil(resetTimeMs / 1000)),
        'X-RateLimit-Remaining': '0',
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const ipLimit = await checkRateLimitPersistent(`login:ip:${ip}`, LOGIN_WINDOW);
    if (!ipLimit.allowed) return tooManyAttempts(ipLimit.resetTimeMs);

    const rawBody = await request.json();
    const email = sanitizeInput(rawBody.email);
    const password = typeof rawBody.password === 'string' ? rawBody.password : '';

    if (!email || !password.trim()) {
      return NextResponse.json(
        { error: 'Por favor, informe e-mail e senha.', code: 'invalid_input' },
        { status: 400 }
      );
    }

    // Limite por conta: bloqueia força bruta distribuída em vários IPs
    const pairLimit = await checkRateLimitPersistent(`login:email-ip:${email.toLowerCase()}:${ip}`, LOGIN_WINDOW);
    const accountLimit = pairLimit.allowed
      ? await checkRateLimitPersistent(`login:email:${email.toLowerCase()}`, ACCOUNT_WINDOW)
      : pairLimit;
    if (!accountLimit.allowed) return tooManyAttempts(accountLimit.resetTimeMs);

    // O papel vem da conta no banco; a aba Modelo/Agência da tela de login é só visual
    const authResult = await StorageService.authenticate(email, password);

    if (!authResult || !authResult.user) {
      return NextResponse.json(
        {
          error: 'E-mail ou senha incorretos. Se não lembra a senha, use "Esqueci minha senha" para redefini-la.',
          code: 'invalid_credentials',
        },
        { status: 401 }
      );
    }

    // Segundo fator: com 2FA ativo, a senha correta sozinha não abre sessão.
    // Força bruta do código fica contida pelos limites por IP e por conta acima.
    if (authResult.twoFactorSecretEncrypted) {
      const totpSecret = decryptTOTPSecret(authResult.twoFactorSecretEncrypted);
      if (!totpSecret) {
        console.error(`[login] Segredo 2FA ilegível para ${authResult.user.id} (chave de cifra alterada?).`);
        return NextResponse.json(
          { error: 'Falha interna durante a autenticação.', code: 'generic' },
          { status: 500 }
        );
      }
      const totpCode = typeof rawBody.totpCode === 'string' ? rawBody.totpCode.replace(/\D/g, '') : '';
      if (!totpCode) {
        return NextResponse.json(
          { error: 'Informe o código de 6 dígitos do seu app autenticador.', code: 'two_factor_code_required', requiresTwoFactor: true },
          { status: 401 }
        );
      }
      const counter = matchTOTPCounter(totpCode, totpSecret);
      // Grava o passo usado de forma atômica: um código já aceito (ou mais antigo) é recusado
      const fresh =
        counter !== null &&
        ((
          await pool.query(
            `UPDATE users SET two_factor_last_counter = $1
             WHERE id = $2 AND (two_factor_last_counter IS NULL OR two_factor_last_counter < $1)`,
            [counter, authResult.user.id]
          )
        ).rowCount ?? 0) > 0;
      if (!fresh) {
        return NextResponse.json(
          { error: 'Código de autenticação inválido ou expirado.', code: 'two_factor_invalid', requiresTwoFactor: true },
          { status: 401 }
        );
      }
    }

    const user = authResult.user;
    const profile = authResult.profile as Record<string, any> | null | undefined;

    // Status real do banco — preserva APROVADA_PAGAMENTO e AGUARDANDO_REUNIAO para o roteamento do proxy
    const dbStatus = String(user.curationStatus || '').toUpperCase() as SessionUser['curationStatus'];
    const curationStatus = VALID_STATUSES.includes(dbStatus) ? dbStatus : 'EM_CURATORIA';

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name || profile?.artistic_name || profile?.artisticName || user.email.split('@')[0],
      role: user.role,
      curationStatus,
      category: profile?.category || undefined,
      country: profile?.address?.country || undefined,
      city: profile?.address?.city || undefined,
      createdAt: user.createdAt || new Date().toISOString(),
    };

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
      message: 'Autenticação realizada com sucesso.',
    });

    setSessionCookie(response, sessionUser);

    return response;
  } catch (err: unknown) {
    console.error('Erro na rota de login:', err);
    const unavailable = err instanceof Error && err.message === 'DATABASE_UNAVAILABLE';
    return NextResponse.json(
      { error: 'Falha interna durante a autenticação.', code: unavailable ? 'service_unavailable' : 'generic' },
      { status: unavailable ? 503 : 500 }
    );
  }
}
