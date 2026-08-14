import { NextRequest, NextResponse } from 'next/server';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = path.extname(file.name) || '.bin';
      const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}${ext}`;
      
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      try {
        await fs.mkdir(uploadsDir, { recursive: true });
        await fs.writeFile(path.join(uploadsDir, cleanFileName), buffer);
        const fileUrl = `/uploads/${cleanFileName}`;

        return NextResponse.json({
          success: true,
          url: fileUrl,
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          type: file.type,
        });
      } catch (fsErr) {
        // Fallback para Data URI em ambientes serverless/read-only
        const base64Data = `data:${file.type};base64,${buffer.toString('base64')}`;
        return NextResponse.json({
          success: true,
          url: base64Data,
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          type: file.type,
        });
      }
    } else {
      // JSON body com Data URI ou URL
      const body = await request.json();
      if (!body.data && !body.url) {
        return NextResponse.json({ error: 'Nenhum dado ou URL de mídia fornecida.' }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        url: body.data || body.url,
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
