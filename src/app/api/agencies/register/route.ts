import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { sanitizeObject } from '@/lib/security';
import { encodeSession, SESSION_COOKIE_NAME, SessionUser, setSessionCookie } from '@/lib/auth';
import { CompleteAgencyProfile } from '@/types';
import { extractDocumentDataUrl, persistIdentityDocument, registrationErrorResponse } from '@/lib/registration';
import { readEnrollmentToken } from '@/lib/security/twoFactor';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    // Documento em Base64 vai para o vault R2, nunca para users.document_url (ver lib/registration)
    const documentDataUrl = extractDocumentDataUrl(rawBody?.basicInfo);
    const rawPassword = typeof rawBody?.basicInfo?.password === 'string' ? rawBody.basicInfo.password : '';
    // 2FA validado na etapa 1: o token cifrado pelo servidor carrega o segredo TOTP
    const twoFactorSecret = readEnrollmentToken(rawBody?.twoFactorEnrollmentToken);
    if (rawBody) delete rawBody.twoFactorEnrollmentToken;
    if (!twoFactorSecret) {
      return NextResponse.json(
        { error: 'A verificação 2FA expirou ou não foi concluída. Refaça a Blindagem de Acesso na etapa 1.', code: 'two_factor_required' },
        { status: 400 }
      );
    }
    const sanitizedBody = sanitizeObject(rawBody) as CompleteAgencyProfile;
    if (sanitizedBody.basicInfo) sanitizedBody.basicInfo.password = rawPassword;

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
      twoFactorSecret,
      curationStatus: 'EM_CURATORIA',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (documentDataUrl) {
      await persistIdentityDocument(savedProfile.id, documentDataUrl, savedProfile.basicInfo.document?.fileName);
    }

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

    setSessionCookie(response, sessionUser);

    return response;
  } catch (err: unknown) {
    return registrationErrorResponse(err, 'agencies/register');
  }
}
