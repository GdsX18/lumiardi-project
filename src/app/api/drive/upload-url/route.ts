import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';
import { R2StorageService } from '@/lib/storage/r2Service';
import { StorageService } from '@/services/storageService';
import { BillingService } from '@/lib/payments/billingService';
import { getPlan } from '@/lib/payments/plansConfig';
import { sanitizeInput } from '@/lib/security';
import { checkUpload, normalizeCategory } from '@/lib/storage/uploadPolicy';

/** Existe vínculo (contrato não encerrado) entre a agência e a modelo? */
async function hasPartnership(agencyId: string, modelId: string): Promise<boolean> {
  const contracts = await StorageService.listAgencyContracts(agencyId);
  return contracts.some((c) => c.modelId === modelId && c.status !== 'terminated');
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: 'Sessão expirada ou não autenticado.' }, { status: 401 });
    }

    const body = await req.json();
    const rawFileName = body.fileName || 'arquivo_lumiardi';
    const fileName = sanitizeInput(rawFileName);
    const fileType = String(body.fileType || 'application/octet-stream');
    const fileSizeBytes = Number(body.fileSize);
    const category = normalizeCategory(body.category, 'raw-photos');
    const context = body.context === 'shared' ? 'shared' : 'private';

    // Tipo e tamanho reais (em bytes) são obrigatórios; o tamanho é assinado na URL de PUT
    const check = checkUpload(fileType, fileSizeBytes);
    if (!check.ok) {
      return NextResponse.json({ error: check.error, code: check.code }, { status: check.code === 'upload_type' ? 415 : 413 });
    }

    const newFileBytes = fileSizeBytes;
    const newFileGB = newFileBytes / (1024 * 1024 * 1024);

    let finalAgencyId = body.agencyId;
    let finalModelId = body.modelId;

    if (context === 'shared') {
      if (session.role === 'criadora') {
        finalModelId = session.id;
        if (!finalAgencyId) {
          const contracts = await StorageService.listModelContracts(session.id);
          const activeContract = contracts.find((c) => c.status === 'active') || contracts[0];
          finalAgencyId = activeContract?.agencyId;
          if (!finalAgencyId) {
            const user = await StorageService.getUserById(session.id);
            finalAgencyId = (user?.profile as any)?.represented_agency_id;
          }
        }
      } else if (session.role === 'agencia') {
        finalAgencyId = session.id;
        if (!finalModelId) {
          return NextResponse.json(
            { error: 'Selecione uma modelo do elenco para realizar o upload compartilhado.' },
            { status: 400 }
          );
        }
      }

      if (!finalAgencyId || !finalModelId || (session.role !== 'criadora' && session.role !== 'agencia')) {
        return NextResponse.json(
          { error: 'Vínculo de agenciamento não identificado para o espaço compartilhado.' },
          { status: 400 }
        );
      }

      if (!(await hasPartnership(String(finalAgencyId), String(finalModelId)))) {
        return NextResponse.json(
          { error: 'Não há vínculo ativo de agenciamento entre agência e modelo.', code: 'forbidden' },
          { status: 403 }
        );
      }

      // Regra de Cota: Todo arquivo no drive compartilhado consome a cota da AGÊNCIA
      const [agencyUsage, agencySub] = await Promise.all([
        StorageService.getAgencyTotalDriveUsage(finalAgencyId),
        BillingService.getUserSubscription(finalAgencyId),
      ]);

      const agencyPlan = getPlan(agencySub?.planId || 'select');
      const maxAgencyGB = typeof agencyPlan.limits.maxDriveStorageGB === 'number'
        ? agencyPlan.limits.maxDriveStorageGB
        : 100;

      if (agencyUsage.totalGB + newFileGB > maxAgencyGB) {
        return NextResponse.json(
          {
            error: `Limite de armazenamento da Agência parceira atingido (${maxAgencyGB} GB no plano ${agencyPlan.name}). A agência precisa realizar upgrade para permitir novos envios.`,
            agencyUsageGB: agencyUsage.totalGB,
            maxStorageGB: maxAgencyGB,
          },
          { status: 403 }
        );
      }
    } else {
      // Regra de Cota: No drive privado, consome a cota do usuário proprietário
      const [userUsage, userSub] = await Promise.all([
        StorageService.getUserDriveUsage(session.id),
        BillingService.getUserSubscription(session.id),
      ]);

      const defaultPlan = session.role === 'agencia' ? 'select' : 'glow';
      const userPlan = getPlan(userSub?.planId || defaultPlan);
      const maxUserGB = typeof userPlan.limits.maxDriveStorageGB === 'number'
        ? userPlan.limits.maxDriveStorageGB
        : 5;

      if (userUsage.totalGB + newFileGB > maxUserGB) {
        return NextResponse.json(
          {
            error: `Limite de armazenamento pessoal atingido (${maxUserGB} GB no plano ${userPlan.name}). Faça upgrade para continuar enviando arquivos.`,
            currentUsageGB: userUsage.totalGB,
            maxStorageGB: maxUserGB,
          },
          { status: 403 }
        );
      }
    }

    // Geração de Presigned URL direta para o Cloudflare R2
    const presigned = await R2StorageService.createPresignedUrl({
      fileName,
      fileType,
      category,
      userId: session.id,
      operation: 'upload',
      contentLength: fileSizeBytes,
      expiresInSeconds: 300,
      context,
      agencyId: finalAgencyId,
      modelId: finalModelId,
    });

    if (!presigned.success) {
      return NextResponse.json({ error: 'Armazenamento temporariamente indisponível.', code: 'service_unavailable' }, { status: 503 });
    }

    // Arquivos do vault são sempre servidos pela rota autenticada
    const finalFileUrl = `/api/media/${presigned.fileKey}`;

    return NextResponse.json({
      success: true,
      uploadUrl: presigned.signedUrl,
      fileKey: presigned.fileKey,
      fileUrl: finalFileUrl,
      expiresIn: 300,
      context,
      agencyId: finalAgencyId,
      modelId: finalModelId,
    });
  } catch (err: unknown) {
    console.error('[UploadUrl Error]:', err);
    return NextResponse.json({ error: 'Erro ao emitir URL pré-assinada.', code: 'generic' }, { status: 500 });
  }
}

