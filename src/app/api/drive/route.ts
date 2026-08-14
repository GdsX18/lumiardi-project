import { NextRequest, NextResponse } from 'next/server';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { StorageService } from '@/services/storageService';
import { sanitizeInput } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const files = await StorageService.listDriveFiles(session.id);
    return NextResponse.json({ success: true, files });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao listar arquivos do drive';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const body = await request.json();
    const name = sanitizeInput(body.name);
    const fileUrl = body.fileUrl || body.url || body.fileData;

    if (!name || !fileUrl) {
      return NextResponse.json({ error: 'Nome e URL/conteúdo do arquivo são obrigatórios.' }, { status: 400 });
    }

    const savedFile = await StorageService.saveDriveFile({
      userId: session.id,
      name,
      category: body.category || 'raw-photos',
      type: body.type || 'image',
      size: body.size || '1.0 MB',
      uploadedBy: session.name || 'Você',
      fileUrl,
      privacy: body.privacy || 'agency-only',
    });

    return NextResponse.json({ success: true, file: savedFile });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao salvar arquivo no drive';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do arquivo não informado.' }, { status: 400 });
    }

    await StorageService.deleteDriveFile(id);
    return NextResponse.json({ success: true, message: 'Arquivo removido com sucesso.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao deletar arquivo do drive';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.id) {
      await StorageService.incrementDriveDownloads(body.id);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'ID ausente.' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Erro ao registrar download' }, { status: 500 });
  }
}
