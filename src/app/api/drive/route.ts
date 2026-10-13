import { NextRequest, NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/apiAuth';
import { SESSION_COOKIE_NAME } from '@/lib/auth';
import { StorageService } from '@/services/storageService';
import { sanitizeInput } from '@/lib/security';
import { BillingService } from '@/lib/payments/billingService';
import { getPlan } from '@/lib/payments/plansConfig';

const DRIVE_PRIVACY = new Set(['public', 'agency-only', 'encrypted', 'official']);

export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await getActiveSession(cookie);

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const [files, usage, subscription] = await Promise.all([
      StorageService.listDriveFiles(session.id),
      StorageService.getUserDriveUsage(session.id),
      BillingService.getUserSubscription(session.id),
    ]);

    const defaultPlanId = session.role === 'agencia' ? 'select' : 'glow';
    const plan = getPlan(subscription?.planId || defaultPlanId);
    const maxGB = typeof plan.limits.maxDriveStorageGB === 'number' ? plan.limits.maxDriveStorageGB : 5;
    const percentage = Number(Math.min(100, (usage.totalGB / maxGB) * 100).toFixed(1));

    return NextResponse.json({
      success: true,
      files,
      storage: {
        usedGB: usage.totalGB,
        maxGB,
        percentage,
        planName: plan.name,
        fileCount: usage.fileCount,
      },
    });
  } catch (err: unknown) {
    console.error('[api/drive] Erro:', err);
    const message = 'Erro ao listar arquivos do drive';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await getActiveSession(cookie);

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    // Registro manual (URL/arquivo livre) só para a curadoria publicar documentos oficiais.
    // Usuárias enviam por /api/drive/upload-url + /api/drive/confirm, onde a URL e o tamanho
    // vêm do objeto gravado, nunca do corpo da requisição.
    if (session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Use o envio de arquivos do drive para adicionar documentos.', code: 'forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const name = sanitizeInput(body.name);
    const fileUrl = body.fileUrl || body.url || body.fileData;
    const sizeStr = body.size || '1.0 MB';

    if (!name || !fileUrl) {
      return NextResponse.json({ error: 'Nome e URL/conteúdo do arquivo são obrigatórios.' }, { status: 400 });
    }

    // Documentos oficiais da curadoria não contam cota de plano
    const savedFile = await StorageService.saveDriveFile({
      userId: session.id,
      name,
      category: body.category || 'raw-photos',
      type: body.type || 'image',
      size: sizeStr,
      uploadedBy: session.name || 'Você',
      fileUrl,
      privacy: DRIVE_PRIVACY.has(body.privacy) ? body.privacy : 'agency-only',
    });

    return NextResponse.json({ success: true, file: savedFile });
  } catch (err: unknown) {
    console.error('[api/drive] Erro:', err);
    const message = 'Erro ao salvar arquivo no drive';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await getActiveSession(cookie);

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do arquivo não informado.' }, { status: 400 });
    }

    const isAdmin = session.role === 'admin';
    const success = await StorageService.deleteDriveFile(id, session.id, isAdmin);
    if (!success) {
      return NextResponse.json(
        { error: 'Este documento oficial da plataforma é obrigatório e protegido contra exclusão.' },
        { status: 403 }
      );
    }
    return NextResponse.json({ success: true, message: 'Arquivo removido com sucesso.' });
  } catch (err: unknown) {
    console.error('[api/drive] Erro:', err);
    const message = 'Erro ao deletar arquivo do drive';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await getActiveSession(cookie);

    if (!session) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const body = await request.json();
    if (body.id) {
      await StorageService.incrementDriveDownloads(String(body.id), session.id);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'ID ausente.' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Erro ao registrar download' }, { status: 500 });
  }
}
