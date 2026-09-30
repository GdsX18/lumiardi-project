import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { sanitizeInput } from '@/lib/security';
import { encodeSession, SESSION_COOKIE_NAME, SessionUser, setSessionCookie } from '@/lib/auth';

import { checkRateLimitPersistent, getClientIp } from '@/lib/security/rateLimiter';

const LOGIN_WINDOW = { windowMs: 15 * 60 * 1000, maxRequests: 10 };

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const ipLimit = await checkRateLimitPersistent(`admin-login:ip:${ip}`, LOGIN_WINDOW);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas de login. Aguarde e tente novamente.', code: 'rate_limited' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(ipLimit.resetTimeMs / 1000)) } }
      );
    }

    const rawBody = await request.json();
    const email = sanitizeInput(rawBody.email);
    const password = typeof rawBody.password === 'string' ? rawBody.password : '';

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Por favor, informe suas credenciais de administrador.' },
        { status: 400 }
      );
    }

    // Limite por conta: bloqueia força bruta distribuída em vários IPs
    const accountLimit = await checkRateLimitPersistent(`admin-login:email:${email.toLowerCase()}`, LOGIN_WINDOW);
    if (!accountLimit.allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas de login. Aguarde e tente novamente.', code: 'rate_limited' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(accountLimit.resetTimeMs / 1000)) } }
      );
    }

    const authResult = await StorageService.authenticateAdmin(email, password);

    if (!authResult || !authResult.user) {
      return NextResponse.json(
        { error: 'Acesso negado. Credenciais administrativas inválidas ou não autorizadas.' },
        { status: 401 }
      );
    }

    const user = authResult.user;

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name || 'Mesa de Curadoria Lumiardi',
      role: 'admin',
      curationRole: user.curationRole || 'admin',
      curationStatus: 'APROVADO',
      createdAt: user.createdAt || new Date().toISOString(),
    };

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
      message: 'Autenticação administrativa realizada com sucesso.',
    });

    setSessionCookie(response, sessionUser);

    return response;
  } catch (err: unknown) {
    console.error('Erro no login admin:', err);
    const unavailable = err instanceof Error && err.message === 'DATABASE_UNAVAILABLE';
    return NextResponse.json(
      { error: 'Falha interna durante a autenticação administrativa.', code: unavailable ? 'service_unavailable' : 'generic' },
      { status: unavailable ? 503 : 500 }
    );
  }
}
