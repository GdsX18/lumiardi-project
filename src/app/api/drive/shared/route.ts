import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const agencyId = searchParams.get('agencyId');
    const modelId = searchParams.get('modelId');

    // Se o usuário for criadora, modelId é o próprio ID
    // Se o usuário for agência, agencyId é o próprio ID
    let targetAgencyId = agencyId;
    let targetModelId = modelId;

    if (session.role === 'criadora') {
      targetModelId = session.id;
    } else if (session.role === 'agencia') {
      targetAgencyId = session.id;
    }

    // Se temos agência e modelo especificados, verificar se possuem contrato
    let activeContract = null;
    if (targetAgencyId && targetModelId) {
      activeContract = await StorageService.getAgencyModelContract(targetAgencyId, targetModelId);
    }

    const files = await StorageService.listSharedDriveFiles({
      agencyId: targetAgencyId || undefined,
      modelId: targetModelId || undefined,
      currentUserId: session.role !== 'admin' ? session.id : undefined,
    });

    return NextResponse.json({
      files,
      contract: activeContract,
      isShared: true,
    });
  } catch (error) {
    console.error('Erro ao buscar arquivos do Drive Compartilhado:', error);
    return NextResponse.json({ error: 'Erro ao buscar arquivos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { agencyId, modelId, name, category, type, size, fileUrl } = body;

    let finalAgencyId = agencyId;
    let finalModelId = modelId;

    if (session.role === 'criadora') {
      finalModelId = session.id;
      // Se não especificou agência, busca agência representada no perfil
      if (!finalAgencyId) {
        const user = await StorageService.getUserById(session.id);
        finalAgencyId = (user?.profile as any)?.represented_agency_id || 'user-agency-1';
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

    const file = await StorageService.saveSharedDriveFile({
      agencyId: finalAgencyId,
      modelId: finalModelId,
      name: name || 'Arquivo Compartilhado',
      category: category || 'raw-photos',
      type: type || 'image',
      size: size || '1.5 MB',
      uploadedById: session.id,
      uploadedByName: session.name || (session.role === 'agencia' ? 'Agência' : 'Modelo'),
      fileUrl: fileUrl || '',
    });

    // Disparar notificação para a contraparte (Modelo ou Agência)
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
    return NextResponse.json({ error: 'Erro ao fazer upload do arquivo' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'ID e novo nome são obrigatórios' }, { status: 400 });
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
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do arquivo é obrigatório' }, { status: 400 });
    }

    const success = await StorageService.deleteSharedDriveFile(id, session.id);
    if (!success) {
      return NextResponse.json({ error: 'Permissão negada ou arquivo não encontrado' }, { status: 403 });
    }

    return NextResponse.json({ success: true, message: 'Arquivo excluído com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir arquivo compartilhado:', error);
    return NextResponse.json({ error: 'Erro ao excluir arquivo' }, { status: 500 });
  }
}
