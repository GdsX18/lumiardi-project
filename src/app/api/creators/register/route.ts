import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { sanitizeObject } from '@/lib/security';
import { encodeSession, SESSION_COOKIE_NAME, SessionUser } from '@/lib/auth';
import { CompleteCreatorProfile } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const sanitizedBody = sanitizeObject(rawBody) as CompleteCreatorProfile;

    // Validações básicas de segurança
    if (!sanitizedBody.basicInfo?.fullName || !sanitizedBody.basicInfo?.email) {
      return NextResponse.json(
        { error: 'Nome completo e e-mail são obrigatórios.' },
        { status: 400 }
      );
    }

    if (!sanitizedBody.qualitative?.platforms?.instagram?.startsWith('@')) {
      if (sanitizedBody.qualitative?.platforms?.instagram) {
        sanitizedBody.qualitative.platforms.instagram = `@${sanitizedBody.qualitative.platforms.instagram.replace(/^@+/, '')}`;
      }
    }

    if (sanitizedBody.qualitative?.exposureOpinion) {
      sanitizedBody.qualitative.exposureOpinion = sanitizedBody.qualitative.exposureOpinion.slice(0, 50);
    }
    if (sanitizedBody.qualitative?.mainGoal) {
      sanitizedBody.qualitative.mainGoal = sanitizedBody.qualitative.mainGoal.slice(0, 50);
    }

    const savedProfile = await StorageService.saveCreator({
      ...sanitizedBody,
      curationStatus: 'EM_CURATORIA',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const sessionUser: SessionUser = {
      id: savedProfile.id,
      email: savedProfile.basicInfo.email,
      name: savedProfile.qualitative.artisticName || savedProfile.basicInfo.fullName,
      role: 'criadora',
      curationStatus: 'EM_CURATORIA',
      documentName: savedProfile.basicInfo.document?.fileName,
      category: savedProfile.qualitative.category,
      country: savedProfile.basicInfo.address?.country,
      city: savedProfile.basicInfo.address?.city,
      createdAt: savedProfile.createdAt,
    };

    const response = NextResponse.json({
      success: true,
      profileId: savedProfile.id,
      user: sessionUser,
      message: 'Candidatura submetida com sucesso. Status: EM_CURATORIA.',
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
