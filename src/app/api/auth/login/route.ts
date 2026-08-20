import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { sanitizeInput } from '@/lib/security';
import { encodeSession, SESSION_COOKIE_NAME, SessionUser } from '@/lib/auth';
import { checkRateLimit } from '@/lib/security/rateLimiter';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(`login:${ip}`, { windowMs: 60000, maxRequests: 10 });

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas de acesso. Por motivos de segurança, aguarde 1 minuto.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateCheck.resetTimeMs / 1000)),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    const rawBody = await request.json();
    const email = sanitizeInput(rawBody.email);
    const password = typeof rawBody.password === 'string' ? rawBody.password : '';
    const role = (rawBody.role === 'agencia' ? 'agencia' : 'criadora') as 'criadora' | 'agencia';

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Por favor, informe e-mail e senha.' },
        { status: 400 }
      );
    }

    const authResult = await StorageService.authenticate(email, password, role);

    if (!authResult || !authResult.user) {
      return NextResponse.json(
        { error: 'Credenciais inválidas. Verifique seu e-mail, senha e se selecionou a aba correta (Modelo ou Agência).' },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const profile = authResult.profile as Record<string, any> | null | undefined;

    const isApproved = String(user.curationStatus).toUpperCase() === 'APROVADO';

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name || profile?.artistic_name || profile?.artisticName || (role === 'criadora' ? 'Sua Conta Modelo' : 'Sua Agência'),
      role: role,
      curationStatus: isApproved ? 'APROVADO' : 'EM_CURATORIA',
      category: profile?.category || (role === 'criadora' ? 'Criadora VIP' : undefined),
      country: profile?.address?.country || 'Brasil',
      city: profile?.address?.city || 'São Paulo',
      createdAt: user.createdAt || new Date().toISOString(),
    };

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
      message: 'Autenticação realizada com sucesso.',
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: encodeSession(sessionUser),
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno ao autenticar';
    console.error('Erro na rota de login:', err);
    return NextResponse.json(
      { error: 'Falha interna durante a autenticação.', details: message },
      { status: 500 }
    );
  }
}
