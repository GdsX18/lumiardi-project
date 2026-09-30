import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { sanitizeInput } from '@/lib/security';
import { SessionUser, setSessionCookie } from '@/lib/auth';
import { checkRateLimitPersistent, getClientIp } from '@/lib/security/rateLimiter';

const LOGIN_WINDOW = { windowMs: 15 * 60 * 1000, maxRequests: 10 };
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
    const role = (rawBody.role === 'agencia' ? 'agencia' : 'criadora') as 'criadora' | 'agencia';

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Por favor, informe e-mail e senha.', code: 'invalid_input' },
        { status: 400 }
      );
    }

    // Limite por conta: bloqueia força bruta distribuída em vários IPs
    const accountLimit = await checkRateLimitPersistent(`login:email:${email.toLowerCase()}`, LOGIN_WINDOW);
    if (!accountLimit.allowed) return tooManyAttempts(accountLimit.resetTimeMs);

    const authResult = await StorageService.authenticate(email, password, role);

    if (!authResult || !authResult.user) {
      return NextResponse.json(
        {
          error: 'Credenciais inválidas. Verifique seu e-mail, senha e se selecionou a aba correta (Modelo ou Agência).',
          code: 'invalid_credentials',
        },
        { status: 401 }
      );
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
      role: role,
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
