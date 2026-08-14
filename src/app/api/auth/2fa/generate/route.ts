import { NextRequest, NextResponse } from 'next/server';
import { generateTOTPSecret, getTOTPAuthUri, getQRCodeImageUrl, generateTOTP } from '@/lib/security/totp';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { fallbackStore } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    const email = session?.email || 'usuario@lumiardi.com';
    const secret = generateTOTPSecret();
    const otpauthUri = getTOTPAuthUri(email, secret, 'Lumiardi Executive');
    const qrCodeUrl = getQRCodeImageUrl(otpauthUri);
    const currentOtp = generateTOTP(secret);

    // Salva o segredo temporário no store (em produção, salvar na tabela users criptografado)
    if (session?.id) {
      const user = fallbackStore.users.get(email.toLowerCase()) || {};
      user.temp_2fa_secret = secret;
      fallbackStore.users.set(email.toLowerCase(), user);
    }

    return NextResponse.json({
      success: true,
      secret,
      otpauthUri,
      qrCodeUrl,
      currentOtp, // Para conveniência em ambiente de testes/sandbox
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao gerar 2FA';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
