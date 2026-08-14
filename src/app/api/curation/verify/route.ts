import { NextRequest, NextResponse } from 'next/server';
import { KYCService } from '@/lib/kyc/kycService';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { sanitizeInput } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    const userId = session?.id || rawBody.userId || `user_${Date.now()}`;
    const userEmail = session?.email || rawBody.email || 'candidata@lumiardi.com';
    const fullName = session?.name || rawBody.fullName || 'Candidata VIP';
    const role = session?.role || (rawBody.role === 'agencia' ? 'agencia' : 'criadora');
    const documentType = sanitizeInput(rawBody.documentType) as any;

    const verificationSession = await KYCService.createVerificationSession({
      userId,
      userEmail,
      fullName,
      role,
      documentType,
    });

    return NextResponse.json(verificationSession);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao iniciar verificação KYC';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
