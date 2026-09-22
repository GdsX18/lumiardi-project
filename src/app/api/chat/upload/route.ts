import { NextRequest, NextResponse } from 'next/server';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { R2StorageService } from '@/lib/storage/r2Service';
import { sanitizeInput } from '@/lib/security';

// MIME types permitidos para chat attachments
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

const MAX_FILE_NAME_LENGTH = 200;

export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const body = await request.json();
    const rawFileName = String(body.fileName || '').trim();
    const fileType = String(body.fileType || '').trim().toLowerCase();

    if (!rawFileName || !fileType) {
      return NextResponse.json({ error: 'fileName e fileType são obrigatórios.' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(fileType)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use: JPG, PNG, WEBP ou PDF.' },
        { status: 415 }
      );
    }

    const fileName = sanitizeInput(rawFileName).slice(0, MAX_FILE_NAME_LENGTH);

    // Tenta gerar Presigned URL via Cloudflare R2
    const client = R2StorageService.getClient();
    if (!client) {
      // R2 não configurado neste ambiente: sinaliza fallback para o cliente
      return NextResponse.json({ fallback: true });
    }

    const result = await R2StorageService.createPresignedUrl({
      fileName,
      fileType,
      category: 'uploads',
      userId: session.id,
      operation: 'upload',
      expiresInSeconds: 300, // 5 minutos
    });

    if (!result.success) {
      return NextResponse.json({ error: 'Erro ao gerar URL de upload.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      uploadUrl: result.signedUrl,
      fileKey: result.fileKey,
      publicUrl: result.publicCdnUrl || null,
      expiresAt: result.expiresAt,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao processar upload';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

