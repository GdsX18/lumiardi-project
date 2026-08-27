import { NextRequest, NextResponse } from 'next/server';
import { R2StorageService } from '@/lib/storage/r2Service';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

/**
 * Procura um arquivo correspondente no diretório public local.
 */
function findLocalFile(fileKey: string): string | null {
  const publicDir = path.join(process.cwd(), 'public');
  const normalizedKey = fileKey.replace(/^\/+/, '');

  const candidatePaths = [
    path.join(publicDir, normalizedKey),
    path.join(publicDir, normalizedKey.replace(/^assets\//, '')),
    path.join(publicDir, 'assets', normalizedKey),
    path.join(publicDir, 'assets', normalizedKey.replace(/^assets\//, '')),
    path.join(publicDir, normalizedKey.replace(/_/g, ' ')),
    path.join(publicDir, normalizedKey.replace(/\s+/g, '_')),
    path.join(publicDir, 'images', path.basename(normalizedKey)),
    path.join(publicDir, 'assets', 'images', path.basename(normalizedKey)),
    path.join(publicDir, path.basename(normalizedKey)),
    path.join(publicDir, path.basename(normalizedKey).replace(/_/g, ' ')),
    path.join(publicDir, 'assets', path.basename(normalizedKey)),
  ];

  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        return p;
      }
    } catch {
      // continua buscando
    }
  }
  return null;
}

/**
 * Serve um arquivo local com suporte a Range requests (HTTP 206) para vídeos e áudio.
 */
function serveLocalFile(filePath: string, request: NextRequest) {
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const rangeHeader = request.headers.get('range');
  const contentType = inferContentType(filePath);

  if (rangeHeader) {
    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize || start > end) {
      return new NextResponse(null, {
        status: 416,
        headers: { 'Content-Range': `bytes */${fileSize}` },
      });
    }

    const chunksize = end - start + 1;
    const stream = fs.createReadStream(filePath, { start, end });
    const chunks: Buffer[] = [];

    return new Promise<NextResponse>((resolve) => {
      stream.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      stream.on('end', () => {
        const bodyBuffer = Buffer.concat(chunks);
        resolve(
          new NextResponse(bodyBuffer, {
            status: 206,
            headers: {
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'Accept-Ranges': 'bytes',
              'Content-Length': String(chunksize),
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          })
        );
      });
    });
  }

  const fileBuffer = fs.readFileSync(filePath);
  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(fileSize),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

/**
 * Rota proxy resiliente para servir arquivos locais e do Cloudflare R2.
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

    // 1. Tentar localizar primeiro no filesystem local (public) para entrega instantânea com 0 cold-start
    const localFilePath = findLocalFile(fileKey);
    if (localFilePath) {
      return await serveLocalFile(localFilePath, request);
    }

    // 2. Se não estiver local, busca no Cloudflare R2
    const client = R2StorageService.getClient();
    const bucketName = R2StorageService.getBucketName();

    if (!client) {
      return NextResponse.json(
        { error: 'Arquivo não encontrado localmente e Cloudflare R2 não configurado no ambiente.' },
        { status: 404 }
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
    } catch {
      // Se não encontrar, tenta prefixar com 'assets/' ou 'assets/images/' ou 'vault/'
      const possibleKeys = [
        `assets/${fileKey}`,
        `assets/images/${fileKey}`,
        `vault/${fileKey}`,
        fileKey.replace(/\s+/g, '_'),
        `assets/${fileKey.replace(/\s+/g, '_')}`,
        fileKey.replace(/^assets\//, ''),
        fileKey.replace(/^assets\/images\//, ''),
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
        return NextResponse.json({ error: 'Arquivo não encontrado no Cloudflare R2 nem localmente.' }, { status: 404 });
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
      return NextResponse.json({ error: 'Arquivo não encontrado.' }, { status: 404 });
    }
    console.error('[MEDIA PROXY ERROR]:', err);
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
