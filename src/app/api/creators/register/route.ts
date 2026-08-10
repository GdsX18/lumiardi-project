import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { sanitizeObject } from '@/lib/security';
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
      // Ajusta o @ se esquecido pelo usuário
      if (sanitizedBody.qualitative?.platforms?.instagram) {
        sanitizedBody.qualitative.platforms.instagram = `@${sanitizedBody.qualitative.platforms.instagram.replace(/^@+/, '')}`;
      }
    }

    // Trava de 50 caracteres para os campos de exposição e objetivo principal
    if (sanitizedBody.qualitative?.exposureOpinion) {
      sanitizedBody.qualitative.exposureOpinion = sanitizedBody.qualitative.exposureOpinion.slice(0, 50);
    }
    if (sanitizedBody.qualitative?.mainGoal) {
      sanitizedBody.qualitative.mainGoal = sanitizedBody.qualitative.mainGoal.slice(0, 50);
    }

    const savedProfile = await StorageService.saveCreator({
      ...sanitizedBody,
      curationStatus: 'submitted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      profileId: savedProfile.id,
      message: 'Candidatura e agendamento submetidos com sucesso para curadoria.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno ao processar cadastro';
    return NextResponse.json(
      { error: 'Falha no processamento seguro dos dados.', details: message },
      { status: 500 }
    );
  }
}
