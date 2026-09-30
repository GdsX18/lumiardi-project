import { NextRequest, NextResponse } from 'next/server';
import { R2StorageService } from '@/lib/storage/r2Service';
import { canReadMedia, getMediaAccessLevel, normalizeMediaKey, parseMediaKey } from '@/lib/storage/mediaAccess';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';

/**
 * Procura um arquivo correspondente no diretório public local.
 * Cada candidato é resolvido e precisa permanecer dentro de `public/` (anti path traversal).
 */
function findLocalFile(fileKey: string): string | null {
  const publicDir = path.resolve(path.join(/*turbopackIgnore: true*/ process.cwd(), 'public'));
  const normalizedKey = fileKey.replace(/^\/+/, '');
  const withoutAssets = normalizedKey.replace(/^assets\//, '');
  const baseName = path.basename(normalizedKey);

  const candidatePaths = [
    path.join(publicDir, normalizedKey),
    path.join(publicDir, withoutAssets),
    path.join(publicDir, 'assets', normalizedKey),
    path.join(publicDir, 'assets', withoutAssets),
    path.join(publicDir, normalizedKey.replace(/_/g, ' ')),
    path.join(publicDir, normalizedKey.replace(/\s+/g, '_')),
    path.join(publicDir, 'images', baseName),
    path.join(publicDir, 'assets', 'images', baseName),
    path.join(publicDir, baseName),
    path.join(publicDir, baseName.replace(/_/g, ' ')),
    path.join(publicDir, 'assets', baseName),
  ];

  for (const candidate of candidatePaths) {
    const resolved = path.resolve(candidate);
    if (!resolved.startsWith(publicDir + path.sep)) continue;
    try {
      if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
        return resolved;
      }
    } catch {
      // continua buscando
    }
  }
  return null;
}

/**
 * Interpreta um header Range de intervalo único (`bytes=a-b`, `bytes=a-`, `bytes=-n`).
 * Retorna null para ranges inválidos/insatisfatíveis.
 */
function parseRange(rangeHeader: string, fileSize: number): { start: number; end: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!match || fileSize === 0) return null;
  const [, rawStart, rawEnd] = match;
  let start: number;
  let end: number;
  if (rawStart === '') {
    if (rawEnd === '') return null;
    const suffix = parseInt(rawEnd, 10);
    if (suffix <= 0) return null;
    start = Math.max(0, fileSize - suffix);
    end = fileSize - 1;
  } else {
    start = parseInt(rawStart, 10);
    end = rawEnd === '' ? fileSize - 1 : Math.min(parseInt(rawEnd, 10), fileSize - 1);
  }
  if (start >= fileSize || start > end) return null;
  return { start, end };
}

const PUBLIC_CACHE = 'public, max-age=31536000, immutable';
const PRIVATE_CACHE = 'private, max-age=3600';

/** Tipos que o navegador executaria na origem do site — sempre servidos como download. */
const ACTIVE_CONTENT_TYPES = /^(text\/html|application\/xhtml|image\/svg|text\/xml|application\/xml|application\/javascript|text\/javascript)/i;

/**
 * Serve um arquivo local com suporte a Range requests (HTTP 206) para vídeos e áudio.
 */
function serveLocalFile(filePath: string, request: NextRequest) {
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const rangeHeader = request.headers.get('range');
  const contentType = inferContentType(filePath);

  if (rangeHeader) {
    const range = parseRange(rangeHeader, fileSize);
    if (!range) {
      return new NextResponse(null, {
        status: 416,
        headers: { 'Content-Range': `bytes */${fileSize}` },
      });
    }

    const { start, end } = range;
    const nodeStream = fs.createReadStream(filePath, { start, end });
    const webStream = Readable.toWeb(nodeStream);

    return new NextResponse(webStream as any, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(end - start + 1),
        'Content-Type': contentType,
        'Cache-Control': PUBLIC_CACHE,
      },
    });
  }

  const nodeStream = fs.createReadStream(filePath);
  const webStream = Readable.toWeb(nodeStream);
  return new NextResponse(webStream as any, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(fileSize),
      'Accept-Ranges': 'bytes',
      'Cache-Control': PUBLIC_CACHE,
    },
  });
}

function isMissingObject(err: unknown): boolean {
  const e = err as { name?: string; Code?: string; $metadata?: { httpStatusCode?: number } };
  return e?.name === 'NoSuchKey' || e?.Code === 'NoSuchKey' || e?.$metadata?.httpStatusCode === 404;
}

