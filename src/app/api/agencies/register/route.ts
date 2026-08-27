import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { sanitizeObject } from '@/lib/security';
import { encodeSession, SESSION_COOKIE_NAME, SessionUser } from '@/lib/auth';
import { CompleteAgencyProfile } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const sanitizedBody = sanitizeObject(rawBody) as CompleteAgencyProfile;

    if (!sanitizedBody.basicInfo?.responsibleName || !sanitizedBody.basicInfo?.corporateEmail) {
      return NextResponse.json(
        { error: 'Nome do responsável e e-mail corporativo são obrigatórios.' },
        { status: 400 }
      );
    }

    if (sanitizedBody.qualitative?.instagram && !sanitizedBody.qualitative.instagram.startsWith('@')) {
      sanitizedBody.qualitative.instagram = `@${sanitizedBody.qualitative.instagram.replace(/^@+/, '')}`;
    }

    const savedProfile = await StorageService.saveAgency({
      ...sanitizedBody,
      curationStatus: 'EM_CURATORIA',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    try {
      await StorageService.createNotification({
        userId: savedProfile.id,
        title: 'Cadastro Corporativo Submetido',
        desc: 'Os dados da sua agência foram submetidos com sucesso e estão em auditoria pela Mesa de Curadoria.',
        category: 'Curadoria',
        type: 'info',
        link: '/dashboard/pendente',
        linkText: 'Acompanhar Status',
      });
    } catch (e) {
      console.warn('Erro ao criar notificação de registro de agência:', e);
    }

    const sessionUser: SessionUser = {
      id: savedProfile.id,
      email: savedProfile.basicInfo.corporateEmail,
      name: savedProfile.basicInfo.responsibleName,
      role: 'agencia',
      curationStatus: 'EM_CURATORIA',
      documentName: savedProfile.basicInfo.document?.fileName,
      country: savedProfile.qualitative.country,
      city: savedProfile.qualitative.city,
      createdAt: savedProfile.createdAt,
    };

    const response = NextResponse.json({
      success: true,
      profileId: savedProfile.id,
      user: sessionUser,
      message: 'Cadastro corporativo submetido com sucesso. Status: EM_CURATORIA.',
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: encodeSession(sessionUser),
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno ao processar cadastro';
    return NextResponse.json(
      { error: 'Falha no processamento seguro dos dados.', details: message },
      { status: 500 }
    );
  }
}
