import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { sanitizeObject } from '@/lib/security';
import { encodeSession, SESSION_COOKIE_NAME, SessionUser } from '@/lib/auth';
import { CompleteCreatorProfile, CompleteAgencyProfile } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const type = rawBody.type || (rawBody.responsibleName || rawBody.basicInfo?.responsibleName ? 'agencia' : 'criadora');
    const sanitized = sanitizeObject(rawBody);

    if (type === 'criadora') {
      const creatorData = sanitized as CompleteCreatorProfile;
      const email = creatorData.basicInfo?.email;
      const name = creatorData.qualitative?.artisticName || creatorData.basicInfo?.fullName;

      if (!email || !name) {
        return NextResponse.json(
          { error: 'Nome e e-mail são obrigatórios para cadastro.' },
          { status: 400 }
        );
      }

      // Validação de e-mail existente
      const existing = await StorageService.findCreatorByEmail(email);
      if (existing) {
        return NextResponse.json(
          { error: 'Este e-mail já possui cadastro na plataforma Lumiardi.' },
          { status: 409 }
        );
      }

      const saved = await StorageService.saveCreator({
        ...creatorData,
        curationStatus: 'EM_CURATORIA',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const sessionUser: SessionUser = {
        id: saved.id,
        email: saved.basicInfo.email,
        name: saved.qualitative.artisticName || saved.basicInfo.fullName,
        role: 'criadora',
        curationStatus: 'EM_CURATORIA',
        documentName: saved.basicInfo.document?.fileName,
        category: saved.qualitative.category,
        country: saved.basicInfo.address?.country,
        city: saved.basicInfo.address?.city,
        createdAt: saved.createdAt,
      };

      const response = NextResponse.json({
        success: true,
        user: sessionUser,
        message: 'Cadastro recebido com sucesso. Status: EM_CURATORIA.',
      });

      // Define o cookie de sessão httpOnly
      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: encodeSession(sessionUser),
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 dias
      });

      return response;
    } else {
      const agencyData = sanitized as CompleteAgencyProfile;
      const email = agencyData.basicInfo?.corporateEmail;
      const name = agencyData.basicInfo?.responsibleName || agencyData.qualitative?.instagram;

      if (!email || !name) {
        return NextResponse.json(
          { error: 'Responsável e e-mail corporativo são obrigatórios.' },
          { status: 400 }
        );
      }

      const existing = await StorageService.findAgencyByEmail(email);
      if (existing) {
        return NextResponse.json(
          { error: 'Este e-mail corporativo já possui cadastro.' },
          { status: 409 }
        );
      }

      const saved = await StorageService.saveAgency({
        ...agencyData,
        curationStatus: 'EM_CURATORIA',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const sessionUser: SessionUser = {
        id: saved.id,
        email: saved.basicInfo.corporateEmail,
        name: saved.basicInfo.responsibleName,
        role: 'agencia',
        curationStatus: 'EM_CURATORIA',
        documentName: saved.basicInfo.document?.fileName,
        country: saved.qualitative.country,
        city: saved.qualitative.city,
        createdAt: saved.createdAt,
      };

      const response = NextResponse.json({
        success: true,
        user: sessionUser,
        message: 'Cadastro de agência recebido com sucesso. Status: EM_CURATORIA.',
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
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro no processamento do cadastro';
    return NextResponse.json(
      { error: 'Falha no processamento seguro do registro.', details: message },
      { status: 500 }
    );
  }
}
