import { NextRequest, NextResponse } from 'next/server';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { StorageService } from '@/services/storageService';
import { sanitizeInput } from '@/lib/security';
import { BillingService } from '@/lib/payments/billingService';
import { getPlan } from '@/lib/payments/plansConfig';

export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

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
    const sizeStr = body.size || '1.0 MB';

    if (!name || !fileUrl) {
      return NextResponse.json({ error: 'Nome e URL/conteúdo do arquivo são obrigatórios.' }, { status: 400 });
    }

    // Validação estrita de limites de cota do Plano
    const [usage, subscription] = await Promise.all([
      StorageService.getUserDriveUsage(session.id),
      BillingService.getUserSubscription(session.id),
    ]);

    const defaultPlanId = session.role === 'agencia' ? 'select' : 'glow';
    const plan = getPlan(subscription?.planId || defaultPlanId);
    const maxGB = typeof plan.limits.maxDriveStorageGB === 'number' ? plan.limits.maxDriveStorageGB : 5;

    const newFileBytes = StorageService.parseSizeToBytes(sizeStr);
    const newFileGB = newFileBytes / (1024 * 1024 * 1024);

    if (usage.totalGB + newFileGB > maxGB) {
      return NextResponse.json(
        {
          error: `Limite de armazenamento do plano ${plan.name} atingido (${maxGB} GB). Faça upgrade para continuar enviando novos arquivos.`,
          currentUsageGB: usage.totalGB,
          maxStorageGB: maxGB,
        },
        { status: 403 }
      );
    }

    const savedFile = await StorageService.saveDriveFile({
      userId: session.id,
      name,
      category: body.category || 'raw-photos',
      type: body.type || 'image',
      size: sizeStr,
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
  } catch {
    return NextResponse.json({ error: 'Erro ao registrar download' }, { status: 500 });
  }
}
