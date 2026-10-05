import { NextRequest, NextResponse } from 'next/server';
import { generateTOTPSecret, getTOTPAuthUri, getQRCodeImageUrl } from '@/lib/security/totp';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { sanitizeInput } from '@/lib/security';

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}$/;

export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    // No cadastro ainda não há sessão: o e-mail informado serve apenas de rótulo no app autenticador
    const body = await request.json().catch(() => ({}));
    const labelEmail = sanitizeInput(body?.accountEmail);
    const email = session?.email || (EMAIL_RE.test(labelEmail) ? labelEmail : 'usuario@lumiardi.com');

    // O segredo só é persistido após a validação de um código real em /api/auth/2fa/verify
    const secret = generateTOTPSecret();
    const otpauthUri = getTOTPAuthUri(email, secret, 'Lumiardi Executive');
    const qrCodeUrl = await getQRCodeImageUrl(otpauthUri);

    return NextResponse.json({
      success: true,
      secret,
      otpauthUri,
      qrCodeUrl,
    });
  } catch (err: unknown) {
    console.error('[2FA generate] Erro:', err);
    return NextResponse.json({ error: 'Erro ao gerar 2FA.', code: 'generic' }, { status: 500 });
  }
}
