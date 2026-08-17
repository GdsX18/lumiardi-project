import { NextRequest, NextResponse } from 'next/server';
import { BiometricEngine } from '@/lib/kyc/biometricEngine';
import { initDatabase, pool, fallbackStore } from '@/lib/db';
import { cache } from '@/lib/cache';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    const userId = session?.id || body.userId || `creator_${Date.now()}`;
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

    // Se aprovado, atualiza o status de curadoria no banco de dados e na memória
    if (result.approved) {
      await initDatabase();

      try {
        await pool.query(
          `UPDATE users 
           SET curation_status = 'APROVADO', 
               rejection_reason = NULL,
               document_type = $1,
               updated_at = NOW() 
           WHERE id = $2`,
          [result.extractedData.documentType, userId]
        );
      } catch (dbErr) {
        // Fallback em memória se PostgreSQL estiver offline
      }

      // Atualiza fallback em memória
      for (const [email, user] of fallbackStore.users.entries()) {
        if (user.id === userId || user.email === claimedData?.email) {
          user.curation_status = 'APROVADO';
          user.curationStatus = 'APROVADO';
          user.document_type = result.extractedData.documentType;
          user.rejection_reason = null;
          fallbackStore.users.set(email, user);
          break;
        }
      }

      await cache.delete(`user:${userId}`);
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('[API KYC / Verify Document & Face] Erro:', error);
    const msg = error instanceof Error ? error.message : 'Erro interno durante análise biométrica';
    return NextResponse.json({ success: false, approved: false, error: msg }, { status: 500 });
  }
}
