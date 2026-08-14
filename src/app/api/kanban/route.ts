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

    const tasks = await StorageService.listKanbanTasks(session.id);
    return NextResponse.json({ success: true, tasks });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao listar tarefas do kanban';
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
    const title = sanitizeInput(body.title);
    const agencyName = body.agencyName ? sanitizeInput(body.agencyName) : undefined;
    const priority = body.priority || 'Alta';
    const dueDate = body.dueDate ? sanitizeInput(body.dueDate) : 'Em aberto';
    const columnStatus = body.columnStatus || 'todo';

    if (!title) {
      return NextResponse.json({ error: 'O título da tarefa é obrigatório.' }, { status: 400 });
    }

    const task = await StorageService.createKanbanTask({
      userId: session.id,
      title,
      agencyName,
      priority,
      dueDate,
      columnStatus,
    });

    return NextResponse.json({ success: true, task });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao criar tarefa';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: 'ID da tarefa obrigatório.' }, { status: 400 });
    }

    await StorageService.updateKanbanTask(body.id, {
      columnStatus: body.columnStatus,
      title: body.title ? sanitizeInput(body.title) : undefined,
      priority: body.priority,
    });

    return NextResponse.json({ success: true, message: 'Tarefa atualizada com sucesso.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao atualizar tarefa';
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
      return NextResponse.json({ error: 'ID da tarefa obrigatório.' }, { status: 400 });
    }

    await StorageService.deleteKanbanTask(id);
    return NextResponse.json({ success: true, message: 'Tarefa removida com sucesso.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao deletar tarefa';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
