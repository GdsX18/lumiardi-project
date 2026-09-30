import { NextRequest, NextResponse } from 'next/server';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { R2StorageService } from '@/lib/storage/r2Service';
import { checkUpload, normalizeCategory, UPLOAD_LIMITS } from '@/lib/storage/uploadPolicy';

/**
 * Rota de Upload Unificada — 100% Cloudflare R2
 *
 * Aceita multipart/form-data ou JSON com Data URI base64 (arquivos pequenos: avatar, fotos, anexos).
 * O arquivo passa pela memória do servidor, então o tamanho é limitado a UPLOAD_LIMITS.serverBuffered;
 * arquivos grandes (vídeos do drive) usam URL pré-assinada em /api/drive/upload-url.
 * A URL retornada aponta para a proxy autenticada /api/media/[...key].
 */

const MAX_BYTES = UPLOAD_LIMITS.serverBuffered;
// Margem para o overhead do multipart / base64
const MAX_REQUEST_BYTES = Math.ceil(MAX_BYTES * 1.4) + 64 * 1024;

function reject(status: number, code: string, error: string) {
  return NextResponse.json({ error, code }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const session = decodeSession(request.cookies.get(SESSION_COOKIE_NAME)?.value);
    if (!session) {
      return reject(401, 'unauthorized', 'Faça login para enviar arquivos.');
    }
    const userId = session.id;

    // Rejeita antes de ler o corpo quando o tamanho declarado já excede o limite
    const declaredLength = Number(request.headers.get('content-length') || 0);
    if (declaredLength > MAX_REQUEST_BYTES) {
      return reject(413, 'upload_too_large', 'Arquivo muito grande.');
    }

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const category = normalizeCategory(formData.get('category'));

      if (!file) {
        return reject(400, 'invalid_input', 'Nenhum arquivo enviado.');
      }

      const check = checkUpload(file.type, file.size, MAX_BYTES);
      if (!check.ok) {
        return reject(check.code === 'upload_type' ? 415 : 413, check.code, check.error);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const r2Key = R2StorageService.generateFileKey({ userId, category, fileName: file.name || 'arquivo' });

      const r2Result = await R2StorageService.uploadBuffer({
        key: r2Key,
        buffer,
        contentType: file.type,
        metadata: {
          uploadedBy: userId,
          originalName: encodeURIComponent(file.name),
        },
      });

      if (!r2Result.success) {
        console.error('[UPLOAD] Falha no R2:', r2Result.error);
        return reject(502, 'service_unavailable', 'Falha ao enviar arquivo para o armazenamento. Tente novamente.');
      }

      return NextResponse.json({
        success: true,
        url: `/api/media/${r2Key}`,
        r2Key: r2Result.key,
        r2Success: true,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        type: file.type,
      });
    }

    // JSON com Data URI em base64
    const body = await request.json();
    if (typeof body.data !== 'string' || !body.data.startsWith('data:')) {
      return reject(400, 'invalid_input', 'Envie o arquivo como multipart/form-data ou Data URI base64.');
    }

    const matches = body.data.match(/^data:([^;,]+);base64,(.+)$/);
    if (!matches) {
      return reject(400, 'invalid_input', 'Data URI inválida.');
    }

    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const check = checkUpload(mimeType, buffer.length, MAX_BYTES);
    if (!check.ok) {
      return reject(check.code === 'upload_type' ? 415 : 413, check.code, check.error);
    }

    const ext = mimeType.split('/')[1]?.replace(/[^a-z0-9]/gi, '') || 'bin';
    const r2Key = R2StorageService.generateFileKey({
      userId,
      category: normalizeCategory(body.category),
      fileName: `${String(body.name || 'arquivo').replace(/\.[^.]+$/, '')}.${ext}`,
    });

    const uploadRes = await R2StorageService.uploadBuffer({
      key: r2Key,
      buffer,
      contentType: mimeType,
      metadata: { uploadedBy: userId },
    });

    if (!uploadRes.success) {
      console.error('[UPLOAD] Falha no R2:', uploadRes.error);
      return reject(502, 'service_unavailable', 'Falha ao enviar arquivo para o armazenamento. Tente novamente.');
    }

    return NextResponse.json({
      success: true,
      url: `/api/media/${r2Key}`,
      r2Key,
      r2Success: true,
      name: body.name || 'arquivo_upload',
      size: `${(buffer.length / (1024 * 1024)).toFixed(2)} MB`,
      type: mimeType,
    });
  } catch (err: unknown) {
    console.error('Erro na rota de upload:', err);
    return reject(500, 'generic', 'Erro ao processar upload.');
  }
}
