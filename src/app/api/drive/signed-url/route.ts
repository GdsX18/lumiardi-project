import { NextRequest, NextResponse } from 'next/server';
import { R2StorageService } from '@/lib/storage/r2Service';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { sanitizeInput } from '@/lib/security';
import { canReadMedia, canWriteMedia, normalizeMediaKey } from '@/lib/storage/mediaAccess';
import { checkUpload, normalizeCategory } from '@/lib/storage/uploadPolicy';
import { getClientIp } from '@/lib/security/rateLimiter';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    if (!session?.id) {
      return NextResponse.json({ error: 'Sessão expirada ou não autenticada.', code: 'unauthorized' }, { status: 401 });
    }

    const userId = session.id;
    const operation = rawBody.operation === 'download' ? 'download' : 'upload';
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

    // Autorização por chave: leitura exige permissão sobre o objeto; escrita só no próprio espaço
    if (operation === 'download') {
      if (!fileKey || !canReadMedia(fileKey, session)) {
        return NextResponse.json({ error: 'Arquivo não encontrado.', code: 'not_found' }, { status: 404 });
      }
    } else if (fileKey && !canWriteMedia(fileKey, session)) {
      return NextResponse.json({ error: 'Sem permissão para gravar neste arquivo.', code: 'forbidden' }, { status: 403 });
    }

    let contentLength: number | undefined;
    if (operation === 'upload') {
      const size = rawBody.fileSizeBytes !== undefined ? Number(rawBody.fileSizeBytes) : undefined;
      const check = checkUpload(fileType, size);
      if (!check.ok) {
        return NextResponse.json({ error: check.error, code: check.code }, { status: check.code === 'upload_type' ? 415 : 413 });
      }
      contentLength = size;
    }

    const presigned = await R2StorageService.createPresignedUrl({
      fileName,
      fileType,
      category,
      userId,
      operation,
      fileKey,
      contentLength,
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
