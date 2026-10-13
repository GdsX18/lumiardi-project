import { NextRequest, NextResponse } from 'next/server';
import { sanitizeInput } from '@/lib/security';
import { checkRateLimitPersistent, getClientIp } from '@/lib/security/rateLimiter';
import { createPasswordResetToken } from '@/lib/security/passwordReset';
import { EmailService } from '@/lib/email';

const WINDOW = { windowMs: 15 * 60 * 1000, maxRequests: 5 };

// Resposta idêntica exista ou não a conta: impede descobrir e-mails cadastrados
const GENERIC_OK = {
  success: true,
  message: 'Se este e-mail estiver cadastrado, você receberá em instantes um link para redefinir a senha (válido por 1 hora).',
};

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const ipLimit = await checkRateLimitPersistent(`pwreset:ip:${ip}`, WINDOW);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: 'Muitas solicitações. Aguarde alguns minutos e tente novamente.', code: 'rate_limited' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(ipLimit.resetTimeMs / 1000)) } }
      );
    }

    const body = await request.json().catch(() => ({}));
    const email = sanitizeInput(body.email).toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Informe um e-mail válido.', code: 'invalid_input' }, { status: 400 });
    }

    const emailLimit = await checkRateLimitPersistent(`pwreset:email:${email}`, { windowMs: 15 * 60 * 1000, maxRequests: 3 });
    if (!emailLimit.allowed) return NextResponse.json(GENERIC_OK);

    const reset = await createPasswordResetToken(email);
    if (reset) {
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/$/, '');
      const link = `${appUrl}/redefinir-senha?token=${encodeURIComponent(reset.token)}`;
      try {
        await EmailService.sendPasswordResetEmail(reset.email, link, reset.name || undefined);
      } catch (err) {
        console.error('[forgot-password] Falha ao enviar e-mail de redefinição para', reset.userId, err);
        return NextResponse.json(
          { error: 'Não foi possível enviar o e-mail agora. Tente novamente em instantes.', code: 'service_unavailable' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(GENERIC_OK);
  } catch (err) {
    console.error('[forgot-password] Erro inesperado:', err);
    return NextResponse.json({ error: 'Falha ao processar a solicitação.', code: 'generic' }, { status: 500 });
  }
}
