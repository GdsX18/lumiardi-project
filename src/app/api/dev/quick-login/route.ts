import { NextRequest, NextResponse } from 'next/server';
import { encodeSession, SessionUser, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // Em produção, retorna 404 puro — sem revelar que a rota existe
  if ((process.env.NODE_ENV as string) === 'production') {
    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const searchParams = request.nextUrl.searchParams;
  const targetUserId = searchParams.get('userId');
  const redirectTarget = searchParams.get('redirect') || '/dashboard';

  // Usuário de teste padrão: Modelo aprovada
  let testUser: SessionUser = {
    id: 'user-model-1',
    email: 'modelo@lumiardi.com',
    name: 'Sua Conta Modelo',
    role: 'criadora',
    curationStatus: 'APROVADO',
    createdAt: '2026-08-14T20:09:06.068Z',
  };

  if (targetUserId === 'user-agency-1') {
    testUser = {
      id: 'user-agency-1',
      email: 'agencia@lumiardi.com',
      name: 'Sua Agência Corporativa',
      role: 'agencia',
      curationStatus: 'APROVADO',
      createdAt: '2026-08-14T20:09:06.068Z',
    };
  }

  // Gera o cookie JWT assinado
  const token = encodeSession(testUser);

  // Redireciona de volta para o destino solicitado
  const response = NextResponse.redirect(new URL(redirectTarget, request.url));

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: (process.env.NODE_ENV as string) === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 // 1 dia
  });

  return response;
}