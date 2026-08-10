import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { sanitizeObject } from '@/lib/security';
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
      curationStatus: 'submitted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      profileId: savedProfile.id,
      message: 'Cadastro corporativo e agendamento submetidos com sucesso.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno ao processar cadastro';
    return NextResponse.json(
      { error: 'Falha no processamento seguro dos dados.', details: message },
      { status: 500 }
    );
  }
}