function isInvalidRange(err: unknown): boolean {
  const e = err as { name?: string; Code?: string; $metadata?: { httpStatusCode?: number } };
  return e?.name === 'InvalidRange' || e?.Code === 'InvalidRange' || e?.$metadata?.httpStatusCode === 416;
}

/**
 * Rota proxy para servir arquivos locais (public/) e do Cloudflare R2, com controle de acesso por chave.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key: keySegments } = await params;
    let decodedKey: string;
    try {
      decodedKey = keySegments.map((s) => decodeURIComponent(s)).join('/');
    } catch {
      return NextResponse.json({ error: 'Chave de arquivo inválida.' }, { status: 400 });
    }

    const normalized = normalizeMediaKey(decodedKey);
    if (!normalized || normalized.length < 2) {
      return NextResponse.json({ error: 'Chave de arquivo inválida.' }, { status: 400 });
    }
    let fileKey = normalized;

    const parsed = parseMediaKey(fileKey);
    const session = decodeSession(request.cookies.get(SESSION_COOKIE_NAME)?.value);
    if (!canReadMedia(fileKey, session)) {
      // 404 para usuário logado sem permissão: não revela a existência do objeto
      return NextResponse.json({ error: 'Arquivo não encontrado.' }, { status: session ? 404 : 401 });
    }
    const isPublic = getMediaAccessLevel(parsed) === 'public';

    // 1. Conteúdo público do site: tenta primeiro o filesystem local (public/)
    if (!parsed.isVault) {
      const localFilePath = findLocalFile(fileKey);
      if (localFilePath) {
        return serveLocalFile(localFilePath, request);
      }
    }

    // 2. Busca no Cloudflare R2
    const client = R2StorageService.getClient();
    const bucketName = R2StorageService.getBucketName();

    if (!client) {
      return NextResponse.json({ error: 'Arquivo não encontrado.' }, { status: 404 });
    }

    const rangeHeader = request.headers.get('range');

    // Chaves do vault são exatas; só conteúdo público tem variações legadas de caminho
    const candidateKeys = parsed.isVault
      ? [fileKey]
      : Array.from(
          new Set([
            fileKey,
            `assets/${fileKey}`,
            `assets/images/${fileKey}`,
            fileKey.replace(/\s+/g, '_'),
            fileKey.replace(/^assets\//, ''),
          ])
        );

    let response;
    for (const candidate of candidateKeys) {
      try {
        response = await client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: candidate,
            ...(rangeHeader ? { Range: rangeHeader } : {}),
          })
        );
        fileKey = candidate;
        break;
      } catch (err) {
        if (isInvalidRange(err)) {
          return new NextResponse(null, { status: 416 });
        }
        if (!isMissingObject(err)) throw err;
      }
    }

    if (!response?.Body) {
      return NextResponse.json({ error: 'Arquivo não encontrado.' }, { status: 404 });
    }

    const storedType = response.ContentType || inferContentType(fileKey);
    const isActiveContent = ACTIVE_CONTENT_TYPES.test(storedType);
    const contentType = isActiveContent ? 'application/octet-stream' : storedType;
    const isPartial = Boolean(rangeHeader && response.ContentRange);

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': isPublic ? PUBLIC_CACHE : PRIVATE_CACHE,
      'X-Content-Type-Options': 'nosniff',
      'Accept-Ranges': 'bytes',
    };
    if (isPublic) {
      headers['Access-Control-Allow-Origin'] = '*';
    } else {
      headers['Vary'] = 'Cookie';
    }
    if (isActiveContent) {
      headers['Content-Disposition'] = `attachment; filename="${path.basename(fileKey).replace(/"/g, '')}"`;
    }
    if (response.ContentLength !== undefined) {
      headers['Content-Length'] = String(response.ContentLength);
    }
    if (response.ContentRange) {
      headers['Content-Range'] = response.ContentRange;
    }

    // Streaming direto do R2 — sem acumular o arquivo em memória
    const stream = response.Body.transformToWebStream();

    return new NextResponse(stream as any, {
      status: isPartial ? 206 : 200,
      headers,
    });
  } catch (err: unknown) {
    console.error('[MEDIA PROXY ERROR]:', err);
    return NextResponse.json({ error: 'Erro ao processar mídia.' }, { status: 500 });
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
