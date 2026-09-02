/**
 * LUMIARDI — PROXY (Middleware do Next.js 16)
 *
 * No Next.js 16, o arquivo de middleware foi renomeado de `middleware.ts` para `proxy.ts`.
 * Este arquivo é executado em todas as requisições antes do roteamento.
 *
 * Responsabilidades:
 * 1. Proteção de rotas privadas (/dashboard, /admin) com verificação de sessão HMAC
 * 2. Redirecionamentos de autenticação
 * 3. Aplicação de headers de segurança (CSP, HSTS, X-Frame-Options, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { SECURITY_HEADERS } from '@/lib/security';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = decodeSession(cookie);

  // 1. Proteção de Rotas Privadas (/dashboard/...)
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const isApproved = session.curationStatus === 'APROVADO';

    if (!isApproved) {
      if (pathname !== '/dashboard/pendente') {
        return NextResponse.redirect(new URL('/dashboard/pendente', request.url));
      }
    }

    if (isApproved) {
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

  // Aplica as diretivas de cibersegurança em todas as respostas
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
     * Aplica o proxy em todas as rotas, exceto:
     * - _next/static (arquivos estáticos do build)
     * - _next/image (imagens otimizadas)
     * - favicon.ico
     * - Imagens estáticas (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
