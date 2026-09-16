import { NextRequest, NextResponse } from 'next/server';
import { encodeSession, SessionUser, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // Em produção, retorna 404 estrito — sem revelar que a rota existe
  if ((process.env.NODE_ENV as string) === 'production') {
    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Usuário de Curadoria oficial (Diretoria / Administrador)
  const curatorUser: SessionUser = {
    id: 'cur-admin-1',
    email: 'curadoria@lumiardi.com',
    name: 'Mesa de Curadoria (Diretoria)',
    role: 'admin',
    curationRole: 'admin',
    curationStatus: 'APROVADO',
    createdAt: new Date().toISOString(),
  };

  const token = encodeSession(curatorUser);

  // Redireciona diretamente para o Painel Administrativo de Curadoria
  const response = NextResponse.redirect(new URL('/admin', request.url));

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: (process.env.NODE_ENV as string) === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });

  return response;
}

