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

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Origens aceitas para requisições que alteram dados: o próprio host e o domínio oficial. */
function isAllowedOrigin(origin: string, request: NextRequest): boolean {
  try {
    const originHost = new URL(origin).host.toLowerCase();
    // Host real da requisição (o nextUrl pode vir normalizado, ex.: localhost em vez do IP)
    const requestHosts = [request.headers.get('x-forwarded-host'), request.headers.get('host'), request.nextUrl.host]
      .flatMap((h) => (h ? h.split(',') : []))
      .map((h) => h.trim().toLowerCase());
    if (requestHosts.includes(originHost)) return true;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    return Boolean(appUrl && originHost === new URL(appUrl).host);
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 0. CSRF: escrita na API só a partir do próprio site. O navegador sempre envia Origin em POST/PUT/
  //    PATCH/DELETE; um formulário de outro site (ex.: login forçado na conta do atacante) é recusado.
  //    Webhooks vêm de servidores dos gateways e têm assinatura própria.
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/webhooks/') && !SAFE_METHODS.has(request.method)) {
    const origin = request.headers.get('origin');
    if (origin && !isAllowedOrigin(origin, request)) {
      return NextResponse.json({ error: 'Origem não permitida.', code: 'forbidden' }, { status: 403 });
    }
  }
  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = decodeSession(cookie);

  // 1. Proteção de Checkout (/checkout) — Exige Aprovação Prévia da Curadoria
  if (pathname.startsWith('/checkout')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const canPay = session.curationStatus === 'APROVADA_PAGAMENTO' || session.curationStatus === 'APROVADO';
    if (!canPay) {
      // Bloqueia candidatas não aprovadas ou aguardando reunião
      return NextResponse.redirect(new URL('/dashboard/pendente', request.url));
    }
  }

  // 2. Proteção de Rotas Privadas (/dashboard/...)
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const isFullyApproved = session.curationStatus === 'APROVADO';

    if (!isFullyApproved) {
      if (pathname !== '/dashboard/pendente') {
        return NextResponse.redirect(new URL('/dashboard/pendente', request.url));
      }
    }

    if (isFullyApproved) {
      if (pathname === '/dashboard/pendente') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  // 3. Proteção de Rotas Administrativas (/admin/...)
  if (pathname.startsWith('/admin')) {
    const isCuratorOrAdmin = session && (session.role === 'admin' || Boolean(session.curationRole));
    if (pathname === '/admin/login') {
      if (isCuratorOrAdmin) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    } else {
      if (!isCuratorOrAdmin) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
    }
  }

  // 4. Redirecionamento amigável da página de Login se já autenticado
  if (pathname === '/login' && session) {
    if (session.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    if (session.curationStatus === 'APROVADO') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else if (session.curationStatus === 'APROVADA_PAGAMENTO') {
      const planQuery = session.planId ? `?plan=${session.planId}&billing=${session.planBillingInterval || 'yearly'}` : '';
      return NextResponse.redirect(new URL(`/checkout${planQuery}`, request.url));
    } else {
      return NextResponse.redirect(new URL('/dashboard/pendente', request.url));
    }
  }

  const response = NextResponse.next();

  // Apply security headers in all responses except CSP which is handled by next.config.ts
  response.headers.set('X-Frame-Options', SECURITY_HEADERS.xFrameOptions);
  response.headers.set('X-Content-Type-Options', SECURITY_HEADERS.xContentTypeOptions);
  response.headers.set('X-XSS-Protection', SECURITY_HEADERS.xXssProtection);
  response.headers.set('Referrer-Policy', SECURITY_HEADERS.referrerPolicy);
  response.headers.set('Strict-Transport-Security', SECURITY_HEADERS.strictTransportSecurity);
  response.headers.set('Permissions-Policy', SECURITY_HEADERS.permissionsPolicy);
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
