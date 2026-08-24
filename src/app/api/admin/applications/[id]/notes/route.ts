import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { AuditLogService } from '@/lib/audit/auditService';
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

    // Registrar no AuditLog
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const targetUserRecord = (await StorageService.getUserById(id)) as any;
    const targetName = targetUserRecord?.fullName || targetUserRecord?.user?.name || targetUserRecord?.basicInfo?.fullName || id;

    await AuditLogService.logAction({
      userId: session.id,
      userName: session.name,
      userEmail: session.email,
      userRole: session.curationRole || 'curador_junior',
      actionType: 'ADICIONOU_NOTA',
      targetId: id,
      targetName,
      targetType: 'MODELO',
      details: { noteSnippet: text.length > 100 ? `${text.substring(0, 100)}...` : text },
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, note });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao salvar nota';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
