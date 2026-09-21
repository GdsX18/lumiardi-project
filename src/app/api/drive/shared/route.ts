import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { BillingService } from '@/lib/payments/billingService';
import { getPlan } from '@/lib/payments/plansConfig';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const queryAgencyId = searchParams.get('agencyId');
    const queryModelId = searchParams.get('modelId');

    let targetAgencyId = queryAgencyId;
    let targetModelId = queryModelId;
    let partners: Array<{ id: string; name: string; commissionRate?: string; status?: string }> = [];

    if (session.role === 'criadora') {
      targetModelId = session.id;
      const contracts = await StorageService.listModelContracts(session.id);
      
      partners = contracts.map((c) => ({
        id: c.agencyId,
        name: c.agencyName || 'Agência Parceira',
        commissionRate: c.commissionRate,
        status: c.status,
      }));

      // Fallback para agência representada no perfil caso contratos estejam vazios
      if (partners.length === 0) {
        const user = await StorageService.getUserById(session.id);
        const repAgencyId = (user?.profile as any)?.represented_agency_id;
        const repAgencyName = (user?.profile as any)?.represented_agency_name;
        if (repAgencyId) {
          partners.push({
            id: repAgencyId,
            name: repAgencyName || 'Sua Agência Corporativa',
            commissionRate: '20%',
            status: 'active',
          });
        }
      }

      if (queryAgencyId && partners.some((p) => p.id === queryAgencyId)) {
        targetAgencyId = queryAgencyId;
      } else if (partners.length > 0) {
        targetAgencyId = partners[0].id;
      }
    } else if (session.role === 'agencia') {
      targetAgencyId = session.id;
      const contracts = await StorageService.listAgencyContracts(session.id);
      
      partners = contracts.map((c) => ({
        id: c.modelId,
        name: c.modelName || 'Modelo do Roster',
        commissionRate: c.commissionRate,
        status: c.status,
      }));

      if (queryModelId && partners.some((p) => p.id === queryModelId)) {
        targetModelId = queryModelId;
      } else if (partners.length > 0) {
        targetModelId = partners[0].id;
      }
    }

    // Obter dados do contrato ativo selecionado
    let activeContract = null;
    if (targetAgencyId && targetModelId) {
      activeContract = await StorageService.getAgencyModelContract(targetAgencyId, targetModelId);
    }

    // Regra de Cota: Obter capacidade e uso total da Agência vinculada
    const agencyToBill = targetAgencyId || (session.role === 'agencia' ? session.id : 'user-agency-1');
    const [agencyUsage, agencySub, agencyUser] = await Promise.all([
      StorageService.getAgencyTotalDriveUsage(agencyToBill),
      BillingService.getUserSubscription(agencyToBill),
      StorageService.getUserById(agencyToBill),
    ]);

    const agencyPlan = getPlan(agencySub?.planId || 'select');
    const maxAgencyGB = typeof agencyPlan.limits.maxDriveStorageGB === 'number'
      ? agencyPlan.limits.maxDriveStorageGB
      : 100;
    const percentage = Number(Math.min(100, (agencyUsage.totalGB / maxAgencyGB) * 100).toFixed(1));
    const agencyName = (agencyUser?.profile as any)?.corporate_name || (agencyUser as any)?.user?.name || 'Agência Parceira';

    // Listar arquivos isolados estritamente para esta relação agencyId <-> modelId
    let files: any[] = [];
    if (targetAgencyId && targetModelId) {
      files = await StorageService.listSharedDriveFiles({
        agencyId: targetAgencyId,
        modelId: targetModelId,
      });
    }

    return NextResponse.json({
      success: true,
      files,
      contract: activeContract,
      partners,
      activePartnerId: session.role === 'criadora' ? targetAgencyId : targetModelId,
      activeAgencyId: targetAgencyId,
      activeModelId: targetModelId,
      storage: {
        usedGB: agencyUsage.totalGB,
        maxGB: maxAgencyGB,
        percentage,
        planName: agencyPlan.name,
        agencyName,
        fileCount: agencyUsage.fileCount,
      },
      isShared: true,
    });
  } catch (error) {
    console.error('Erro ao buscar arquivos do Drive Compartilhado:', error);
    return NextResponse.json({ error: 'Erro ao buscar arquivos do drive compartilhado' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const body = await req.json();
    const { agencyId, modelId, name, category, type, size, fileUrl } = body;

    let finalAgencyId = agencyId;
    let finalModelId = modelId;

    if (session.role === 'criadora') {
      finalModelId = session.id;
      if (!finalAgencyId) {
        const contracts = await StorageService.listModelContracts(session.id);
        finalAgencyId = contracts[0]?.agencyId;
        if (!finalAgencyId) {
          const user = await StorageService.getUserById(session.id);
          finalAgencyId = (user?.profile as any)?.represented_agency_id || 'user-agency-1';
        }
      }
    } else if (session.role === 'agencia') {
      finalAgencyId = session.id;
      if (!finalModelId) {
        return NextResponse.json({ error: 'modelId é obrigatório para upload da agência.' }, { status: 400 });
      }
    }

    if (!finalAgencyId || !finalModelId) {
      return NextResponse.json({ error: 'Vínculo entre agência e modelo não identificado.' }, { status: 400 });
    }

    // Validação de cota da agência
    const fileSizeStr = size || '1.5 MB';
    const newFileBytes = StorageService.parseSizeToBytes(fileSizeStr);
    const newFileGB = newFileBytes / (1024 * 1024 * 1024);

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
          error: `Limite de cota da Agência atingido (${maxAgencyGB} GB no plano ${agencyPlan.name}). A agência precisa realizar upgrade de plano.`,
        },
        { status: 403 }
      );
    }

    const file = await StorageService.saveSharedDriveFile({
      agencyId: finalAgencyId,
      modelId: finalModelId,
      name: name || 'Arquivo Compartilhado',
      category: category || 'raw-photos',
      type: type || 'image',
      size: fileSizeStr,
      uploadedById: session.id,
      uploadedByName: session.name || (session.role === 'agencia' ? 'Agência' : 'Modelo'),
      fileUrl: fileUrl || '',
    });

    const counterpartId = session.id === finalAgencyId ? finalModelId : finalAgencyId;
    const uploaderLabel = session.role === 'agencia' ? 'Sua Agência' : (session.name || 'Sua Modelo');
    try {
      await StorageService.createNotification({
        userId: counterpartId,
        title: 'Novo Arquivo no Drive Compartilhado',
        desc: `${uploaderLabel} adicionou o arquivo "${name || 'Arquivo Compartilhado'}" no Drive Compartilhado.`,
        category: 'Drive',
        type: 'info',
        link: '/dashboard/drive',
        linkText: 'Acessar Drive',
      });
    } catch (e) {
      console.warn('Erro ao criar notificação de drive compartilhado:', e);
    }

    return NextResponse.json({ success: true, file });
  } catch (error) {
    console.error('Erro ao salvar arquivo no Drive Compartilhado:', error);
    return NextResponse.json({ error: 'Erro ao salvar arquivo no drive compartilhado' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'ID e novo nome são obrigatórios.' }, { status: 400 });
    }

    const success = await StorageService.renameSharedDriveFile(id, name, session.id);
    if (!success) {
      return NextResponse.json({ error: 'Não foi possível renomear o arquivo ou permissão negada.' }, { status: 403 });
    }

    return NextResponse.json({ success: true, message: 'Arquivo renomeado com sucesso.' });
  } catch (error) {
    console.error('Erro ao renomear arquivo compartilhado:', error);
    return NextResponse.json({ error: 'Erro interno ao renomear' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do arquivo é obrigatório.' }, { status: 400 });
    }

    const success = await StorageService.deleteSharedDriveFile(id, session.id);
    if (!success) {
      return NextResponse.json({ error: 'Permissão negada ou arquivo não encontrado.' }, { status: 403 });
    }

    return NextResponse.json({ success: true, message: 'Arquivo excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir arquivo compartilhado:', error);
    return NextResponse.json({ error: 'Erro ao excluir arquivo' }, { status: 500 });
  }
}
