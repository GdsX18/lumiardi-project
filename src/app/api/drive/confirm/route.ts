import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';
import { StorageService } from '@/services/storageService';
import { sanitizeInput } from '@/lib/security';
import { R2StorageService } from '@/lib/storage/r2Service';
import { canWriteMedia, normalizeMediaKey, parseMediaKey } from '@/lib/storage/mediaAccess';
import { normalizeCategory } from '@/lib/storage/uploadPolicy';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: 'Sessão expirada ou não autenticado.' }, { status: 401 });
    }

    const body = await req.json();
    const rawFileName = body.fileName || 'Arquivo';
    const name = sanitizeInput(rawFileName);
    // A chave do objeto é a fonte da verdade: define dono/espaço e a URL servida
    const fileKey = body.fileKey ? normalizeMediaKey(String(body.fileKey)) : null;
    if (!name || !fileKey) {
      return NextResponse.json(
        { error: 'Nome e chave do arquivo são obrigatórios para confirmação.', code: 'invalid_input' },
        { status: 400 }
      );
    }
    if (!canWriteMedia(fileKey, session)) {
      return NextResponse.json({ error: 'Sem permissão para este arquivo.', code: 'forbidden' }, { status: 403 });
    }

    const head = await R2StorageService.headObject(fileKey);
    if (!head) {
      return NextResponse.json({ error: 'Arquivo não encontrado no armazenamento.', code: 'not_found' }, { status: 404 });
    }

    const parsedKey = parseMediaKey(fileKey);
    const fileUrl = `/api/media/${fileKey}`;
    const category = normalizeCategory(body.category, parsedKey.category || 'raw-photos');
    const type = body.fileType || body.type || 'image';
    const size = `${(head.size / (1024 * 1024)).toFixed(1)} MB`;
    const context = parsedKey.isShared ? 'shared' : 'private';

    if (context === 'shared') {
      const agencyId = parsedKey.agencyId as string;
      const modelId = parsedKey.modelId as string;

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
    console.error('[Confirm Error]:', err);
    return NextResponse.json({ error: 'Erro ao confirmar arquivo no drive.', code: 'generic' }, { status: 500 });
  }
}

