import { NextRequest, NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/apiAuth';
import { R2StorageService } from '@/lib/storage/r2Service';
import { SESSION_COOKIE_NAME } from '@/lib/auth';
import { sanitizeInput } from '@/lib/security';
import { normalizeMediaKey } from '@/lib/storage/mediaAccess';
import { canReadMediaWithContract } from '@/lib/storage/sharedAccess';
import { normalizeCategory } from '@/lib/storage/uploadPolicy';
import { getClientIp } from '@/lib/security/rateLimiter';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await getActiveSession(cookie);

    if (!session?.id) {
      return NextResponse.json({ error: 'Sessão expirada ou não autenticada.', code: 'unauthorized' }, { status: 401 });
    }

    const userId = session.id;
    // Só download: uploads passam por /api/drive/upload-url, que exige tamanho, confere a cota
    // e o vínculo de agenciamento antes de assinar o PUT
    if (rawBody.operation !== 'download') {
      return NextResponse.json(
        { error: 'Use /api/drive/upload-url para enviar arquivos.', code: 'invalid_input' },
        { status: 400 }
      );
    }
    const operation = 'download' as const;
    const fileName = sanitizeInput(rawBody.fileName || 'arquivo_lumiardi.jpg');
    const fileType = String(rawBody.fileType || 'image/jpeg');
    const category = normalizeCategory(rawBody.category, 'raw-photos');

    let fileKey: string | undefined;
    if (rawBody.fileKey) {
      const normalized = normalizeMediaKey(String(rawBody.fileKey));
      if (!normalized) {
        return NextResponse.json({ error: 'Chave de arquivo inválida.', code: 'invalid_input' }, { status: 400 });
      }
      fileKey = normalized;
    }

    // Autorização por chave: leitura exige permissão sobre o objeto
    if (!fileKey || !(await canReadMediaWithContract(fileKey, session))) {
      return NextResponse.json({ error: 'Arquivo não encontrado.', code: 'not_found' }, { status: 404 });
    }

    const presigned = await R2StorageService.createPresignedUrl({
      fileName,
      fileType,
      category,
      userId,
      operation,
      fileKey,
      expiresInSeconds: 300,
    });

    if (!presigned.success) {
      return NextResponse.json({ error: 'Armazenamento temporariamente indisponível.', code: 'service_unavailable' }, { status: 503 });
    }

    const watermark = R2StorageService.generateWatermarkMetadata(userId, getClientIp(request.headers));

    return NextResponse.json({
      ...presigned,
      watermark,
    });
  } catch (err: unknown) {
    console.error('[drive/signed-url] Erro:', err);
    return NextResponse.json({ error: 'Erro ao gerar URL assinada.', code: 'generic' }, { status: 500 });
  }
}
