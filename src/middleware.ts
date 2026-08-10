import { NextResponse } from 'next/server';
import { SECURITY_HEADERS } from '@/lib/security';

export function middleware() {
  const response = NextResponse.next();

  // Aplica as 7 diretivas de cibersegurança do Helmet/Lumiardi em cada requisição
  response.headers.set('X-Frame-Options', SECURITY_HEADERS.xFrameOptions);
  response.headers.set('X-Content-Type-Options', SECURITY_HEADERS.xContentTypeOptions);
  response.headers.set('X-XSS-Protection', SECURITY_HEADERS.xXssProtection);
  response.headers.set('Referrer-Policy', SECURITY_HEADERS.referrerPolicy);
  response.headers.set('Strict-Transport-Security', SECURITY_HEADERS.strictTransportSecurity);
  response.headers.set('Permissions-Policy', SECURITY_HEADERS.permissionsPolicy);
  response.headers.set('Content-Security-Policy', SECURITY_HEADERS.csp);

  // Remove qualquer identificador de tecnologia
  response.headers.delete('X-Powered-By');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files, _next/static, _next/image, favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
