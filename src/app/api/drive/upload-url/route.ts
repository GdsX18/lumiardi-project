import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';
import { R2StorageService } from '@/lib/storage/r2Service';
import { StorageService } from '@/services/storageService';
import { BillingService } from '@/lib/payments/billingService';
import { getPlan } from '@/lib/payments/plansConfig';
import { sanitizeInput } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: 'Sessão expirada ou não autenticado.' }, { status: 401 });
    }

    const body = await req.json();
    const rawFileName = body.fileName || 'arquivo_lumiardi';
    const fileName = sanitizeInput(rawFileName);
    const fileType = body.fileType || 'application/octet-stream';
    const fileSizeStr = typeof body.fileSize === 'number' 
      ? `${(body.fileSize / (1024 * 1024)).toFixed(2)} MB` 
      : (body.fileSize || '1.0 MB');
    const category = (body.category || 'raw-photos') as 'raw-photos' | 'videos' | 'contracts' | 'briefings' | 'avatars' | 'uploads';
    const context = body.context === 'shared' ? 'shared' : 'private';

    const newFileBytes = StorageService.parseSizeToBytes(fileSizeStr);
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

      if (!finalAgencyId || !finalModelId) {
        return NextResponse.json(
          { error: 'Vínculo de agenciamento não identificado para o espaço compartilhado.' },
          { status: 400 }
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
      expiresInSeconds: 300,
      context,
      agencyId: finalAgencyId,
      modelId: finalModelId,
    });

    const publicCdn = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN;
    const finalFileUrl = presigned.publicCdnUrl || (publicCdn 
      ? `https://${publicCdn.replace(/^https?:\/\//, '').replace(/\/$/, '')}/${presigned.fileKey}`
      : `/api/media/${presigned.fileKey}`);

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
    const message = err instanceof Error ? err.message : 'Erro ao emitir URL pré-assinada';
    console.error('[UploadUrl Error]:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

