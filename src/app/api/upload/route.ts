import { NextRequest, NextResponse } from 'next/server';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { R2StorageService } from '@/lib/storage/r2Service';
import path from 'path';

/**
 * Rota de Upload Unificada — 100% Cloudflare R2
 * 
 * Aceita multipart/form-data ou JSON com base64.
 * Todos os arquivos são armazenados exclusivamente no Cloudflare R2.
 * A URL retornada aponta para a proxy interna /api/media/[...key].
 */
export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);
    const userId = session?.id || 'anonymous-upload';

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const category = (formData.get('category') as string) || 'uploads';

      if (!file) {
        return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = path.extname(file.name) || '.bin';
      const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}${ext}`;
      const r2Key = `vault/${userId}/${category}/${cleanFileName}`;

      // Upload direto para Cloudflare R2
      const r2Result = await R2StorageService.uploadBuffer({
        key: r2Key,
        buffer,
        contentType: file.type || 'application/octet-stream',
        metadata: {
          uploadedBy: userId,
          originalName: encodeURIComponent(file.name),
        },
      });

      if (!r2Result.success) {
        console.error('[UPLOAD] Falha no R2:', r2Result.error);
        return NextResponse.json(
          { error: 'Falha ao enviar arquivo para o armazenamento. Tente novamente.' },
          { status: 502 }
        );
      }

      console.log(`[R2 UPLOAD] Arquivo enviado: ${r2Key}`);

      // URL via proxy interna — serve o arquivo direto do R2
      const mediaUrl = `/api/media/${r2Key}`;

      return NextResponse.json({
        success: true,
        url: mediaUrl,
        r2Key: r2Result.key,
        r2Success: true,
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        type: file.type,
      });
    } else {
      // JSON body com Data URI ou URL
      const body = await request.json();
      if (!body.data && !body.url) {
        return NextResponse.json({ error: 'Nenhum dado ou URL de mídia fornecida.' }, { status: 400 });
      }

      // Se for Data URI em base64, envia para o R2
      if (body.data && typeof body.data === 'string' && body.data.startsWith('data:')) {
        const matches = body.data.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          const ext = mimeType.split('/')[1] || 'bin';
          const r2Key = `vault/${userId}/uploads/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
          
          const uploadRes = await R2StorageService.uploadBuffer({
            key: r2Key,
            buffer,
            contentType: mimeType,
            metadata: { uploadedBy: userId },
          });

          if (uploadRes.success) {
            const mediaUrl = `/api/media/${r2Key}`;
            return NextResponse.json({
              success: true,
              url: mediaUrl,
              r2Key,
              r2Success: true,
              name: body.name || 'arquivo_upload',
              size: body.size || `${(buffer.length / (1024 * 1024)).toFixed(2)} MB`,
              type: mimeType,
            });
          }
        }
      }

      // Se for URL externa, apenas retorna como está
      return NextResponse.json({
        success: true,
        url: body.url || body.data,
        r2Key: undefined,
        r2Success: false,
        name: body.name || 'arquivo_upload',
        size: body.size || '1.0 MB',
        type: body.type || 'image/jpeg',
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao processar upload';
    console.error('Erro na rota de upload:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
