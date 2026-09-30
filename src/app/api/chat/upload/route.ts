import { NextRequest, NextResponse } from 'next/server';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { R2StorageService } from '@/lib/storage/r2Service';
import { sanitizeInput } from '@/lib/security';
import { checkUpload } from '@/lib/storage/uploadPolicy';

// MIME types permitidos para chat attachments
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

const MAX_FILE_NAME_LENGTH = 200;
const MAX_CHAT_FILE_BYTES = 15 * 1024 * 1024;

function fail(status: number, code: string, error: string) {
  return NextResponse.json({ error, code }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    if (!session) {
      return fail(401, 'unauthorized', 'Não autenticado.');
    }

    const body = await request.json().catch(() => ({}));
    const rawFileName = String(body.fileName || '').trim();
    const fileType = String(body.fileType || '').trim().toLowerCase();
    const fileSize = body.fileSize !== undefined ? Number(body.fileSize) : undefined;

    if (!rawFileName || !fileType) {
      return fail(400, 'invalid_input', 'fileName e fileType são obrigatórios.');
    }

    if (!ALLOWED_MIME_TYPES.has(fileType)) {
      return fail(415, 'upload_type', 'Tipo de arquivo não permitido. Use: JPG, PNG, WEBP ou PDF.');
    }

    const check = checkUpload(fileType, fileSize, MAX_CHAT_FILE_BYTES);
    if (!check.ok) {
      return fail(check.code === 'upload_type' ? 415 : 413, check.code, check.error);
    }

    const fileName = sanitizeInput(rawFileName).slice(0, MAX_FILE_NAME_LENGTH);

    // Sem R2 configurado o cliente usa o fallback de upload pelo servidor (/api/upload)
    const client = R2StorageService.getClient();
    if (!client) {
      return NextResponse.json({ fallback: true });
    }

    // Categoria 'chat': legível por qualquer usuária autenticada (o destinatário precisa abrir o anexo)
    const result = await R2StorageService.createPresignedUrl({
      fileName,
      fileType,
      category: 'chat',
      userId: session.id,
      operation: 'upload',
      contentLength: fileSize,
      expiresInSeconds: 300,
    });

    if (!result.success) {
      return fail(503, 'service_unavailable', 'Erro ao gerar URL de upload.');
    }

    return NextResponse.json({
      success: true,
      uploadUrl: result.signedUrl,
      fileKey: result.fileKey,
      // URL permanente e autenticada para leitura do anexo (a uploadUrl expira e só serve para PUT)
      mediaUrl: `/api/media/${result.fileKey}`,
      expiresAt: result.expiresAt,
    });
  } catch (err: unknown) {
    console.error('[chat/upload] Erro:', err);
    return fail(500, 'generic', 'Erro ao processar upload.');
  }
}
