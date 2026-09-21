import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';
import { StorageService } from '@/services/storageService';
import { sanitizeInput } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: 'Sessão expirada ou não autenticado.' }, { status: 401 });
    }

    const body = await req.json();
    const rawFileName = body.fileName || 'Arquivo';
    const name = sanitizeInput(rawFileName);
    const fileUrl = body.fileUrl || (body.fileKey ? `/api/media/${body.fileKey}` : '');
    const category = body.category || 'raw-photos';
    const type = body.fileType || body.type || 'image';
    const size = typeof body.fileSize === 'number'
      ? `${(body.fileSize / (1024 * 1024)).toFixed(1)} MB`
      : (body.fileSize || '1.0 MB');
    const context = body.context === 'shared' ? 'shared' : 'private';

    if (!name || !fileUrl) {
      return NextResponse.json(
        { error: 'Nome e URL do arquivo são obrigatórios para confirmação.' },
        { status: 400 }
      );
    }

    if (context === 'shared') {
      const { agencyId, modelId } = body;
      if (!agencyId || !modelId) {
        return NextResponse.json(
          { error: 'agencyId e modelId são obrigatórios para o Drive Compartilhado.' },
          { status: 400 }
        );
      }

      const savedFile = await StorageService.saveSharedDriveFile({
        agencyId,
        modelId,
        name,
        category,
        type,
        size,
        uploadedById: session.id,
        uploadedByName: session.name || (session.role === 'agencia' ? 'Agência Parceira' : 'Modelo'),
        fileUrl,
      });

      // Disparar notificação para a contraparte
      const counterpartId = session.id === agencyId ? modelId : agencyId;
      const uploaderLabel = session.role === 'agencia' ? 'Sua Agência' : (session.name || 'Sua Modelo');

      try {
        await StorageService.createNotification({
          userId: counterpartId,
          title: 'Novo Arquivo no Drive Compartilhado',
          desc: `${uploaderLabel} enviou o arquivo "${name}" para a pasta compartilhada.`,
          category: 'Drive',
          type: 'info',
          link: '/dashboard/drive',
          linkText: 'Acessar Drive',
        });
      } catch (notifErr) {
        console.warn('Erro ao registrar notificação de drive compartilhado:', notifErr);
      }

      return NextResponse.json({ success: true, file: savedFile });
    }

    // Drive Privado
    const savedFile = await StorageService.saveDriveFile({
      userId: session.id,
      name,
      category,
      type,
      size,
      uploadedBy: session.name || 'Você',
      fileUrl,
      privacy: body.privacy || 'agency-only',
    });

    return NextResponse.json({ success: true, file: savedFile });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao confirmar arquivo no drive';
    console.error('[Confirm Error]:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

