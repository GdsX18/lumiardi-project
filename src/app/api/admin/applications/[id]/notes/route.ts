import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { sanitizeInput } from '@/lib/security';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const notes = await StorageService.getApplicationNotes(id);

    return NextResponse.json({ success: true, notes });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao listar notas';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const text = sanitizeInput(body.text);

    if (!text) {
      return NextResponse.json(
        { error: 'O conteúdo da anotação é obrigatório.' },
        { status: 400 }
      );
    }

    const note = await StorageService.addApplicationNote(id, {
      author: session.email || 'curadoria@lumiardi.com',
      text,
    });

    return NextResponse.json({ success: true, note });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao salvar nota';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
