import { NextRequest, NextResponse } from 'next/server';
import { KYCService } from '@/lib/kyc/kycService';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { sanitizeInput } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    if (!session) {
      return NextResponse.json({ error: 'Faça login para iniciar a verificação.', code: 'unauthorized' }, { status: 401 });
    }

    const userId = session.id;
    const userEmail = session.email;
    const fullName = session.name;
    const role: 'criadora' | 'agencia' = session.role === 'agencia' ? 'agencia' : 'criadora';
    const documentType = sanitizeInput(rawBody.documentType);

    const verificationSession = await KYCService.createVerificationSession({
      userId,
      userEmail,
      fullName,
      role,
      documentType,
    });

    return NextResponse.json(verificationSession);
  } catch (err: unknown) {
    console.error('[curation/verify] Erro:', err);
    return NextResponse.json({ error: 'Erro ao iniciar verificação KYC.', code: 'generic' }, { status: 500 });
  }
}
