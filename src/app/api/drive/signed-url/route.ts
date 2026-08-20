import { NextRequest, NextResponse } from 'next/server';
import { R2StorageService } from '@/lib/storage/r2Service';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { sanitizeInput } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    const userId = session?.id || rawBody.userId || 'user-model-1';
    const fileName = sanitizeInput(rawBody.fileName || 'arquivo_lumiardi.jpg');
    const fileType = sanitizeInput(rawBody.fileType || 'image/jpeg');
    const category = (rawBody.category || 'raw-photos') as 'raw-photos' | 'videos' | 'contracts' | 'briefings';
    const operation = (rawBody.operation || 'upload') as 'upload' | 'download';

    const presigned = await R2StorageService.createPresignedUrl({
      fileName,
      fileType,
      category,
      userId,
      operation,
      expiresInSeconds: 300,
    });

    const watermark = R2StorageService.generateWatermarkMetadata(
      userId,
      request.headers.get('x-forwarded-for') || '127.0.0.1'
    );

    return NextResponse.json({
      ...presigned,
      watermark,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao gerar URL assinada';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
