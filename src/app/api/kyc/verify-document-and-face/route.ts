import { NextRequest, NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/apiAuth';
import { BiometricEngine } from '@/lib/kyc/biometricEngine';
import { initDatabase, pool } from '@/lib/db';
import { checkRateLimitPersistent, getClientIp } from '@/lib/security/rateLimiter';
import { cache } from '@/lib/cache';
import { SESSION_COOKIE_NAME } from '@/lib/auth';
import { EmailService } from '@/lib/email';

const MAX_BODY_BYTES = 12 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // Cada verificação consome a API de visão computacional: limita por IP
    const limit = await checkRateLimitPersistent(`kyc:${getClientIp(request.headers)}`, {
      windowMs: 60 * 60 * 1000,
      maxRequests: 10,
    });
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, approved: false, error: 'Muitas tentativas de verificação. Aguarde e tente novamente.', code: 'rate_limited' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(limit.resetTimeMs / 1000)) } }
      );
    }

    // Duas imagens otimizadas cabem com folga em 12 MB; acima disso é abuso (custo de IA e memória)
    const declaredLength = Number(request.headers.get('content-length') || 0);
    if (declaredLength > MAX_BODY_BYTES) {
      return NextResponse.json({ success: false, approved: false, error: 'Imagens grandes demais.', code: 'upload_too_large' }, { status: 413 });
    }
    const rawText = await request.text();
    if (rawText.length > MAX_BODY_BYTES) {
      return NextResponse.json({ success: false, approved: false, error: 'Imagens grandes demais.', code: 'upload_too_large' }, { status: 413 });
    }
    const body = JSON.parse(rawText || '{}');
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await getActiveSession(cookie);

    // Sem sessão (pré-cadastro) há também um teto diário somado de todos os IPs: limita o custo
    // da API de visão mesmo com muitos IPs diferentes
    if (!session) {
      const anonLimit = await checkRateLimitPersistent('kyc:anonymous:all', {
        windowMs: 24 * 60 * 60 * 1000,
        maxRequests: Number(process.env.KYC_ANON_DAILY_LIMIT || 300),
      });
      if (!anonLimit.allowed) {
        return NextResponse.json(
          { success: false, approved: false, error: 'Verificação temporariamente indisponível. Tente novamente mais tarde.', code: 'rate_limited' },
          { status: 429 }
        );
      }
    }

    // Sem sessão (etapa de qualificação, antes do cadastro) a análise é apenas consultiva
    const userId = session?.id || `pre-registration-${Date.now()}`;
    const { documentBase64, liveSelfieBase64, docType, claimedData } = body;

    if (!documentBase64 || !liveSelfieBase64) {
      return NextResponse.json(
        {
          success: false,
          approved: false,
          error: 'Documento e captura facial ao vivo são obrigatórios para homologação.',
        },
        { status: 400 }
      );
    }

    // Executa a análise profunda de Visão Computacional, OCR e Face Match
    const result = await BiometricEngine.verifyDocumentAndFace({
      documentBase64,
      liveSelfieBase64,
      docType: docType || 'cnh',
      claimedData,
      userId,
    });

    // O KYC é insumo para a Mesa de Curadoria: NUNCA aprova a conta sozinho.
    // Para usuárias logadas, apenas registra o tipo de documento verificado.
    if (result.approved && session) {
      try {
        await initDatabase();
        await pool.query('UPDATE users SET document_type = $1, updated_at = NOW() WHERE id = $2', [
          result.extractedData.documentType,
          session.id,
        ]);
        await cache.delete(`user:${session.id}`);
      } catch (err) {
        console.error('[KYC] Falha ao registrar documento verificado:', err);
      }
    }

    // Dispara e-mail de notificação de homologação de forma assíncrona
    // Só notifica a própria conta logada (evita uso da rota para enviar e-mails a terceiros)
    const recipientEmail = session?.email;
    const recipientName = session?.name || 'Criadora';
    if (recipientEmail) {
      EmailService.sendKYCStatusEmail(
        recipientEmail,
        recipientName,
        result.approved,
        result.compliance2257Reference,
        result.reasons
      ).catch((err) => {
        console.warn('[KYC Email] Falha no envio de notificação de homologação:', err);
      });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('[API KYC / Verify Document & Face] Erro:', error);
    return NextResponse.json(
      { success: false, approved: false, error: 'Erro interno durante análise biométrica.', code: 'generic' },
      { status: 500 }
    );
  }
}
