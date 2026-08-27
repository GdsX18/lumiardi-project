import { NextRequest, NextResponse } from 'next/server';
import { R2StorageService } from '@/lib/storage/r2Service';
import { GetObjectCommand } from '@aws-sdk/client-s3';

/**
 * Rota proxy para servir qualquer arquivo do Cloudflare R2.
 * Suporta:
 *  - Imagens de perfil/avatar: /api/media/vault/user-id/avatars/...
 *  - Fotos do Book: /api/media/vault/user-id/raw-photos/...
 *  - Uploads gerais: /api/media/vault/user-id/uploads/...
 *  - Documentos e contratos: /api/media/vault/user-id/contracts/...
 *  - Assets globais do site: /api/media/assets/images/... ou /api/media/assets/...
 * 
 * Inclui suporte a:
 *  - Decodificação de URI (espaços, caracteres especiais)
 *  - Streaming de vídeo com HTTP 206 (Range headers)
 *  - Fallbacks de chave contextual (assets/images/...)
 *  - Headers de cache de alta performance
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key: keySegments } = await params;
    let fileKey = keySegments.map((s) => decodeURIComponent(s)).join('/');

    if (!fileKey || fileKey.length < 2) {
      return NextResponse.json({ error: 'Chave de arquivo inválida.' }, { status: 400 });
    }

    const client = R2StorageService.getClient();
    const bucketName = R2StorageService.getBucketName();

    if (!client) {
      return NextResponse.json(
        { error: 'Cloudflare R2 não configurado no ambiente.' },
        { status: 503 }
      );
    }

    const rangeHeader = request.headers.get('range');

    // Tentar obter o objeto com a chave solicitada
    let response;
    try {
      response = await client.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: fileKey,
          ...(rangeHeader ? { Range: rangeHeader } : {}),
        })
      );
    } catch (primaryErr: unknown) {
      // Se não encontrar, tenta prefixar com 'assets/' ou 'assets/images/'
      const possibleKeys = [
        `assets/${fileKey}`,
        `assets/images/${fileKey}`,
        `vault/${fileKey}`,
        fileKey.replace(/\s+/g, '_'),
        `assets/${fileKey.replace(/\s+/g, '_')}`,
      ];

      let found = false;
      for (const altKey of possibleKeys) {
        try {
          response = await client.send(
            new GetObjectCommand({
              Bucket: bucketName,
              Key: altKey,
              ...(rangeHeader ? { Range: rangeHeader } : {}),
            })
          );
          if (response) {
            found = true;
            fileKey = altKey;
            break;
          }
        } catch {
          // continua tentando
        }
      }

      if (!found || !response) {
        return NextResponse.json({ error: 'Arquivo não encontrado no Cloudflare R2.' }, { status: 404 });
      }
    }

    if (!response.Body) {
      return NextResponse.json({ error: 'Corpo do arquivo vazio.' }, { status: 404 });
    }

    const bodyBytes = await response.Body.transformToByteArray();
    const contentType = response.ContentType || inferContentType(fileKey);

    const isPartial = Boolean(rangeHeader && response.ContentRange);
    const status = isPartial ? 206 : 200;

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Length': String(response.ContentLength || bodyBytes.length),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': '*',
      'Accept-Ranges': 'bytes',
    };

    if (response.ContentRange) {
      headers['Content-Range'] = response.ContentRange;
    }

    return new NextResponse(Buffer.from(bodyBytes), {
      status,
      headers,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao processar mídia';
    if (message.includes('NoSuchKey') || message.includes('404')) {
      return NextResponse.json({ error: 'Arquivo não encontrado no Cloudflare R2.' }, { status: 404 });
    }
    console.error('[R2 PROXY ERROR]:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function inferContentType(key: string): string {
  const ext = key.split('.').pop()?.toLowerCase() || '';
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    avif: 'image/avif',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return mimeMap[ext] || 'application/octet-stream';
}
