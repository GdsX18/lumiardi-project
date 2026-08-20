import { NextRequest, NextResponse } from 'next/server';
import { SECURITY_HEADERS } from '@/lib/security';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = decodeSession(cookie);

  // 1. Proteção de Rotas Privadas (/dashboard/...)
  if (pathname.startsWith('/dashboard')) {
    // Se NÃO estiver logado: Redirecionar para /login
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const isApproved = session.curationStatus === 'APROVADO';

    // Se estiver logado com status EM_CURATORIA:
    if (!isApproved) {
      if (pathname !== '/dashboard/pendente') {
        // Redireciona obrigatoriamente para a tela /dashboard/pendente
        return NextResponse.redirect(new URL('/dashboard/pendente', request.url));
      }
    }

    // Se estiver logado com status APROVADO:
    if (isApproved) {
      // Se tentar acessar a tela de pendente, redireciona para o dashboard
      if (pathname === '/dashboard/pendente') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  // 2. Proteção de Rotas Administrativas (/admin/...)
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') {
      if (session && session.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    } else {
      if (!session || session.role !== 'admin') {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
    }
  }

  // 3. Redirecionamento amigável da página de Login se já autenticado
  if (pathname === '/login' && session) {
    if (session.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    if (session.curationStatus === 'APROVADO') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/dashboard/pendente', request.url));
    }
  }

  const response = NextResponse.next();

  // Aplica as diretivas de cibersegurança do Helmet/Lumiardi
  response.headers.set('X-Frame-Options', SECURITY_HEADERS.xFrameOptions);
  response.headers.set('X-Content-Type-Options', SECURITY_HEADERS.xContentTypeOptions);
  response.headers.set('X-XSS-Protection', SECURITY_HEADERS.xXssProtection);
  response.headers.set('Referrer-Policy', SECURITY_HEADERS.referrerPolicy);
  response.headers.set('Strict-Transport-Security', SECURITY_HEADERS.strictTransportSecurity);
  response.headers.set('Permissions-Policy', SECURITY_HEADERS.permissionsPolicy);
  response.headers.set('Content-Security-Policy', SECURITY_HEADERS.csp);

  response.headers.delete('X-Powered-By');

  return response;
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except static files, _next/static, _next/image, favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
